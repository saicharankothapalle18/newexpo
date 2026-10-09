import { UnifiedIncident, RiskLevel, LocationAccuracy } from '../types';

export interface IncidentRiskZone {
    riskLevel: RiskLevel;
    color: string;
    fillColor: string;
    radiusMeters: number;
    label: string;
    isOfficial: boolean;
    isActive: boolean;
}

/**
 * Maps severity & incident characteristics to one of ONLY THREE risk levels:
 * 1. RED 🔴 - Critical / Severe
 * 2. ORANGE 🟠 - High Risk
 * 3. YELLOW 🟡 - Moderate Risk
 * 
 * STRICT CONSTRAINT: Green risk level is completely forbidden and not supported.
 */
export function getIncidentRiskLevel(incident: Pick<UnifiedIncident, 'severity' | 'victimEstCount' | 'hazmatInvolved' | 'childReportIds'>): RiskLevel {
    // If severity is critical or high casualty/hazmat count
    if (incident.severity === 'CRITICAL') {
        return 'RED';
    }
    if (incident.severity === 'HIGH') {
        return 'ORANGE';
    }
    // Moderate / Low severity maps to YELLOW
    return 'YELLOW';
}

/**
 * Color codes for the 3 risk levels.
 */
export const RISK_COLORS: Record<RiskLevel, { hex: string; bgClass: string; textClass: string; borderClass: string; badge: string; emoji: string }> = {
    RED: {
        hex: '#ef4444',
        bgClass: 'bg-red-500/20',
        textClass: 'text-red-400',
        borderClass: 'border-red-500',
        badge: 'bg-red-500/20 text-red-300 border-red-500/50',
        emoji: '🔴'
    },
    ORANGE: {
        hex: '#f97316',
        bgClass: 'bg-orange-500/20',
        textClass: 'text-orange-400',
        borderClass: 'border-orange-500',
        badge: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
        emoji: '🟠'
    },
    YELLOW: {
        hex: '#eab308',
        bgClass: 'bg-yellow-500/20',
        textClass: 'text-yellow-400',
        borderClass: 'border-yellow-500',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        emoji: '🟡'
    }
};

/**
 * Returns user-facing title for risk levels.
 */
export function getRiskLevelTitle(level: RiskLevel): string {
    switch (level) {
        case 'RED':
            return 'Critical / Severe Risk';
        case 'ORANGE':
            return 'High Risk';
        case 'YELLOW':
            return 'Moderate Risk';
    }
}

/**
 * Check if an incident should have an active risk zone on the map.
 * Resolved or Closed incidents are inactive and must disappear from active risk zones.
 */
export function isIncidentZoneActive(incident: UnifiedIncident): boolean {
    return incident.status !== 'RESOLVED' && incident.status !== 'CLOSED';
}

/**
 * Calculate dynamic risk zone radius based on severity, casualties, hazmat, and linked reports.
 */
export function calculateZoneRadius(incident: UnifiedIncident): number {
    const risk = getIncidentRiskLevel(incident);
    let radius: number;

    switch (risk) {
        case 'RED':
            radius = 1300;
            if (incident.hazmatInvolved) radius += 500;
            if ((incident.victimEstCount || 0) > 3) radius += 300;
            if (incident.childReportIds.length >= 3) radius += 200;
            break;
        case 'ORANGE':
            radius = 850;
            if (incident.hazmatInvolved) radius += 300;
            if ((incident.victimEstCount || 0) > 0) radius += 150;
            if (incident.childReportIds.length >= 2) radius += 150;
            break;
        case 'YELLOW':
            radius = 500;
            if (incident.childReportIds.length >= 2) radius += 100;
            break;
    }

    return radius;
}

/**
 * Computes full risk zone properties for an incident.
 */
export function computeIncidentRiskZone(incident: UnifiedIncident): IncidentRiskZone {
    const riskLevel = getIncidentRiskLevel(incident);
    const radiusMeters = calculateZoneRadius(incident);
    const isActive = isIncidentZoneActive(incident);
    const isOfficial = !!incident.verifiedBy && (incident.status === 'VERIFIED' || incident.status === 'RESPONDING' || incident.status === 'TEAM_ASSIGNED');

    const label = isOfficial ? 'Official Hazard Zone' : 'Estimated Risk Zone (Decision Support)';

    return {
        riskLevel,
        color: RISK_COLORS[riskLevel].hex,
        fillColor: RISK_COLORS[riskLevel].hex,
        radiusMeters,
        label,
        isOfficial,
        isActive
    };
}

/**
 * Aggregates active risk zone counts across all active incidents.
 * Resolved incidents are excluded. NO green category is returned.
 */
export function getActiveRiskZoneCounts(incidents: UnifiedIncident[]): {
    red: number;
    orange: number;
    yellow: number;
    total: number;
} {
    let red = 0;
    let orange = 0;
    let yellow = 0;

    incidents.forEach(inc => {
        if (!isIncidentZoneActive(inc)) return;
        const level = getIncidentRiskLevel(inc);
        if (level === 'RED') red++;
        else if (level === 'ORANGE') orange++;
        else if (level === 'YELLOW') yellow++;
    });

    return {
        red,
        orange,
        yellow,
        total: red + orange + yellow
    };
}

/**
 * Format location accuracy for UI display.
 */
export function getLocationAccuracyLabel(accuracy?: LocationAccuracy): {
    text: string;
    isApproximate: boolean;
    badgeClass: string;
    tooltip: string;
} {
    switch (accuracy) {
        case 'APPROXIMATE':
            return {
                text: 'Approximate Location',
                isApproximate: true,
                badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
                tooltip: 'Estimated coordinates from caller landmark or cell tower area'
            };
        case 'TEXT_DERIVED':
            return {
                text: 'Text-Derived Location',
                isApproximate: true,
                badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-600/50',
                tooltip: 'AI/NLP extracted address from report text; pending GPS verification'
            };
        case 'EXACT_GPS':
        default:
            return {
                text: 'Exact GPS',
                isApproximate: false,
                badgeClass: 'bg-cyan-950/70 text-cyan-300 border-cyan-600/50',
                tooltip: 'High-precision coordinate lock (< 10m error radius)'
            };
    }
}

export type SituationLevel = 'CRITICAL' | 'HIGH_RISK' | 'NORMAL';

/**
 * Returns situation characteristics for real-time CAD mapping:
 * - Critical Situation (🔴 Red)
 * - High Risk Situation (🟠 Orange)
 * - Normal Situation (🟡 Yellow)
 * 
 * STRICT REQUIREMENT: No green category exists.
 */
export function getIncidentSituation(incident: UnifiedIncident): {
    level: SituationLevel;
    label: string;
    riskLevel: RiskLevel;
    badgeClass: string;
    textClass: string;
    colorHex: string;
    emoji: string;
} {
    const risk = getIncidentRiskLevel(incident);
    switch (risk) {
        case 'RED':
            return {
                level: 'CRITICAL',
                label: 'Critical Situation',
                riskLevel: 'RED',
                badgeClass: 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400',
                textClass: 'text-red-700',
                colorHex: RISK_COLORS.RED.hex,
                emoji: '🔴'
            };
        case 'ORANGE':
            return {
                level: 'HIGH_RISK',
                label: 'High Risk Situation',
                riskLevel: 'ORANGE',
                badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400',
                textClass: 'text-amber-800',
                colorHex: RISK_COLORS.ORANGE.hex,
                emoji: '🟠'
            };
        case 'YELLOW':
        default:
            return {
                level: 'NORMAL',
                label: 'Normal Situation',
                riskLevel: 'YELLOW',
                badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-300 ring-1 ring-yellow-400',
                textClass: 'text-yellow-800',
                colorHex: RISK_COLORS.YELLOW.hex,
                emoji: '🟡'
            };
    }
}
