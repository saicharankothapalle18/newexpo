import { RawReport, UnifiedIncident, CorrelationBreakdown, SystemCorrelationConfig } from '../types';
import { calculateDistanceKm } from './geo';
import { calculateTextSimilarity } from './nlp';

export const DEFAULT_CORRELATION_CONFIG: SystemCorrelationConfig = {
    spatialWeight: 0.40,
    categoryWeight: 0.20,
    temporalWeight: 0.15,
    semanticWeight: 0.15,
    landmarkWeight: 0.10,
    maxRadiusKm: 3.0,
    maxTimeWindowMins: 60,
    autoLinkThreshold: 75,
    candidateThreshold: 45,
    autoIngestEnabled: true,
    autoIngestSpeedSeconds: 12
};

/**
 * Calculates detailed correlation breakdown between a raw report and a unified incident.
 */
export function evaluateReportToIncidentCorrelation(
    report: RawReport,
    incident: UnifiedIncident,
    config: SystemCorrelationConfig = DEFAULT_CORRELATION_CONFIG
): CorrelationBreakdown {
    // 1. Spatial Score (Haversine Distance)
    const distKm = calculateDistanceKm(
        report.latitude,
        report.longitude,
        incident.latitude,
        incident.longitude
    );

    let spatialScore = 0;
    if (distKm <= config.maxRadiusKm) {
        spatialScore = Math.max(0, 100 * (1 - distKm / config.maxRadiusKm));
    }

    // 2. Temporal Score (Exponential time decay)
    const reportTime = new Date(report.timestamp).getTime();
    const incidentTime = new Date(incident.createdTime).getTime();
    const diffMs = Math.abs(reportTime - incidentTime);
    const timeDiffMins = diffMs / (1000 * 60);

    let temporalScore = 0;
    if (timeDiffMins <= config.maxTimeWindowMins) {
        // exponential decay lambda ~ 0.035
        temporalScore = Math.round(100 * Math.exp(-0.035 * timeDiffMins));
    }

    // 3. Category Score
    let categoryScore = 0;
    if (report.category === incident.category) {
        categoryScore = 100;
    } else if (isCompatibleCategory(report.category, incident.category)) {
        categoryScore = 70;
    } else {
        categoryScore = 10;
    }

    // 4. Semantic / Text Score
    const textSim = calculateTextSimilarity(report.rawText, incident.summary);
    const semanticScore = Math.round(textSim * 100);

    // 5. Landmark / Address Score
    let landmarkScore = 50;
    if (report.landmark && incident.landmark && report.landmark.toLowerCase() === incident.landmark.toLowerCase()) {
        landmarkScore = 95;
    } else if (report.locationName && incident.locationDescription &&
        (report.locationName.toLowerCase().includes(incident.locationDescription.toLowerCase()) ||
         incident.locationDescription.toLowerCase().includes(report.locationName.toLowerCase()))) {
        landmarkScore = 80;
    }

    // Composite Weighted Sum
    const compositeScore = Math.round(
        spatialScore * config.spatialWeight +
        temporalScore * config.temporalWeight +
        categoryScore * config.categoryWeight +
        semanticScore * config.semanticWeight +
        landmarkScore * (config.landmarkWeight || 0.10)
    );

    let recommendation: 'AUTO_LINK' | 'CANDIDATE_REVIEW' | 'NO_MATCH' = 'NO_MATCH';
    if (compositeScore >= config.autoLinkThreshold) {
        recommendation = 'AUTO_LINK';
    } else if (compositeScore >= config.candidateThreshold) {
        recommendation = 'CANDIDATE_REVIEW';
    }

    return {
        spatialScore: Math.round(spatialScore),
        temporalScore,
        categoryScore,
        semanticScore,
        landmarkScore,
        compositeScore,
        distanceKm: Number(distKm.toFixed(3)),
        timeDiffMinutes: Math.round(timeDiffMins),
        recommendation
    };
}

/**
 * Checks whether two categories are closely related (e.g. traffic accident & power grid crash)
 */
function isCompatibleCategory(cat1: string, cat2: string): boolean {
    const compatiblePairs = [
        ['TRAFFIC_ACCIDENT', 'POWER_GRID_OUTAGE'],
        ['STRUCTURE_FIRE', 'HAZMAT_CHEMICAL'],
        ['WILD_FIRE', 'STRUCTURE_FIRE'],
        ['FLOOD_STORM', 'POWER_GRID_OUTAGE'],
        ['EARTHQUAKE_SEISMIC', 'STRUCTURE_FIRE'],
        ['TRAFFIC_ACCIDENT', 'MEDICAL_EMERGENCY']
    ];

    return compatiblePairs.some(
        ([a, b]) => (cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)
    );
}
