export type UserRole = 'OPERATOR' | 'SUPERVISOR' | 'RESPONDER' | 'ADMIN';

export type ReportSourceType = 'PHONE_CALL' | 'PUBLIC_REPORT' | 'OFFICIAL_ALERT' | 'PUBLIC_FEED' | 'RESPONDER_FIELD';

export type VerificationState = 'UNVERIFIED' | 'PARTIALLY_VERIFIED' | 'VERIFIED' | 'MISLEADING_FLAGGED';

export type IncidentCategory =
    | 'ROAD_ACCIDENT'
    | 'TRAFFIC_ACCIDENT' // alias
    | 'FIRE'
    | 'STRUCTURE_FIRE' // alias
    | 'WILD_FIRE' // alias
    | 'FLOOD'
    | 'FLOOD_STORM' // alias
    | 'HEAVY_RAIN'
    | 'BUILDING_EMERGENCY'
    | 'MEDICAL_EMERGENCY'
    | 'MISSING_PERSON'
    | 'NATURAL_DISASTER'
    | 'EARTHQUAKE_SEISMIC'
    | 'HAZMAT_CHEMICAL'
    | 'POWER_GRID_OUTAGE'
    | 'SECURITY_CIVIL'
    | 'OTHER';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Risk-Zone System: ONLY THREE RISK LEVELS. NO GREEN!
export type RiskLevel = 'RED' | 'ORANGE' | 'YELLOW';

// GPS & Geocoding accuracy tracking
export type LocationAccuracy = 'EXACT_GPS' | 'APPROXIMATE' | 'UNKNOWN' | 'TEXT_DERIVED';

export type IncidentStatus =
    | 'NEW'
    | 'UNDER_VERIFICATION'
    | 'UNDER_REVIEW' // alias
    | 'POSSIBLE_DUPLICATE'
    | 'VERIFIED'
    | 'RESPONSE_COORDINATED'
    | 'RESPONSE_REQUESTED' // alias
    | 'IN_PROGRESS'
    | 'TEAM_ASSIGNED' // alias
    | 'RESPONDING' // alias
    | 'RESOLVED'
    | 'CLOSED';

export interface RawReport {
    id: string; // e.g., "REP-1048"
    sourceType: ReportSourceType;
    sourceName: string; // e.g., "911 Call Intake #401", "Cellular Emergency Transfer"
    verificationState: VerificationState;
    timestamp: string; // ISO String (Received time)
    reporterName?: string;
    contactNumber?: string;
    latitude: number;
    longitude: number;
    locationName: string; // Address / Location
    landmark?: string;
    country?: string; // e.g., "India", "USA", "UK", "Japan", "Australia", "Canada"
    state?: string;   // e.g., "Andhra Pradesh", "California", "England", "Kanto"
    city?: string;    // e.g., "Vijayawada", "Visakhapatnam", "London", "Tokyo"
    timeZone?: string; // e.g., "IST (UTC+5:30)", "GMT (UTC+0)", "JST (UTC+9)"
    locationAccuracy?: LocationAccuracy;
    rawText: string; // Situation description
    affectedPeople?: number;
    extractedTextKeywords: string[];

    // AI Suggestions (Mandatory Labeling)
    category: IncidentCategory;
    aiSuggestedCategory: IncidentCategory;
    aiCategoryConfidence: number; // 0-100
    aiSuggestedSeverity: SeverityLevel;
    aiSeverityConfidence: number; // 0-100

    assignedIncidentId?: string | null;
    isFlaggedMisleading: boolean;
    flaggedReason?: string;
    acknowledgedSeparate?: boolean; // Operator decided to keep it as an independent incident
    notes?: string[];
}

export interface OperatorUser {
    id: string;
    name: string;
    role: UserRole;
    consoleNumber: string;
    shift: 'MORNING' | 'DAY' | 'NIGHT';
    badgeNumber: string;
    stationName: string;
}

export interface CorrelationBreakdown {
    spatialScore: number;   // 0-100 (Location similarity: 40%)
    temporalScore: number;  // 0-100 (Time similarity: 15%)
    categoryScore: number;  // 0-100 (Incident type: 20%)
    semanticScore: number;  // 0-100 (Description similarity: 15%)
    landmarkScore: number;  // 0-100 (Landmark/address similarity: 10%)
    compositeScore: number; // 0-100
    distanceKm: number;
    timeDiffMinutes: number;
    recommendation: 'AUTO_LINK' | 'CANDIDATE_REVIEW' | 'NO_MATCH';
}

export interface IncidentMatch {
    reportId: string;
    incidentId: string;
    matchConfidence: number; // 0 - 100 percentage (e.g. 92)
    isLikelyRelated: boolean;
    reasons: string[];
    weightsBreakdown: {
        locationScore: number;    // 40% weight
        typeScore: number;        // 20% weight
        timeScore: number;        // 15% weight
        descriptionScore: number; // 15% weight
        landmarkScore: number;    // 10% weight
    };
    distanceKm: number;
    timeDiffMinutes: number;
}

export interface CandidateLink {
    reportId: string;
    targetIncidentId: string;
    breakdown: CorrelationBreakdown;
    detectedAt: string;
    status: 'PENDING_OPERATOR' | 'MERGED' | 'REJECTED';
}

export interface IncidentTimelineEvent {
    id: string;
    timestamp: string;
    type:
        | 'REPORT_RECEIVED'
        | 'DUPLICATE_DETECTED'
        | 'REPORT_ATTACHED'
        | 'AFFECTED_COUNT_UPDATED'
        | 'SEVERITY_UPDATED'
        | 'TEAM_COORDINATED'
        | 'STATUS_CHANGED'
        | 'NOTE_ADDED';
    description: string;
    authorName?: string;
    reportId?: string;
    teamId?: string;
}

export interface UnifiedIncident {
    id: string; // e.g., "INC-1001", "INC-2026-001"
    title: string;
    category: IncidentCategory;
    severity: SeverityLevel;
    status: IncidentStatus;
    latitude: number;
    longitude: number;
    locationDescription: string;
    landmark?: string;
    country?: string; // e.g., "India", "USA", "UK", "Japan", "Australia", "Canada"
    state?: string;   // e.g., "Andhra Pradesh", "California", "England", "Kanto"
    city?: string;    // e.g., "Vijayawada", "Visakhapatnam", "London", "Tokyo"
    timeZone?: string; // e.g., "IST (UTC+5:30)", "GMT (UTC+0)", "JST (UTC+9)"
    locationAccuracy: LocationAccuracy;
    summary: string;
    createdTime: string;
    lastUpdatedTime: string;
    firstReportedAt?: string;
    lastUpdatedAt?: string;
    primaryOperatorId?: string;
    verifiedBy?: string;
    verifiedAt?: string;

    childReportIds: string[];
    candidateReportIds: string[];

    victimEstCount: number;
    affectedPeople?: number;
    hazmatInvolved: boolean;
    assignedUnitIds: string[];
    responseTeamAssignments?: ResponseTeamAssignment[];
    notes: IncidentNote[];
    timelineEvents?: IncidentTimelineEvent[];
}

export interface IncidentNote {
    id: string;
    timestamp: string;
    authorId: string;
    authorRole: UserRole;
    text: string;
    isSystemGenerated?: boolean;
}

export type UnitType = 'FIRE' | 'MEDICAL' | 'POLICE' | 'HAZMAT' | 'RESCUE' | 'DISASTER_RESPONSE' | 'OTHER_AUTHORIZED';

export type ResponseTeamType = 'POLICE' | 'MEDICAL' | 'FIRE_RESCUE' | 'DISASTER_RESPONSE' | 'HAZMAT' | 'OTHER_AUTHORIZED';

export type UnitStatus = 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'OFFLINE';

export interface ResponseUnit {
    id: string; // e.g., "ENG-101", "POLICE-40"
    callSign: string;
    unitType: UnitType;
    status: UnitStatus;
    assignedIncidentId?: string | null;
    latitude: number;
    longitude: number;
    personnelCount: number;
    etaMinutes?: number;
    lastUpdated: string;
}

export interface ResponseTeamAssignment {
    id: string;
    teamId: string;
    teamName: string;
    teamType: ResponseTeamType;
    incidentId: string;
    status: 'REQUESTED' | 'ASSIGNED' | 'EN_ROUTE' | 'ON_SCENE' | 'COMPLETED';
    assignedAt: string;
    operatorNotes?: string;
    authorizedBy?: string;
}

export type AuditActionType =
    | 'REPORT_INGESTED'
    | 'INCIDENT_CREATED'
    | 'HUMAN_VERIFIED'
    | 'REPORTS_MERGED'
    | 'REPORT_UNLINKED'
    | 'UNIT_DISPATCHED'
    | 'TEAM_COORDINATED'
    | 'UNIT_STATUS_UPDATED'
    | 'INCIDENT_STATUS_CHANGED'
    | 'REPORT_FLAGGED_MISLEADING'
    | 'AI_CLASSIFICATION_OVERRIDDEN'
    | 'SYSTEM_CONFIG_UPDATED'
    | 'DATASET_CLEANUP';

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    actionType: AuditActionType;
    incidentId?: string;
    reportId?: string;
    unitId?: string;
    summary: string;
    details?: Record<string, any>;
}

export interface SystemCorrelationConfig {
    spatialWeight: number;    // default 0.40 (Location: 40%)
    categoryWeight: number;   // default 0.20 (Incident type: 20%)
    temporalWeight: number;   // default 0.15 (Reported time: 15%)
    semanticWeight: number;   // default 0.15 (Situation description: 15%)
    landmarkWeight: number;   // default 0.10 (Landmark/address: 10%)
    maxRadiusKm: number;      // default 3.0
    maxTimeWindowMins: number; // default 120
    autoLinkThreshold: number; // default 75
    candidateThreshold: number; // default 45
    autoIngestEnabled: boolean;
    autoIngestSpeedSeconds: number; // default 10s
}

/**
 * Helper to display clean human-readable category labels
 */
export function getCategoryDisplayLabel(category: IncidentCategory): string {
    switch (category) {
        case 'ROAD_ACCIDENT':
        case 'TRAFFIC_ACCIDENT':
            return 'Road Accident';
        case 'FIRE':
        case 'STRUCTURE_FIRE':
        case 'WILD_FIRE':
            return 'Fire';
        case 'FLOOD':
        case 'FLOOD_STORM':
            return 'Flood';
        case 'HEAVY_RAIN':
            return 'Heavy Rain';
        case 'BUILDING_EMERGENCY':
            return 'Building Emergency';
        case 'MEDICAL_EMERGENCY':
            return 'Medical Emergency';
        case 'MISSING_PERSON':
            return 'Missing Person';
        case 'NATURAL_DISASTER':
        case 'EARTHQUAKE_SEISMIC':
            return 'Natural Disaster';
        case 'HAZMAT_CHEMICAL':
            return 'Hazardous Materials';
        case 'POWER_GRID_OUTAGE':
            return 'Power Grid Outage';
        case 'OTHER':
        default:
            return 'Other Emergency';
    }
}
