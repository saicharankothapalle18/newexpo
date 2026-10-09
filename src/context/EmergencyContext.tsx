import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    RawReport,
    UnifiedIncident,
    ResponseUnit,
    AuditLogEntry,
    UserRole,
    SystemCorrelationConfig,
    IncidentStatus,
    UnitStatus,
    CandidateLink,
    IncidentCategory,
    SeverityLevel,
    OperatorUser,
    IncidentMatch,
    ResponseTeamAssignment,
    ResponseTeamType,
    IncidentTimelineEvent,
    getCategoryDisplayLabel
} from '../types';
import { INITIAL_REPORTS, INITIAL_INCIDENTS, INITIAL_UNITS, INITIAL_AUDIT_LOGS, DEMO_OPERATORS } from '../mock/initialData';
import { DEFAULT_CORRELATION_CONFIG, evaluateReportToIncidentCorrelation } from '../utils/correlation';
import { matchReportAgainstActiveIncidents } from '../utils/duplicateMatcher';
import { addRandomGeoOffset } from '../utils/geo';
import { classifyReportText, suggestSeverity } from '../utils/nlp';
import { soundEffects } from '../utils/audio';

export type DashboardFilterCategory =
    | 'ALL'
    | 'NEW_REPORTS'
    | 'CANDIDATE_DUPLICATES'
    | 'ACTIVE_INCIDENTS'
    | 'CRITICAL_INCIDENTS'
    | 'AWAITING_VERIFICATION'
    | 'RESPONSE_REQUIRED'
    | 'RESOLVED';

interface EmergencyContextType {
    currentUser: OperatorUser | null;
    login: (user: OperatorUser) => void;
    logout: () => void;

    reports: RawReport[];
    incidents: UnifiedIncident[];
    units: ResponseUnit[];
    auditLogs: AuditLogEntry[];
    currentRole: UserRole;
    setCurrentRole: (role: UserRole) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    config: SystemCorrelationConfig;
    updateConfig: (newConfig: Partial<SystemCorrelationConfig>) => void;

    selectedIncidentId: string | null;
    setSelectedIncidentId: (id: string | null) => void;
    selectedReportId: string | null;
    setSelectedReportId: (id: string | null) => void;

    dashboardFilter: DashboardFilterCategory;
    setDashboardFilter: (filter: DashboardFilterCategory) => void;

    audioEnabled: boolean;
    setAudioEnabled: (enabled: boolean) => void;
    playAudioAlert: (type: 'click' | 'chirp' | 'critical' | 'dispatch' | 'merge') => void;

    isSimulatingIngestion: boolean;
    setIsSimulatingIngestion: (simulating: boolean) => void;

    // Operator Core Workflows
    ingestNewReport: (reportData: Partial<RawReport>) => RawReport;
    verifyIncident: (incidentId: string) => void;
    mergeReportToIncident: (reportId: string, incidentId: string, noteText?: string) => void;
    unlinkReportFromIncident: (reportId: string, incidentId: string) => void;
    flagReportMisleading: (reportId: string, reason: string) => void;
    createIncidentFromReport: (reportId: string) => UnifiedIncident;
    keepReportAsSeparateIncident: (reportId: string) => UnifiedIncident;
    addReportNote: (reportId: string, noteText: string) => void;
    dispatchUnit: (unitId: string, incidentId: string) => void;
    updateUnitStatus: (unitId: string, status: UnitStatus) => void;
    updateIncidentStatus: (incidentId: string, status: IncidentStatus) => void;
    updateIncidentSeverity: (incidentId: string, severity: SeverityLevel) => void;
    resolveIncident: (incidentId: string, notes?: string) => void;
    addIncidentNote: (incidentId: string, text: string) => void;
    simulateRandomIncomingReport: () => void;
    getCandidateLinksForReport: (report: RawReport) => CandidateLink[];

    // Intelligent Call-Center & Duplicate Engine Methods
    matchReportAgainstIncidents: (reportData: Partial<RawReport>) => IncidentMatch[];
    attachReportToIncident: (reportId: string, incidentId: string, noteText?: string) => void;
    coordinateResponseTeam: (incidentId: string, teamType: ResponseTeamType, teamName: string, notes?: string) => void;
    addIncidentTimelineEvent: (incidentId: string, event: Omit<IncidentTimelineEvent, 'id' | 'timestamp'>) => void;
    importBatchReports: (newReports: RawReport[]) => void;
    importBatchIncidents: (newIncidents: UnifiedIncident[]) => void;
    addAuditLog: (
        actionType: AuditLogEntry['actionType'],
        summary: string,
        incidentId?: string,
        reportId?: string,
        unitId?: string,
        details?: Record<string, any>
    ) => void;
    purgeDatasetRecords: (deletedFileNames: string[]) => { purgedReports: number; purgedIncidents: number };

    // Workload Reduction Statistics (Requirement 8)
    workloadMetrics: {
        totalReports: number;
        activeIncidents: number;
        criticalIncidents: number;
        possibleDuplicates: number;
        linkedReports: number;
        reportsConsolidated: number;
        assignedTeams: number;
        estimatedWorkloadReducedPercent: number;
    };
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

const SIMULATION_TEMPLATES = [
    {
        category: 'TRAFFIC_ACCIDENT' as IncidentCategory,
        sourceType: 'PHONE_CALL' as const,
        sourceName: 'Cellular 911 Call',
        text: 'Car spun out on freeway shoulder. Debris across two lanes, airbags deployed.',
        loc: 'I-80 Mile Marker 15'
    },
    {
        category: 'STRUCTURE_FIRE' as IncidentCategory,
        sourceType: 'PUBLIC_FEED' as const,
        sourceName: 'City Sensor Camera Alert',
        text: 'Dense grey smoke billowing from second-story window of commercial warehouse.',
        loc: '4th & Mission Industrial Sector'
    },
    {
        category: 'HAZMAT_CHEMICAL' as IncidentCategory,
        sourceType: 'OFFICIAL_ALERT' as const,
        sourceName: 'Bay Area Air Quality Monitor',
        text: 'Sulfur dioxide spike registered at 120ppb near chemical facility perimeter.',
        loc: 'Bayfront Harbor Gate #2'
    },
    {
        category: 'MEDICAL_EMERGENCY' as IncidentCategory,
        sourceType: 'PHONE_CALL' as const,
        sourceName: 'Emergency Hotline #911-309',
        text: 'Pedestrian struck by delivery van at crosswalk. Unconscious with severe bleeding.',
        loc: 'Market St & 5th Avenue'
    }
];

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Current operator authentication (Defaults to Marcus Vance, desk 4)
    const [currentUser, setCurrentUser] = useState<OperatorUser | null>(DEMO_OPERATORS[0]);

    const [reports, setReports] = useState<RawReport[]>(INITIAL_REPORTS);
    const [incidents, setIncidents] = useState<UnifiedIncident[]>(INITIAL_INCIDENTS);
    const [units, setUnits] = useState<ResponseUnit[]>(INITIAL_UNITS);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

    const [currentRole, setCurrentRole] = useState<UserRole>(DEMO_OPERATORS[0].role);
    const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
    const [dashboardFilter, setDashboardFilter] = useState<DashboardFilterCategory>('ALL');
    const [config, setConfig] = useState<SystemCorrelationConfig>(DEFAULT_CORRELATION_CONFIG);

    const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [isSimulatingIngestion, setIsSimulatingIngestion] = useState<boolean>(false);
    const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

    const playAudioAlert = useCallback((type: 'click' | 'chirp' | 'critical' | 'dispatch' | 'merge') => {
        if (!audioEnabled) return;
        if (type === 'click') soundEffects.playClick();
        else if (type === 'chirp') soundEffects.playChirp();
        else if (type === 'critical') soundEffects.playCriticalAlert();
        else if (type === 'dispatch') soundEffects.playDispatch();
        else if (type === 'merge') soundEffects.playMergeSuccess();
    }, [audioEnabled]);

    const login = useCallback((user: OperatorUser) => {
        setCurrentUser(user);
        setCurrentRole(user.role);
        playAudioAlert('chirp');
    }, [playAudioAlert]);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    // Add audit entry helper
    const addAuditLog = useCallback((
        actionType: AuditLogEntry['actionType'],
        summary: string,
        incidentId?: string,
        reportId?: string,
        unitId?: string,
        details?: Record<string, any>
    ) => {
        const entry: AuditLogEntry = {
            id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            userId: currentUser ? currentUser.id : `USR-${currentRole}`,
            userName: currentUser ? currentUser.name : `${currentRole} User`,
            userRole: currentRole,
            actionType,
            summary,
            incidentId,
            reportId,
            unitId,
            details
        };
        setAuditLogs(prev => [entry, ...prev]);
    }, [currentUser, currentRole]);

    // Compute candidate links for a report against existing incidents
    const getCandidateLinksForReport = useCallback((report: RawReport): CandidateLink[] => {
        if (report.isFlaggedMisleading || report.acknowledgedSeparate) return [];

        return incidents.map((inc): CandidateLink => {
            const breakdown = evaluateReportToIncidentCorrelation(report, inc, config);
            return {
                reportId: report.id,
                targetIncidentId: inc.id,
                breakdown,
                detectedAt: new Date().toISOString(),
                status: report.assignedIncidentId === inc.id ? 'MERGED' : 'PENDING_OPERATOR'
            };
        }).filter(link => link.breakdown.compositeScore >= config.candidateThreshold);
    }, [incidents, config]);

    // Ingest new report & run automatic correlation engine
    const ingestNewReport = useCallback((reportData: Partial<RawReport>): RawReport => {
        const text = reportData.rawText || 'Raw emergency intake recorded';
        const classification = classifyReportText(text);
        const severity = suggestSeverity(text, classification.category);

        const newReport: RawReport = {
            id: reportData.id || `REP-${Math.floor(1000 + Math.random() * 9000)}`,
            sourceType: reportData.sourceType || 'PHONE_CALL',
            sourceName: reportData.sourceName || '911 Emergency Line',
            verificationState: reportData.sourceType === 'OFFICIAL_ALERT' ? 'VERIFIED' : 'UNVERIFIED',
            timestamp: reportData.timestamp || new Date().toISOString(),
            reporterName: reportData.reporterName || 'Anonymous Caller',
            contactNumber: reportData.contactNumber || '(555) 000-0000',
            latitude: reportData.latitude ?? 15.9129,
            longitude: reportData.longitude ?? 79.7400,
            locationName: reportData.locationName || 'Emergency Location',
            landmark: reportData.landmark,
            country: reportData.country || 'India',
            state: reportData.state,
            city: reportData.city,
            timeZone: reportData.timeZone,
            locationAccuracy: reportData.locationAccuracy || 'EXACT_GPS',
            rawText: text,
            affectedPeople: reportData.affectedPeople ?? 0,
            extractedTextKeywords: text.toLowerCase().split(' ').filter(w => w.length > 3),
            category: reportData.category || classification.category,
            aiSuggestedCategory: classification.category,
            aiCategoryConfidence: classification.confidence,
            aiSuggestedSeverity: reportData.aiSuggestedSeverity || severity.severity,
            aiSeverityConfidence: severity.confidence,
            assignedIncidentId: null,
            isFlaggedMisleading: false,
            acknowledgedSeparate: false,
            notes: reportData.notes || []
        };

        // Run correlation engine against existing active incidents
        let bestMatchIncidentId: string | null = null;
        let highestScore = 0;

        incidents.forEach(inc => {
            if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return;
            const breakdown = evaluateReportToIncidentCorrelation(newReport, inc, config);
            if (breakdown.compositeScore >= config.autoLinkThreshold && breakdown.compositeScore > highestScore) {
                highestScore = breakdown.compositeScore;
                bestMatchIncidentId = inc.id;
            }
        });

        if (bestMatchIncidentId) {
            newReport.assignedIncidentId = bestMatchIncidentId;
            setIncidents(prev => prev.map(inc => {
                if (inc.id === bestMatchIncidentId) {
                    return {
                        ...inc,
                        childReportIds: [...inc.childReportIds, newReport.id],
                        lastUpdatedTime: new Date().toISOString()
                    };
                }
                return inc;
            }));

            addAuditLog(
                'REPORTS_MERGED',
                `Report ${newReport.id} auto-linked to Incident ${bestMatchIncidentId} (Correlation Score: ${highestScore}%)`,
                bestMatchIncidentId,
                newReport.id,
                undefined,
                { compositeScore: highestScore }
            );
        } else {
            addAuditLog(
                'REPORT_INGESTED',
                `New report ${newReport.id} ingested from ${newReport.sourceName} (${newReport.category})`,
                undefined,
                newReport.id
            );
        }

        if (newReport.aiSuggestedSeverity === 'CRITICAL') {
            playAudioAlert('critical');
        } else {
            playAudioAlert('chirp');
        }

        setReports(prev => [newReport, ...prev]);
        return newReport;
    }, [incidents, config, addAuditLog, playAudioAlert]);

    // Simulate periodic incoming reports
    const simulateRandomIncomingReport = useCallback(() => {
        const template = SIMULATION_TEMPLATES[Math.floor(Math.random() * SIMULATION_TEMPLATES.length)];
        const baseInc = incidents[Math.floor(Math.random() * incidents.length)];
        const offset = addRandomGeoOffset(
            baseInc ? baseInc.latitude : 37.7749,
            baseInc ? baseInc.longitude : -122.4194,
            0.8
        );

        ingestNewReport({
            sourceType: template.sourceType,
            sourceName: `${template.sourceName} #${Math.floor(100 + Math.random() * 900)}`,
            rawText: `${template.text} near ${template.loc}.`,
            latitude: offset.latitude,
            longitude: offset.longitude,
            locationName: template.loc,
            category: template.category
        });
    }, [incidents, ingestNewReport]);

    useEffect(() => {
        if (!isSimulatingIngestion || !config.autoIngestEnabled) return;

        const interval = setInterval(() => {
            simulateRandomIncomingReport();
        }, config.autoIngestSpeedSeconds * 1000);

        return () => clearInterval(interval);
    }, [isSimulatingIngestion, config, simulateRandomIncomingReport]);

    // Operator Human Verification of Incident
    const verifyIncident = useCallback((incidentId: string) => {
        const operatorName = currentUser ? currentUser.name : `${currentRole} User`;
        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return {
                    ...inc,
                    status: inc.status === 'UNDER_REVIEW' || inc.status === 'NEW' ? 'VERIFIED' : inc.status,
                    verifiedBy: operatorName,
                    verifiedAt: new Date().toISOString(),
                    lastUpdatedTime: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('click');
        addAuditLog(
            'HUMAN_VERIFIED',
            `Operator ${operatorName} verified Incident ${incidentId}. Human authorization registered.`,
            incidentId
        );
    }, [currentUser, currentRole, addAuditLog, playAudioAlert]);

    // Operator manual attach/merge of report into unified incident (Requirement 5)
    const attachReportToIncident = useCallback((reportId: string, incidentId: string, noteText?: string) => {
        const report = reports.find(r => r.id === reportId);

        setReports(prev => prev.map(rep => {
            if (rep.id === reportId) {
                const updatedNotes = noteText ? [...(rep.notes || []), noteText] : (rep.notes || []);
                return {
                    ...rep,
                    assignedIncidentId: incidentId,
                    verificationState: 'PARTIALLY_VERIFIED',
                    acknowledgedSeparate: false,
                    notes: updatedNotes
                };
            }
            return rep;
        }));

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                const childIds = inc.childReportIds.includes(reportId)
                    ? inc.childReportIds
                    : [...inc.childReportIds, reportId];
                const candidateIds = inc.candidateReportIds.filter(id => id !== reportId);
                const extraNote = noteText ? [
                    {
                        id: `NOTE-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        authorId: currentUser ? currentUser.id : `OP-${currentRole}`,
                        authorRole: currentRole,
                        text: `Attached Report ${reportId}: ${noteText}`
                    }
                ] : [];

                const timelineEvent: IncidentTimelineEvent = {
                    id: `EVT-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    type: 'REPORT_ATTACHED',
                    description: report
                        ? `Report ${reportId} (${report.reporterName || 'Caller'}) attached to unified incident: "${report.rawText.slice(0, 75)}"`
                        : `Report ${reportId} attached to incident by operator`,
                    authorName: currentUser ? currentUser.name : 'Operator',
                    reportId
                };

                const newAffected = report && report.affectedPeople
                    ? Math.max(inc.affectedPeople || inc.victimEstCount || 0, report.affectedPeople)
                    : (inc.affectedPeople || inc.victimEstCount || 0);

                return {
                    ...inc,
                    childReportIds: childIds,
                    candidateReportIds: candidateIds,
                    affectedPeople: newAffected,
                    victimEstCount: newAffected,
                    notes: [...inc.notes, ...extraNote],
                    timelineEvents: [...(inc.timelineEvents || []), timelineEvent],
                    lastUpdatedTime: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('merge');
        addAuditLog(
            'REPORTS_MERGED',
            `Operator attached Report ${reportId} to Unified Incident ${incidentId}`,
            incidentId,
            reportId
        );
    }, [reports, currentUser, currentRole, addAuditLog, playAudioAlert]);

    // Backward-compatible alias
    const mergeReportToIncident = attachReportToIncident;

    // Unlink a report from an incident
    const unlinkReportFromIncident = useCallback((reportId: string, incidentId: string) => {
        setReports(prev => prev.map(rep => {
            if (rep.id === reportId) {
                return { ...rep, assignedIncidentId: null };
            }
            return rep;
        }));

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return {
                    ...inc,
                    childReportIds: inc.childReportIds.filter(id => id !== reportId),
                    lastUpdatedTime: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('click');
        addAuditLog(
            'REPORT_UNLINKED',
            `Report ${reportId} unlinked from Incident ${incidentId} by operator.`,
            incidentId,
            reportId
        );
    }, [addAuditLog, playAudioAlert]);

    // Flag misleading / false report
    const flagReportMisleading = useCallback((reportId: string, reason: string) => {
        setReports(prev => prev.map(rep => {
            if (rep.id === reportId) {
                return {
                    ...rep,
                    isFlaggedMisleading: true,
                    flaggedReason: reason,
                    verificationState: 'MISLEADING_FLAGGED'
                };
            }
            return rep;
        }));

        playAudioAlert('click');
        addAuditLog(
            'REPORT_FLAGGED_MISLEADING',
            `Report ${reportId} flagged as misleading/false intake. Reason: ${reason}`,
            undefined,
            reportId
        );
    }, [addAuditLog, playAudioAlert]);

    // Create brand new Incident from a report
    const createIncidentFromReport = useCallback((reportId: string): UnifiedIncident => {
        const report = reports.find(r => r.id === reportId);
        if (!report) throw new Error('Report not found');

        const initialTimeline: IncidentTimelineEvent[] = [
            {
                id: `EVT-${Date.now()}-1`,
                timestamp: report.timestamp || new Date().toISOString(),
                type: 'REPORT_RECEIVED',
                description: `Initial call/report ${report.id} received from ${report.reporterName || 'Caller'} (${report.sourceName}): "${report.rawText.slice(0, 80)}"`,
                authorName: currentUser ? currentUser.name : 'Operator',
                reportId: report.id
            }
        ];

        const newIncident: UnifiedIncident = {
            id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
            title: `${getCategoryDisplayLabel(report.category)} at ${report.locationName}`,
            category: report.category,
            severity: report.aiSuggestedSeverity || 'MODERATE',
            status: 'NEW',
            latitude: report.latitude,
            longitude: report.longitude,
            locationDescription: report.locationName,
            landmark: report.landmark || report.locationName,
            country: report.country || 'India',
            state: report.state,
            city: report.city,
            timeZone: report.timeZone,
            locationAccuracy: report.locationAccuracy || 'EXACT_GPS',
            summary: report.rawText,
            createdTime: new Date().toISOString(),
            lastUpdatedTime: new Date().toISOString(),
            firstReportedAt: report.timestamp || new Date().toISOString(),
            lastUpdatedAt: new Date().toISOString(),
            primaryOperatorId: currentUser ? currentUser.id : `OP-${currentRole}`,
            childReportIds: [report.id],
            candidateReportIds: [],
            victimEstCount: report.affectedPeople || (report.aiSuggestedSeverity === 'CRITICAL' ? 2 : 0),
            affectedPeople: report.affectedPeople || (report.aiSuggestedSeverity === 'CRITICAL' ? 2 : 0),
            hazmatInvolved: report.category === 'HAZMAT_CHEMICAL',
            assignedUnitIds: [],
            responseTeamAssignments: [],
            timelineEvents: initialTimeline,
            notes: [
                {
                    id: `NOTE-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    authorId: currentUser ? currentUser.id : `OP-${currentRole}`,
                    authorRole: currentRole,
                    text: `Initial incident spawned from intake ${report.id} (${report.sourceName}). Caller: ${report.reporterName || 'Unknown'}.`
                }
            ]
        };

        setReports(prev => prev.map(r => r.id === reportId ? { ...r, assignedIncidentId: newIncident.id, acknowledgedSeparate: true } : r));
        setIncidents(prev => [newIncident, ...prev]);

        playAudioAlert('click');
        addAuditLog(
            'INCIDENT_CREATED',
            `Created Unified Incident ${newIncident.id} from Report ${reportId}`,
            newIncident.id,
            reportId
        );

        return newIncident;
    }, [reports, currentUser, currentRole, addAuditLog, playAudioAlert]);

    // Keep report as separate incident (Operator decision to decline duplicate suggestions)
    const keepReportAsSeparateIncident = useCallback((reportId: string): UnifiedIncident => {
        const report = reports.find(r => r.id === reportId);
        if (!report) throw new Error('Report not found');

        // Mark report as acknowledged separate
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, acknowledgedSeparate: true } : r));

        // Create standalone incident
        return createIncidentFromReport(reportId);
    }, [reports, createIncidentFromReport]);

    // Add note to report
    const addReportNote = useCallback((reportId: string, noteText: string) => {
        setReports(prev => prev.map(r => {
            if (r.id === reportId) {
                return { ...r, notes: [...(r.notes || []), noteText] };
            }
            return r;
        }));
        playAudioAlert('click');
    }, [playAudioAlert]);

    // Dispatch response unit
    const dispatchUnit = useCallback((unitId: string, incidentId: string) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                return {
                    ...u,
                    status: 'DISPATCHED',
                    assignedIncidentId: incidentId,
                    lastUpdated: new Date().toISOString()
                };
            }
            return u;
        }));

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                const assigned = inc.assignedUnitIds.includes(unitId)
                    ? inc.assignedUnitIds
                    : [...inc.assignedUnitIds, unitId];
                return {
                    ...inc,
                    assignedUnitIds: assigned,
                    status: inc.status === 'VERIFIED' || inc.status === 'RESPONSE_REQUESTED' ? 'TEAM_ASSIGNED' : inc.status,
                    lastUpdatedTime: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('dispatch');
        addAuditLog(
            'UNIT_DISPATCHED',
            `Unit ${unitId} dispatched to Incident ${incidentId}`,
            incidentId,
            undefined,
            unitId
        );
    }, [addAuditLog, playAudioAlert]);

    // Update Unit Status
    const updateUnitStatus = useCallback((unitId: string, status: UnitStatus) => {
        setUnits(prev => prev.map(u => {
            if (u.id === unitId) {
                return { ...u, status, lastUpdated: new Date().toISOString() };
            }
            return u;
        }));

        addAuditLog(
            'UNIT_STATUS_UPDATED',
            `Unit ${unitId} status updated to ${status}`,
            undefined,
            undefined,
            unitId
        );
    }, [addAuditLog]);

    // Update Incident Status
    const updateIncidentStatus = useCallback((incidentId: string, status: IncidentStatus) => {
        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return { ...inc, status, lastUpdatedTime: new Date().toISOString() };
            }
            return inc;
        }));

        playAudioAlert('click');
        addAuditLog(
            'INCIDENT_STATUS_CHANGED',
            `Incident ${incidentId} status transitioned to ${status}`,
            incidentId
        );
    }, [addAuditLog, playAudioAlert]);

    // Update Incident Severity (Dynamically alters risk zone color and radius)
    const updateIncidentSeverity = useCallback((incidentId: string, severity: SeverityLevel) => {
        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return {
                    ...inc,
                    severity,
                    lastUpdatedTime: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('click');
        addAuditLog(
            'INCIDENT_STATUS_CHANGED',
            `Incident ${incidentId} severity updated to ${severity}`,
            incidentId
        );
    }, [addAuditLog, playAudioAlert]);

    // Quick resolve incident
    const resolveIncident = useCallback((incidentId: string, notes?: string) => {
        const extraNote = notes ? [
            {
                id: `NOTE-${Date.now()}`,
                timestamp: new Date().toISOString(),
                authorId: currentUser ? currentUser.id : `OP-${currentRole}`,
                authorRole: currentRole,
                text: `Incident resolved: ${notes}`
            }
        ] : [];

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return {
                    ...inc,
                    status: 'RESOLVED',
                    notes: [...inc.notes, ...extraNote],
                    lastUpdatedTime: new Date().toISOString()
                };
            }
            return inc;
        }));

        // Release assigned units back to AVAILABLE
        setUnits(prev => prev.map(u => {
            if (u.assignedIncidentId === incidentId) {
                return { ...u, status: 'AVAILABLE', assignedIncidentId: null, lastUpdated: new Date().toISOString() };
            }
            return u;
        }));

        playAudioAlert('click');
        addAuditLog(
            'INCIDENT_STATUS_CHANGED',
            `Incident ${incidentId} marked RESOLVED. All response units stood down.`,
            incidentId
        );
    }, [currentUser, currentRole, addAuditLog, playAudioAlert]);

    // Add Incident Note
    const addIncidentNote = useCallback((incidentId: string, text: string) => {
        const note = {
            id: `NOTE-${Date.now()}`,
            timestamp: new Date().toISOString(),
            authorId: currentUser ? currentUser.id : `USR-${currentRole}`,
            authorRole: currentRole,
            text
        };

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return { ...inc, notes: [...inc.notes, note], lastUpdatedTime: new Date().toISOString() };
            }
            return inc;
        }));
        playAudioAlert('click');
    }, [currentUser, currentRole, playAudioAlert]);

    const updateConfig = useCallback((newConfig: Partial<SystemCorrelationConfig>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
        addAuditLog(
            'SYSTEM_CONFIG_UPDATED',
            `Updated correlation parameters: Spatial weight=${newConfig.spatialWeight ?? config.spatialWeight}, Threshold=${newConfig.autoLinkThreshold ?? config.autoLinkThreshold}%`
        );
    }, [config, addAuditLog]);

    // Run weighted duplicate matcher against active incidents
    const matchReportAgainstIncidents = useCallback((reportData: Partial<RawReport>): IncidentMatch[] => {
        return matchReportAgainstActiveIncidents(reportData, incidents);
    }, [incidents]);

    // Coordinate authorized response team (Requirement 7)
    const coordinateResponseTeam = useCallback((
        incidentId: string,
        teamType: ResponseTeamType,
        teamName: string,
        notes?: string
    ) => {
        const assignment: ResponseTeamAssignment = {
            id: `ASG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            teamId: `TEAM-${teamType}-${Math.floor(10 + Math.random() * 90)}`,
            teamName,
            teamType,
            incidentId,
            status: 'ASSIGNED',
            assignedAt: new Date().toISOString(),
            operatorNotes: notes || undefined,
            authorizedBy: currentUser ? currentUser.name : 'Operator'
        };

        const timelineEvent: IncidentTimelineEvent = {
            id: `EVT-${Date.now()}`,
            timestamp: new Date().toISOString(),
            type: 'TEAM_COORDINATED',
            description: `Response coordinated: Assigned ${teamName} (${teamType.replace('_', ' ')}) to incident.${notes ? ' Note: ' + notes : ''}`,
            authorName: currentUser ? currentUser.name : 'Operator',
            teamId: assignment.teamId
        };

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                const currentAssignments = inc.responseTeamAssignments || [];
                const updatedAssignments = [...currentAssignments, assignment];
                return {
                    ...inc,
                    status: (inc.status === 'NEW' || inc.status === 'UNDER_VERIFICATION') ? 'RESPONSE_COORDINATED' : inc.status,
                    responseTeamAssignments: updatedAssignments,
                    timelineEvents: [...(inc.timelineEvents || []), timelineEvent],
                    lastUpdatedTime: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString()
                };
            }
            return inc;
        }));

        playAudioAlert('dispatch');
        addAuditLog(
            'TEAM_COORDINATED',
            `Operator coordinated response team: ${teamName} (${teamType}) for incident ${incidentId}`,
            incidentId,
            undefined,
            undefined,
            { teamType, teamName, notes }
        );
    }, [currentUser, addAuditLog, playAudioAlert]);

    // Add Incident Timeline Event
    const addIncidentTimelineEvent = useCallback((
        incidentId: string,
        event: Omit<IncidentTimelineEvent, 'id' | 'timestamp'>
    ) => {
        const newEvent: IncidentTimelineEvent = {
            ...event,
            id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            authorName: event.authorName || (currentUser ? currentUser.name : 'Operator')
        };

        setIncidents(prev => prev.map(inc => {
            if (inc.id === incidentId) {
                return {
                    ...inc,
                    timelineEvents: [...(inc.timelineEvents || []), newEvent],
                    lastUpdatedTime: new Date().toISOString(),
                    lastUpdatedAt: new Date().toISOString()
                };
            }
            return inc;
        }));
    }, [currentUser]);

    // Batch import reports from uploaded datasets (WhatsApp JSON, CSV, etc.)
    const importBatchReports = useCallback((newReports: RawReport[]) => {
        if (!newReports.length) return;
        setReports(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const filteredNew = newReports.filter(r => !existingIds.has(r.id));
            return [...filteredNew, ...prev];
        });
        playAudioAlert('chirp');
        addAuditLog(
            'REPORT_INGESTED',
            `Batch imported ${newReports.length} reports into CAD intake stream.`
        );
    }, [addAuditLog, playAudioAlert]);

    // Batch import incidents with canonical locations & risk zones
    const importBatchIncidents = useCallback((newIncidents: UnifiedIncident[]) => {
        if (!newIncidents.length) return;
        setIncidents(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const filteredNew = newIncidents.filter(i => !existingIds.has(i.id));
            return [...filteredNew, ...prev];
        });
        playAudioAlert('critical');
        addAuditLog(
            'INCIDENT_CREATED',
            `Batch imported ${newIncidents.length} active emergency incidents.`
        );
    }, [addAuditLog, playAudioAlert]);

    // Purge CAD records linked to deleted dataset files (Requirement 2 & 3)
    const purgeDatasetRecords = useCallback((deletedFileNames: string[]): { purgedReports: number; purgedIncidents: number } => {
        let purgedReports = 0;
        let purgedIncidents = 0;

        const fileNameSet = new Set(deletedFileNames.map(f => f.toLowerCase()));

        setReports(prev => {
            const remaining = prev.filter(r => {
                const matchNotes = (r.notes || []).some(n => {
                    const low = n.toLowerCase();
                    return Array.from(fileNameSet).some(fn => low.includes(fn));
                });
                const matchSource = r.sourceName && Array.from(fileNameSet).some(fn => r.sourceName.toLowerCase().includes(fn));
                const match = matchNotes || matchSource;
                if (match) purgedReports++;
                return !match;
            });
            return remaining;
        });

        setIncidents(prev => {
            const remaining = prev.filter(inc => {
                const matchNotes = (inc.notes || []).some(n => {
                    const low = n.text.toLowerCase();
                    return Array.from(fileNameSet).some(fn => low.includes(fn));
                });
                const matchTitle = Array.from(fileNameSet).some(fn => inc.title.toLowerCase().includes(fn));
                const match = matchNotes || matchTitle;
                if (match) purgedIncidents++;
                return !match;
            });
            return remaining;
        });

        return { purgedReports, purgedIncidents };
    }, []);

    // Call-center workload reduction metrics (Requirement 8)
    const workloadMetrics = useMemo(() => {
        const active = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED');
        const critical = active.filter(i => i.severity === 'CRITICAL');
        const linked = reports.filter(r => r.assignedIncidentId !== null);

        // Reports consolidated: every report attached beyond the first represents a duplicate consolidated into a unified incident
        let consolidated = 0;
        incidents.forEach(inc => {
            if (inc.childReportIds && inc.childReportIds.length > 1) {
                consolidated += (inc.childReportIds.length - 1);
            }
        });

        // Possible duplicate count: reports that have match score >= 50% or candidate links and are unassigned
        const unassigned = reports.filter(r => !r.assignedIncidentId && !r.isFlaggedMisleading && !r.acknowledgedSeparate);
        let possibleDupCount = 0;
        unassigned.forEach(r => {
            const matches = matchReportAgainstActiveIncidents(r, active);
            if (matches.length > 0 && matches[0].matchConfidence >= 50) {
                possibleDupCount++;
            }
        });

        // Response teams assigned count across active incidents
        let totalAssignedTeams = 0;
        active.forEach(inc => {
            totalAssignedTeams += (inc.responseTeamAssignments?.length || 0);
        });
        const dispatchedUnits = units.filter(u => u.status === 'DISPATCHED' || u.status === 'EN_ROUTE' || u.status === 'ON_SCENE').length;
        const totalTeams = Math.max(totalAssignedTeams, dispatchedUnits);

        const totalReps = reports.length;
        const workloadPct = totalReps > 0 ? Math.min(100, Math.round((consolidated / totalReps) * 100)) : 0;

        return {
            totalReports: totalReps,
            activeIncidents: active.length,
            criticalIncidents: critical.length,
            possibleDuplicates: possibleDupCount,
            linkedReports: linked.length,
            reportsConsolidated: consolidated,
            assignedTeams: totalTeams,
            estimatedWorkloadReducedPercent: workloadPct
        };
    }, [reports, incidents, units]);

    return (
        <EmergencyContext.Provider
            value={{
                currentUser,
                login,
                logout,
                reports,
                incidents,
                units,
                auditLogs,
                currentRole,
                setCurrentRole,
                activeTab,
                setActiveTab,
                config,
                updateConfig,
                selectedIncidentId,
                setSelectedIncidentId,
                selectedReportId,
                setSelectedReportId,
                dashboardFilter,
                setDashboardFilter,
                audioEnabled,
                setAudioEnabled,
                playAudioAlert,
                isSimulatingIngestion,
                setIsSimulatingIngestion,
                ingestNewReport,
                verifyIncident,
                mergeReportToIncident,
                unlinkReportFromIncident,
                flagReportMisleading,
                createIncidentFromReport,
                keepReportAsSeparateIncident,
                addReportNote,
                dispatchUnit,
                updateUnitStatus,
                updateIncidentStatus,
                updateIncidentSeverity,
                resolveIncident,
                addIncidentNote,
                simulateRandomIncomingReport,
                getCandidateLinksForReport,
                matchReportAgainstIncidents,
                attachReportToIncident,
                coordinateResponseTeam,
                addIncidentTimelineEvent,
                importBatchReports,
                importBatchIncidents,
                addAuditLog,
                purgeDatasetRecords,
                workloadMetrics
            }}
        >
            {children}
        </EmergencyContext.Provider>
    );
};

export const useEmergency = () => {
    const context = useContext(EmergencyContext);
    if (!context) {
        throw new Error('useEmergency must be used within an EmergencyProvider');
    }
    return context;
};
