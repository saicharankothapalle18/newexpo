import { RawReport, UnifiedIncident, IncidentMatch, getCategoryDisplayLabel } from '../types';
import { calculateDistanceKm } from './geo';
import { calculateTextSimilarity } from './nlp';

export interface MatchingWeights {
    locationWeight: number;    // default 0.40 (40%)
    typeWeight: number;        // default 0.20 (20%)
    timeWeight: number;        // default 0.15 (15%)
    descriptionWeight: number; // default 0.15 (15%)
    landmarkWeight: number;    // default 0.10 (10%)
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
    locationWeight: 0.40,
    typeWeight: 0.20,
    timeWeight: 0.15,
    descriptionWeight: 0.15,
    landmarkWeight: 0.10
};

/**
 * Normalizes categories for comparison.
 */
function normalizeCategory(category: string): string {
    if (category === 'TRAFFIC_ACCIDENT') return 'ROAD_ACCIDENT';
    if (category === 'STRUCTURE_FIRE' || category === 'WILD_FIRE') return 'FIRE';
    if (category === 'FLOOD_STORM') return 'FLOOD';
    return category;
}

/**
 * 1. Location similarity score (0 - 100)
 */
export function calculateLocationScore(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    maxThresholdKm = 4.0
): { score: number; distanceKm: number } {
    const distKm = calculateDistanceKm(lat1, lng1, lat2, lng2);

    if (distKm <= 0.2) return { score: 100, distanceKm: distKm };
    if (distKm <= 0.5) return { score: 92, distanceKm: distKm };
    if (distKm <= 1.0) return { score: 80, distanceKm: distKm };
    if (distKm <= 2.0) return { score: 55, distanceKm: distKm };
    if (distKm <= maxThresholdKm) {
        return {
            score: Math.max(0, Math.round(100 * (1 - distKm / maxThresholdKm))),
            distanceKm: distKm
        };
    }
    return { score: 0, distanceKm: distKm };
}

/**
 * 2. Incident type similarity score (0 - 100)
 */
export function calculateTypeScore(type1: string, type2: string): number {
    const norm1 = normalizeCategory(type1);
    const norm2 = normalizeCategory(type2);

    if (norm1 === norm2) return 100;

    // Compatible correlated disasters
    const compatiblePairs = [
        ['ROAD_ACCIDENT', 'MEDICAL_EMERGENCY'],
        ['FIRE', 'BUILDING_EMERGENCY'],
        ['FIRE', 'HAZMAT_CHEMICAL'],
        ['FLOOD', 'HEAVY_RAIN'],
        ['NATURAL_DISASTER', 'BUILDING_EMERGENCY'],
        ['POWER_GRID_OUTAGE', 'ROAD_ACCIDENT']
    ];

    const isCompatible = compatiblePairs.some(
        ([a, b]) => (norm1 === a && norm2 === b) || (norm1 === b && norm2 === a)
    );

    return isCompatible ? 70 : 10;
}

/**
 * 3. Reported time similarity score (0 - 100)
 */
export function calculateTimeScore(
    time1Str: string,
    time2Str: string,
    maxWindowMins = 120
): { score: number; timeDiffMinutes: number } {
    const t1 = new Date(time1Str).getTime();
    const t2 = new Date(time2Str).getTime();
    const diffMs = Math.abs(t1 - t2);
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins <= 15) return { score: 100, timeDiffMinutes: diffMins };
    if (diffMins <= 30) return { score: 90, timeDiffMinutes: diffMins };
    if (diffMins <= 60) return { score: 75, timeDiffMinutes: diffMins };
    if (diffMins <= maxWindowMins) {
        return {
            score: Math.max(0, Math.round(100 * Math.exp(-0.025 * diffMins))),
            timeDiffMinutes: diffMins
        };
    }
    return { score: 10, timeDiffMinutes: diffMins };
}

/**
 * 4. Situation description text similarity score (0 - 100)
 */
export function calculateDescriptionScore(text1: string, text2: string): number {
    const sim = calculateTextSimilarity(text1, text2);
    return Math.min(100, Math.round(sim * 100));
}

/**
 * 5. Landmark / Address similarity score (0 - 100)
 */
export function calculateLandmarkScore(
    address1: string,
    landmark1: string | undefined,
    address2: string,
    landmark2: string | undefined
): { score: number; matchedText?: string } {
    const full1 = `${address1} ${landmark1 || ''}`.toLowerCase();
    const full2 = `${address2} ${landmark2 || ''}`.toLowerCase();

    // Direct token overlap
    const tokens1 = full1.split(/[\s,.-]+/).filter(w => w.length > 3);
    const tokens2 = full2.split(/[\s,.-]+/).filter(w => w.length > 3);

    const matches: string[] = [];
    tokens1.forEach(t => {
        if (tokens2.includes(t) && !matches.includes(t)) {
            matches.push(t);
        }
    });

    if (matches.length >= 3) {
        return { score: 100, matchedText: matches.join(', ') };
    }
    if (matches.length === 2) {
        return { score: 85, matchedText: matches.join(', ') };
    }
    if (matches.length === 1) {
        return { score: 65, matchedText: matches[0] };
    }

    const levSim = calculateTextSimilarity(full1, full2);
    return { score: Math.round(levSim * 60) };
}

/**
 * Main Duplicate Matching Engine:
 * Compares incoming Report against ACTIVE Incidents using weighted factors:
 * - Location: 40%
 * - Incident type: 20%
 * - Time: 15%
 * - Situation description: 15%
 * - Landmark / address: 10%
 * 
 * Returns matches sorted by confidence descending.
 */
export function matchReportAgainstActiveIncidents(
    report: Partial<RawReport>,
    incidents: UnifiedIncident[],
    weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS
): IncidentMatch[] {
    const matches: IncidentMatch[] = [];

    const repId = report.id || 'NEW-REPORT';
    const repLat = report.latitude ?? 37.7749;
    const repLng = report.longitude ?? -122.4194;
    const repCat = report.category || 'ROAD_ACCIDENT';
    const repTime = report.timestamp || new Date().toISOString();
    const repText = report.rawText || '';
    const repLocName = report.locationName || '';
    const repLandmark = report.landmark;

    // Filter to active incidents only (RESOLVED / CLOSED excluded)
    const activeIncidents = incidents.filter(
        i => i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    );

    activeIncidents.forEach(incident => {
        // 1. Location
        const { score: locationScore, distanceKm } = calculateLocationScore(
            repLat,
            repLng,
            incident.latitude,
            incident.longitude
        );

        // 2. Incident Type
        const typeScore = calculateTypeScore(repCat, incident.category);

        // 3. Time
        const incidentTime = incident.lastUpdatedAt || incident.lastUpdatedTime || incident.createdTime;
        const { score: timeScore, timeDiffMinutes } = calculateTimeScore(
            repTime,
            incidentTime
        );

        // 4. Description
        const descriptionScore = calculateDescriptionScore(
            repText,
            incident.summary
        );

        // 5. Landmark / Address
        const { score: landmarkScore, matchedText } = calculateLandmarkScore(
            repLocName,
            repLandmark,
            incident.locationDescription,
            incident.landmark
        );

        // Composite Weighted Match Confidence %
        const matchConfidence = Math.round(
            locationScore * weights.locationWeight +
            typeScore * weights.typeWeight +
            timeScore * weights.timeWeight +
            descriptionScore * weights.descriptionWeight +
            landmarkScore * weights.landmarkWeight
        );

        // Assemble explanation reasons
        const reasons: string[] = [];

        if (locationScore >= 70) {
            const distDesc = distanceKm < 1
                ? `${Math.round(distanceKm * 1000)}m away`
                : `${distanceKm.toFixed(1)} km away`;
            reasons.push(`Same/similar location (${distDesc})`);
        } else if (locationScore >= 40) {
            reasons.push(`In proximity area (${distanceKm.toFixed(1)} km)`);
        }

        if (typeScore >= 80) {
            reasons.push(`Same incident type (${getCategoryDisplayLabel(incident.category)})`);
        } else if (typeScore >= 60) {
            reasons.push(`Related crisis category`);
        }

        if (timeScore >= 70) {
            reasons.push(`Similar time (within ${timeDiffMinutes} min)`);
        }

        if (descriptionScore >= 50) {
            reasons.push(`Similar situation description & keywords`);
        }

        if (landmarkScore >= 60) {
            reasons.push(`Matching landmark/address keywords${matchedText ? ` ("${matchedText}")` : ''}`);
        }

        // Only include if there is some meaningful correlation (>= 30% confidence)
        if (matchConfidence >= 30) {
            matches.push({
                reportId: repId,
                incidentId: incident.id,
                matchConfidence: Math.min(99, Math.max(1, matchConfidence)),
                isLikelyRelated: matchConfidence >= 45,
                reasons: reasons.length > 0 ? reasons : ['General spatiotemporal correlation'],
                weightsBreakdown: {
                    locationScore,
                    typeScore,
                    timeScore,
                    descriptionScore,
                    landmarkScore
                },
                distanceKm: Number(distanceKm.toFixed(3)),
                timeDiffMinutes
            });
        }
    });

    // Sort highest confidence first
    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
}
