import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { RawReport, ReportSourceType } from '../types';
import {
    PhoneCall,
    Rss,
    AlertTriangle,
    ShieldCheck,
    CheckCircle,
    Link2,
    Sparkles,
    Flag,
    Plus,
    Clock,
    MapPin,
    AlertCircle,
    Search,
    ExternalLink,
    SplitSquareVertical,
    Check,
    Users,
    Inbox
} from 'lucide-react';

interface IncomingQueueProps {
    onInspectReport: (report: RawReport) => void;
}

export const IncomingQueue: React.FC<IncomingQueueProps> = ({ onInspectReport }) => {
    const {
        reports,
        createIncidentFromReport,
        keepReportAsSeparateIncident,
        flagReportMisleading,
        getCandidateLinksForReport,
        dashboardFilter
    } = useEmergency();

    const [filterSource, setFilterSource] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredReports = reports.filter(rep => {
        // Global dashboard filter integration
        if (dashboardFilter === 'NEW_REPORTS' && (rep.assignedIncidentId || rep.isFlaggedMisleading)) return false;
        if (dashboardFilter === 'CANDIDATE_DUPLICATES') {
            if (rep.assignedIncidentId || rep.isFlaggedMisleading || rep.acknowledgedSeparate) return false;
            const links = getCandidateLinksForReport(rep);
            if (links.length === 0) return false;
        }

        // Local filter pills
        if (filterSource === 'UNVERIFIED' && rep.verificationState !== 'UNVERIFIED') return false;
        if (filterSource === 'PHONE_CALL' && rep.sourceType !== 'PHONE_CALL') return false;
        if (filterSource === 'PUBLIC_REPORT' && rep.sourceType !== 'PUBLIC_REPORT') return false;
        if (filterSource === 'OFFICIAL_ALERT' && rep.sourceType !== 'OFFICIAL_ALERT') return false;
        if (filterSource === 'PUBLIC_FEED' && rep.sourceType !== 'PUBLIC_FEED') return false;
        if (filterSource === 'FLAGGED' && !rep.isFlaggedMisleading) return false;

        // Search text
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                rep.rawText.toLowerCase().includes(q) ||
                rep.locationName.toLowerCase().includes(q) ||
                rep.id.toLowerCase().includes(q) ||
                (rep.reporterName && rep.reporterName.toLowerCase().includes(q)) ||
                (rep.category && rep.category.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const getSourceIcon = (type: ReportSourceType) => {
        switch (type) {
            case 'PHONE_CALL':
                return <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />;
            case 'PUBLIC_REPORT':
                return <Users className="w-3.5 h-3.5 text-blue-400" />;
            case 'OFFICIAL_ALERT':
                return <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
            case 'PUBLIC_FEED':
                return <Rss className="w-3.5 h-3.5 text-amber-400" />;
            default:
                return <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full glass-panel rounded-xl border border-sky-400/30 overflow-hidden select-none bg-white/95 shadow-md">
            {/* Header bar */}
            <div className="p-3 border-b border-sky-400/30 bg-white/95 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></div>
                        <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                            Incoming Multi-Source Intake Queue
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold border border-sky-400/30">
                                {filteredReports.length}
                            </span>
                        </h2>
                    </div>

                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        AI Classifier Active
                    </span>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 text-xs overflow-x-auto pb-0.5">
                    {[
                        { id: 'ALL', label: 'All Sources' },
                        { id: 'PHONE_CALL', label: 'Phone Calls' },
                        { id: 'PUBLIC_REPORT', label: 'Public Reports' },
                        { id: 'OFFICIAL_ALERT', label: 'Official Alerts' },
                        { id: 'PUBLIC_FEED', label: 'Permitted Feeds' },
                        { id: 'UNVERIFIED', label: 'Unverified' },
                        { id: 'FLAGGED', label: 'Flagged' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterSource(f.id)}
                            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${filterSource === f.id
                                    ? 'bg-sky-400/20 text-sky-900 border border-sky-400/40 font-bold shadow-sm'
                                    : 'text-slate-600 hover:bg-sky-50 hover:text-slate-900'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Search input */}
                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                        type="text"
                        placeholder="Filter reports by keyword, caller name, location..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30"
                    />
                </div>
            </div>

            {/* Reports List Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {filteredReports.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center space-y-3 bg-sky-50/20 rounded-2xl border border-dashed border-sky-300 m-2">
                        <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
                            <Inbox className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800">No incoming reports yet</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                Upload an audio recording, import a dataset (.json), or log a manual 911 call to get started.
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredReports.map(report => {
                        const candidateLinks = getCandidateLinksForReport(report);
                        const highestMatch = candidateLinks.length > 0 ? candidateLinks[0] : null;

                        return (
                            <div
                                key={report.id}
                                className={`p-3 rounded-xl border transition-all shadow-sm ${report.isFlaggedMisleading
                                        ? 'bg-red-50/50 border-red-300 opacity-75'
                                        : report.assignedIncidentId
                                            ? 'bg-sky-50/30 border-sky-400/20 hover:border-sky-400/40'
                                            : highestMatch
                                                ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400 hover:shadow-[0_2px_12px_rgba(245,158,11,0.18)]'
                                                : 'bg-white border-sky-400/30 hover:border-sky-400 hover:shadow-[0_2px_15px_rgba(56,189,248,0.22)]'
                                    }`}
                            >
                                {/* Top line metadata */}
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="p-1 rounded bg-sky-50 border border-sky-400/30">
                                            {getSourceIcon(report.sourceType)}
                                        </span>
                                        <span className="font-mono text-sky-700 font-bold text-[11px]">
                                            {report.id}
                                        </span>
                                        <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                                            • {report.sourceName}
                                        </span>
                                    </div>

                                    {/* Verification Status Badge */}
                                    <div>
                                        {report.isFlaggedMisleading ? (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1 font-mono">
                                                <Flag className="w-2.5 h-2.5" /> MISLEADING
                                            </span>
                                        ) : report.verificationState === 'VERIFIED' ? (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                                                <CheckCircle className="w-2.5 h-2.5" /> VERIFIED
                                            </span>
                                        ) : (
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 font-mono">
                                                <AlertCircle className="w-2.5 h-2.5" /> UNVERIFIED
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Raw Text Body */}
                                <p className="text-xs text-slate-800 leading-relaxed font-sans mb-2 font-medium">
                                    "{report.rawText}"
                                </p>

                                {/* Caller & Location Info */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                        <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                                        <span className="truncate">{report.locationName}</span>
                                        {report.locationAccuracy && report.locationAccuracy !== 'EXACT_GPS' && (
                                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                                ⚠️ {report.locationAccuracy === 'TEXT_DERIVED' ? 'TEXT-DERIVED' : 'APPROX'}
                                            </span>
                                        )}
                                    </div>
                                    <span className="flex items-center gap-1 font-mono text-slate-500 shrink-0">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* AI Classification & Severity Pill */}
                                <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10px]">
                                    <span className="px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                        AI: {report.aiSuggestedCategory.replace('_', ' ')} ({report.aiCategoryConfidence}%)
                                    </span>

                                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${report.aiSuggestedSeverity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                                            report.aiSuggestedSeverity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                        }`}>
                                        {report.aiSuggestedSeverity}
                                    </span>
                                </div>

                                {/* Candidate Duplicate Notification Banner */}
                                {highestMatch && !report.assignedIncidentId && !report.isFlaggedMisleading && (
                                    <div className="mt-2 p-2 rounded-lg bg-amber-100/70 border border-amber-300 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 text-amber-900 font-mono text-[11px]">
                                            <Link2 className="w-3 h-3 text-amber-600 animate-pulse" />
                                            Candidate Duplicate: <strong className="text-amber-950 font-bold">{highestMatch.targetIncidentId}</strong> ({highestMatch.breakdown.compositeScore}%)
                                        </div>
                                        <button
                                            onClick={() => onInspectReport(report)}
                                            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded transition-colors shadow-sm"
                                        >
                                            Review Match
                                        </button>
                                    </div>
                                )}

                                {/* Already linked banner */}
                                {report.assignedIncidentId && (
                                    <div className="mt-2 p-1.5 rounded bg-sky-50 border border-sky-400/30 text-[11px] text-sky-800 font-mono flex items-center justify-between">
                                        <span>Linked to Incident: {report.assignedIncidentId}</span>
                                        <button
                                            onClick={() => onInspectReport(report)}
                                            className="text-[10px] text-sky-600 hover:text-sky-800 underline font-semibold"
                                        >
                                            Inspect Link
                                        </button>
                                    </div>
                                )}

                                {/* Action Controls for Unlinked Reports */}
                                {!report.assignedIncidentId && !report.isFlaggedMisleading && (
                                    <div className="flex items-center justify-between gap-1.5 mt-2.5 border-t border-sky-400/20 pt-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => keepReportAsSeparateIncident(report.id)}
                                                className="px-2 py-1 rounded text-[10px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 bg-white transition-colors flex items-center gap-1 shadow-sm"
                                                title="Mark as separate incident and suppress duplicate suggestions"
                                            >
                                                <SplitSquareVertical className="w-3 h-3 text-amber-600" /> Keep Separate
                                            </button>
                                            <button
                                                onClick={() => flagReportMisleading(report.id, 'Unverified false claim')}
                                                className="px-2 py-1 rounded text-[10px] font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                                                title="Flag misleading / hoax"
                                            >
                                                <Flag className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => onInspectReport(report)}
                                                className="px-2.5 py-1 rounded text-[10px] font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-colors flex items-center gap-1 border border-sky-400/30"
                                            >
                                                <ExternalLink className="w-3 h-3" /> Triage & Link
                                            </button>
                                            <button
                                                onClick={() => createIncidentFromReport(report.id)}
                                                className="px-2 py-1 rounded text-[10px] font-semibold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-400/30 transition-colors flex items-center gap-1 shadow-sm"
                                                title="Spawn brand new unified incident"
                                            >
                                                <Plus className="w-3 h-3 text-sky-600" /> Create Case
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
