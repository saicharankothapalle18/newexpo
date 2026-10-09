import React from 'react';
import { useEmergency, DashboardFilterCategory } from '../context/EmergencyContext';
import { UnifiedIncident, RawReport } from '../types';
import { IncomingQueue } from './IncomingQueue';
import { UnifiedIncidentList } from './UnifiedIncidentList';
import {
    ShieldAlert,
    Inbox,
    AlertTriangle,
    Link2,
    CheckCircle2,
    Clock,
    PhoneForwarded,
    SplitSquareVertical,
    Layers,
    Filter,
    ShieldCheck,
    Users,
    Zap,
    BarChart3
} from 'lucide-react';

interface MainDashboardViewProps {
    onSelectIncident: (incident: UnifiedIncident) => void;
    onInspectReport: (report: RawReport) => void;
}

export const MainDashboardView: React.FC<MainDashboardViewProps> = ({
    onSelectIncident,
    onInspectReport
}) => {
    const {
        reports,
        incidents,
        units,
        getCandidateLinksForReport,
        mergeReportToIncident,
        keepReportAsSeparateIncident,
        dashboardFilter,
        setDashboardFilter,
        workloadMetrics
    } = useEmergency();

    // Response teams currently assigned
    const assignedUnitsCount = units.filter(
        u => u.status === 'DISPATCHED' || u.status === 'EN_ROUTE' || u.status === 'ON_SCENE'
    ).length;

    // 1. Metric: New Reports
    const newReportsCount = reports.filter(r => !r.assignedIncidentId && !r.isFlaggedMisleading).length;

    // 2. Metric: Possible Duplicate Reports
    const candidateDuplicates = reports.flatMap(rep => {
        if (rep.assignedIncidentId || rep.isFlaggedMisleading || rep.acknowledgedSeparate) return [];
        const links = getCandidateLinksForReport(rep);
        return links.map(link => ({ report: rep, link }));
    });

    // 3. Metric: Active Incidents
    const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;

    // 4. Metric: Critical Incidents
    const criticalIncidentsCount = incidents.filter(
        i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    ).length;

    // 5. Metric: Incidents Awaiting Verification
    const awaitingVerificationCount = incidents.filter(
        i => !i.verifiedBy && i.status !== 'RESOLVED' && i.status !== 'CLOSED'
    ).length;

    // 6. Metric: Response-Required Incidents (Response requested or active with no units dispatched yet)
    const responseRequiredCount = incidents.filter(
        i => i.status === 'RESPONSE_REQUESTED' || (i.status === 'VERIFIED' && i.assignedUnitIds.length === 0)
    ).length;

    // 7. Metric: Resolved Incidents
    const resolvedIncidentsCount = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;

    const toggleFilter = (filterKey: DashboardFilterCategory) => {
        if (dashboardFilter === filterKey) {
            setDashboardFilter('ALL');
        } else {
            setDashboardFilter(filterKey);
        }
    };

    return (
        <div className="space-y-4">
            {/* Call-Center Workload Reduction & Operator Efficiency Summary Banner (Requirement 8) */}
            <div className="glass-panel p-4 rounded-xl border border-sky-400/30 bg-gradient-to-r from-white via-sky-50/60 to-white shadow-[0_4px_25px_rgba(56,189,248,0.18)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-400/20 border border-sky-400/40 text-sky-600 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
                        <Zap className="w-5 h-5 animate-pulse text-sky-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-sky-700 font-bold">
                                Call-Center Workload Reduction
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-sky-800 bg-sky-100/70 border border-sky-400/30">
                                System-Generated Statistics
                            </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                            <span className="text-slate-600">Reports Consolidated:</span>
                            <span className="text-sky-700 font-mono font-extrabold text-sm sm:text-base">
                                {workloadMetrics.reportsConsolidated} duplicate reports consolidated into {workloadMetrics.activeIncidents} active incidents
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-sky-400/20 pt-2.5 md:pt-0">
                    <div className="text-left md:text-right">
                        <div className="text-[11px] text-slate-600 font-medium">Estimated Duplicate Workload Reduced</div>
                        <div className="text-2xl font-black text-emerald-600 font-mono flex items-center gap-1.5 justify-start md:justify-end">
                            <span>{workloadMetrics.estimatedWorkloadReducedPercent}%</span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Saved Overhead
                            </span>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-sky-400/25 text-[11px] font-mono text-slate-600">
                        <div>
                            <div>Linked Reports: <strong className="text-sky-700">{workloadMetrics.linkedReports}</strong></div>
                            <div>Total Intake: <strong className="text-slate-900">{workloadMetrics.totalReports}</strong></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top 7 Core Metrics Dashboard Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                {/* 1. Total Active Incidents */}
                <div
                    onClick={() => toggleFilter('ACTIVE_INCIDENTS')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${dashboardFilter === 'ACTIVE_INCIDENTS'
                            ? 'bg-sky-400/20 border-sky-400 ring-2 ring-sky-400/30 shadow-[0_0_15px_rgba(56,189,248,0.30)]'
                            : 'glass-panel border-sky-400/30 hover:border-sky-400 hover:shadow-[0_2px_15px_rgba(56,189,248,0.20)]'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Active Incidents</span>
                        <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1">{workloadMetrics.activeIncidents}</div>
                    <div className="text-[10px] text-sky-600 font-mono truncate">Unified cases</div>
                </div>

                {/* 2. New Incoming Reports */}
                <div
                    onClick={() => toggleFilter('NEW_REPORTS')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${dashboardFilter === 'NEW_REPORTS'
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                            : 'glass-panel border-sky-400/30 hover:border-amber-400 hover:shadow-[0_2px_15px_rgba(245,158,11,0.15)]'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Incoming Reports</span>
                        <Inbox className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1">{newReportsCount}</div>
                    <div className="text-[10px] text-amber-600 font-mono truncate">Unlinked intake</div>
                </div>

                {/* 3. Critical Incidents */}
                <div
                    onClick={() => toggleFilter('CRITICAL_INCIDENTS')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${dashboardFilter === 'CRITICAL_INCIDENTS'
                            ? 'bg-red-500/15 border-red-400 ring-2 ring-red-400/30 shadow-lg'
                            : 'glass-panel border-red-200/80 bg-red-50/40 hover:border-red-400'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Critical Incidents</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-red-600 mt-1">{workloadMetrics.criticalIncidents}</div>
                    <div className="text-[10px] text-red-600 font-mono truncate">Priority 1 (Red 🔴)</div>
                </div>

                {/* 4. Possible Duplicate Reports */}
                <div
                    onClick={() => toggleFilter('CANDIDATE_DUPLICATES')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${dashboardFilter === 'CANDIDATE_DUPLICATES'
                            ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                            : 'glass-panel border-amber-200/80 bg-amber-50/40 hover:border-amber-400'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Possible Duplicates</span>
                        <Link2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-amber-600 mt-1">{workloadMetrics.possibleDuplicates}</div>
                    <div className="text-[10px] text-amber-600 font-mono truncate">Awaiting review</div>
                </div>

                {/* 5. Linked Reports */}
                <div
                    className="glass-panel p-3 rounded-xl border border-sky-400/30 space-y-1 hover:border-sky-400 transition-all hover:shadow-[0_2px_15px_rgba(56,189,248,0.20)]"
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Linked Reports</span>
                        <Layers className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-sky-700 mt-1">{workloadMetrics.linkedReports}</div>
                    <div className="text-[10px] text-sky-600 font-mono truncate">Consolidated calls</div>
                </div>

                {/* 6. Response Teams Currently Assigned */}
                <div
                    className="glass-panel p-3 rounded-xl border border-sky-400/30 space-y-1 hover:border-purple-400 transition-all"
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Assigned Teams</span>
                        <Users className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-purple-700 mt-1">{workloadMetrics.assignedTeams}</div>
                    <div className="text-[10px] text-purple-600 font-mono truncate">Units authorized</div>
                </div>

                {/* 7. Resolved Incidents */}
                <div
                    onClick={() => toggleFilter('RESOLVED')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${dashboardFilter === 'RESOLVED'
                            ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                            : 'glass-panel border-sky-400/30 hover:border-emerald-400'
                        }`}
                >
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Resolved</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1">{resolvedIncidentsCount}</div>
                    <div className="text-[10px] text-emerald-600 font-mono truncate">Stand-down</div>
                </div>
            </div>

            {/* Active Filter Notification Bar */}
            {dashboardFilter !== 'ALL' && (
                <div className="p-2.5 rounded-xl bg-white border border-sky-400/30 shadow-[0_2px_12px_rgba(56,189,248,0.12)] flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-sky-500" />
                        <span className="text-slate-600 font-medium">Filtered View Active:</span>
                        <span className="font-bold text-sky-800 font-mono uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-400/30">
                            {dashboardFilter.replace('_', ' ')}
                        </span>
                    </div>

                    <button
                        onClick={() => setDashboardFilter('ALL')}
                        className="text-xs text-sky-600 hover:text-sky-800 underline font-medium"
                    >
                        Reset Filter to Show All
                    </button>
                </div>
            )}

            {/* Empty state for candidate duplicates filter */}
            {dashboardFilter === 'CANDIDATE_DUPLICATES' && candidateDuplicates.length === 0 && (
                <div className="p-4 rounded-xl border border-sky-400/30 bg-white text-center text-xs text-slate-500 font-mono shadow-sm">
                    No possible duplicate matches. All incoming reports are unique or unassigned.
                </div>
            )}

            {/* Candidate Duplicate Notification Stream */}
            {candidateDuplicates.length > 0 && (
                <div className="glass-panel p-4 rounded-xl border border-amber-400/50 bg-amber-50/50 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600">
                                <Link2 className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                    Spatiotemporal Duplicate Matches Awaiting Operator Action ({candidateDuplicates.length})
                                </h3>
                                <p className="text-[11px] text-amber-700">
                                    Incoming reports detected in spatial & temporal proximity to existing active incidents.
                                </p>
                            </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Correlation &ge; 45%
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {candidateDuplicates.map(({ report, link }) => {
                            const targetInc = incidents.find(i => i.id === link.targetIncidentId);
                            if (!targetInc) return null;

                            return (
                                <div key={`${report.id}-${link.targetIncidentId}`} className="p-3 rounded-xl bg-white border border-sky-400/30 space-y-2 text-xs shadow-sm hover:border-sky-400 hover:shadow-[0_2px_12px_rgba(56,189,248,0.20)] transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 font-mono">
                                            <span className="text-sky-700 font-bold">{report.id}</span>
                                            <span className="text-slate-400">→</span>
                                            <span className="text-amber-700 font-bold">{targetInc.id}</span>
                                        </div>

                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                                            {link.breakdown.compositeScore}% Match
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-[11px]">
                                        <div className="text-slate-700">
                                            <strong className="text-sky-700 font-mono">Report:</strong> "{report.rawText}"
                                        </div>
                                        <div className="text-slate-500 text-[10px]">
                                            <strong className="text-amber-700 font-mono">Incident:</strong> {targetInc.title}
                                        </div>
                                    </div>

                                    {/* Breakdown Scores */}
                                    <div className="grid grid-cols-4 gap-1 p-1 rounded bg-sky-50/70 border border-sky-400/30 text-[10px] font-mono text-center text-slate-600">
                                        <div>Spatial: <strong className="text-sky-700">{link.breakdown.spatialScore}%</strong></div>
                                        <div>Temporal: <strong className="text-sky-700">{link.breakdown.temporalScore}%</strong></div>
                                        <div>Category: <strong className="text-sky-700">{link.breakdown.categoryScore}%</strong></div>
                                        <div>Semantic: <strong className="text-sky-700">{link.breakdown.semanticScore}%</strong></div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-sky-400/20">
                                        <button
                                            onClick={() => keepReportAsSeparateIncident(report.id)}
                                            className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 text-[10px] flex items-center gap-1 border border-slate-300 hover:border-slate-400 bg-white shadow-sm"
                                            title="Decline candidate match and keep as separate incident"
                                        >
                                            <SplitSquareVertical className="w-3 h-3 text-amber-600" />
                                            <span>Keep Separate</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => onInspectReport(report)}
                                                className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-400/30 text-[10px] font-medium transition-colors"
                                            >
                                                Triage Window
                                            </button>
                                            <button
                                                onClick={() => mergeReportToIncident(report.id, targetInc.id)}
                                                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                <Link2 className="w-3 h-3" /> Confirm & Attach
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Split View: Left Intake Queue (5 cols), Right Active Incidents Register (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-270px)] min-h-[640px]">
                <div className="lg:col-span-5 h-full">
                    <IncomingQueue onInspectReport={onInspectReport} />
                </div>

                <div className="lg:col-span-7 h-full glass-panel rounded-xl border border-sky-400/30 p-3 overflow-y-auto shadow-sm">
                    <UnifiedIncidentList onSelectIncident={onSelectIncident} />
                </div>
            </div>
        </div>
    );
};
