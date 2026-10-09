import { IncidentCategory, SeverityLevel } from '../types';

const CATEGORY_KEYWORDS: Record<IncidentCategory, string[]> = {
    ROAD_ACCIDENT: ['car', 'crash', 'collision', 'freeway', 'highway', 'overturned', 'truck', 'vehicle', 'traffic', 'pileup', 'roadblock', 'head-on', 'bus', 'pedestrian'],
    TRAFFIC_ACCIDENT: ['car', 'crash', 'collision', 'freeway', 'highway', 'overturned', 'truck', 'vehicle', 'traffic', 'pileup', 'roadblock', 'head-on'],
    FIRE: ['smoke', 'flames', 'fire', 'building', 'apartment', 'house', 'roof', 'structure', 'blaze', 'explosion', 'commercial', 'wildfire', 'brush'],
    STRUCTURE_FIRE: ['smoke', 'flames', 'fire', 'building', 'apartment', 'house', 'roof', 'structure', 'blaze', 'explosion', 'commercial'],
    WILD_FIRE: ['brush', 'wildfire', 'forest', 'canyon', 'dry grass', 'timber', 'spread', 'evacuation', 'hills', 'smoke plume'],
    FLOOD: ['water', 'flooding', 'torrent', 'river', 'overflow', 'submerged', 'heavy rain', 'storm', 'levee', 'rescue boat', 'inundation', 'drainage'],
    FLOOD_STORM: ['water', 'flooding', 'torrent', 'river', 'overflow', 'submerged', 'heavy rain', 'storm', 'levee', 'rescue boat'],
    HEAVY_RAIN: ['heavy rain', 'downpour', 'monsoon', 'torrential', 'rainstorm', 'cloudburst', 'thunderstorm', 'precipitation', 'waterlogging'],
    BUILDING_EMERGENCY: ['collapse', 'structural failure', 'cracks', 'elevator stuck', 'building leaning', 'balcony collapsed', 'roof collapse'],
    MEDICAL_EMERGENCY: ['unconscious', 'heart attack', 'cardiac', 'bleeding', 'fracture', 'stroke', 'pedestrian hit', 'injured', 'trauma', 'ambulance', 'breathing difficulty'],
    MISSING_PERSON: ['missing', 'lost child', 'disappeared', 'search party', 'last seen', 'abduction', 'runaway'],
    NATURAL_DISASTER: ['landslide', 'mudslide', 'tornado', 'cyclone', 'hurricane', 'tsunami', 'volcano', 'avalanche'],
    EARTHQUAKE_SEISMIC: ['quake', 'tremor', 'aftershock', 'shaking', 'collapsed', 'rubble', 'seismic', 'fault', 'epicenter'],
    HAZMAT_CHEMICAL: ['chemical', 'leak', 'spill', 'toxic', 'gas', 'fumes', 'chlorine', 'acid', 'odor', 'refinery', 'industrial', 'hazmat'],
    POWER_GRID_OUTAGE: ['transformer', 'blackout', 'sparks', 'power line', 'grid', 'substation', 'downed wire', 'outage', 'electricity'],
    SECURITY_CIVIL: ['gunshot', 'armed', 'robbery', 'riot', 'civil unrest', 'threat', 'active shooter', 'hostage', 'suspicious package'],
    OTHER: ['emergency', 'hazard', 'urgent', 'assistance needed', 'incident']
};

const CRITICAL_KEYWORDS = ['fatal', 'trapped', 'multiple casualties', 'massive', 'unconscious', 'explosion', 'raging', 'evacuate', 'hazmat', 'active shooter'];
const HIGH_KEYWORDS = ['injured', 'flames', 'smoke', 'blocked', 'bleeding', 'toxic', 'submerged', 'downed line'];

/**
 * Tokenize text into normalized unique keywords
 */
export function extractKeywords(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !COMMON_STOPWORDS.has(word));
}

const COMMON_STOPWORDS = new Set([
    'this', 'that', 'with', 'from', 'have', 'there', 'were', 'which', 'about', 'some',
    'into', 'more', 'other', 'them', 'then', 'these', 'would', 'first', 'also', 'after',
    'caller', 'reporting', 'reported', 'near', 'location', 'please', 'going', 'scene'
]);

/**
 * Jaccard similarity index between two texts (0.0 to 1.0)
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
    const setA = new Set(extractKeywords(text1));
    const setB = new Set(extractKeywords(text2));

    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return intersection.size / union.size;
}

/**
 * AI Disaster Category Classifier
 */
export function classifyReportText(text: string): {
    category: IncidentCategory;
    confidence: number;
} {
    const words = extractKeywords(text);
    let bestCategory: IncidentCategory = 'TRAFFIC_ACCIDENT';
    let maxScore = 0;

    (Object.keys(CATEGORY_KEYWORDS) as IncidentCategory[]).forEach(cat => {
        const keywords = CATEGORY_KEYWORDS[cat];
        let matches = 0;
        words.forEach(word => {
            if (keywords.some(kw => kw.includes(word) || word.includes(kw))) {
                matches++;
            }
        });

        if (matches > maxScore) {
            maxScore = matches;
            bestCategory = cat;
        }
    });

    const confidence = maxScore === 0 ? 50 : Math.min(95, 60 + maxScore * 12);
    return { category: bestCategory, confidence };
}

/**
 * AI Severity Suggestion Generator
 */
export function suggestSeverity(text: string, category: IncidentCategory): {
    severity: SeverityLevel;
    confidence: number;
} {
    const lower = text.toLowerCase();

    let hasCritical = CRITICAL_KEYWORDS.some(kw => lower.includes(kw));
    let hasHigh = HIGH_KEYWORDS.some(kw => lower.includes(kw));

    if (hasCritical || category === 'HAZMAT_CHEMICAL' || category === 'WILD_FIRE') {
        return { severity: 'CRITICAL', confidence: hasCritical ? 92 : 82 };
    }
    if (hasHigh || category === 'STRUCTURE_FIRE' || category === 'FLOOD_STORM') {
        return { severity: 'HIGH', confidence: 85 };
    }
    if (category === 'TRAFFIC_ACCIDENT' || category === 'POWER_GRID_OUTAGE') {
        return { severity: 'MEDIUM', confidence: 78 };
    }
    return { severity: 'LOW', confidence: 70 };
}
