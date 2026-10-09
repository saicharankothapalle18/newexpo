import React, { useState } from 'react';
import { RawReport, UnifiedIncident, IncidentMatch, getCategoryDisplayLabel } from '../types';
import {
    AlertTriangle,
    Link2,
    PlusCircle,
    Eye,
    X,
    CheckCircle2,
    MapPin,
    Clock,
    PhoneCall,
    FileText,
    ShieldAlert,
    HelpCircle,
    ChevronRight,
    Users
} from 'lucide-react';

interface PossibleDuplicateModalProps {
    report: RawReport;
    match: IncidentMatch;
    targetIncident: UnifiedIncident;
    allMatches?: IncidentMatch[];
    allActiveIncidents?: UnifiedIncident[];
    onAttach: (reportId: string, incidentId: string, notes?: string) => void;
    onCreateNewIncident: (reportId: string) => void;
    onReviewDetails: (report: RawReport, incident: UnifiedIncident) => void;
    onClose: () => void;
}

export const PossibleDuplicateModal: React.FC<PossibleDuplicateModalProps> = ({
    report,
    match,
    targetIncident,
    allMatches = [],
    allActiveIncidents = [],
    onAttach,
    onCreateNewIncident,
    onReviewDetails,
    onClose
}) => {
    const [selectedMatch, setSelectedMatch] = useState<IncidentMatch>(match);
    const [operatorNotes, setOperatorNotes] = useState<string>('');

    const activeTarget = allActiveIncidents.find(i => i.id === selectedMatch.incidentId) || targetIncident;

    const handleAttach = () => {
        onAttach(report.id, activeTarget.id, operatorNotes.trim() ? operatorNotes.trim() : undefined);
    };

    const handleCreateNew = () => {
        onCreateNewIncident(report.id);
    };

    const handleReview = () => {
        onReviewDetails(report, activeTarget);
    };

    // Severity color formatting (RED, ORANGE, YELLOW strictly, NO GREEN)
    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/60 flex items-center gap-1">🔴 CRITICAL</span>;
            case 'HIGH':
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60 flex items-center gap-1">🟠 HIGH RISK</span>;
            case 'MEDIUM':
            case 'LOW':
            default:
                return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-950/80 text-yellow-300 border border-yellow-700/60 flex items-center gap-1">🟡 MODERATE</span>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-md select-none overflow-y-auto">
            <div className="bg-white border-2 border-amber-400 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_10px_40px_rgba(56,189,248,0.25)] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-50 via-white to-white border-b border-amber-300 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-600">
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold">
                                    Operator Decision Support
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                    AI Scoring Engine
                                </span>
                            </div>
                            <h2 className="text-base font-extrabold text-slate-900 tracking-wide flex items-center gap-2">
                                ⚠️ POSSIBLE DUPLICATE REPORT DETECTED
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 max-h-[calc(85vh-130px)] overflow-y-auto text-xs text-slate-700">
                    
                    {/* Top Callout Box: Match Confidence */}
                    <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="text-[11px] text-slate-600 uppercase font-mono">
                                New Report: <strong className="text-slate-900 font-bold">{report.id}</strong>
                            </div>
                            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                Possible Existing Incident:
                                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-400/30 font-mono text-xs font-bold">
                                    {activeTarget.id}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-xs text-slate-600 font-medium">Match Confidence</div>
                                <div className="text-2xl font-black text-amber-700 font-mono">
                                    {selectedMatch.matchConfidence}% <span className="text-xs font-normal text-amber-800">likely related</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-full border-4 border-amber-400 border-t-amber-600 flex items-center justify-center bg-white font-mono font-bold text-sm text-amber-800 shadow-sm">
                                {selectedMatch.matchConfidence}%
                            </div>
                        </div>
                    </div>

                    {/* Multiple candidate matches selector if more than 1 active candidate */}
                    {allMatches.length > 1 && (
                        <div className="p-2.5 rounded-lg bg-sky-50/60 border border-sky-400/30 flex items-center justify-between">
                            <span className="text-[11px] text-slate-600 font-medium">
                                Multiple candidate incidents match this call:
                            </span>
                            <div className="flex items-center gap-1.5">
                                {allMatches.slice(0, 3).map(m => (
                                    <button
                                        key={m.incidentId}
                                        onClick={() => setSelectedMatch(m)}
                                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                                            selectedMatch.incidentId === m.incidentId
                                                ? 'bg-amber-500 text-white border border-amber-400 shadow-sm'
                                                : 'bg-white text-slate-600 hover:text-slate-900 border border-sky-400/30'
                                        }`}
                                    >
                                        {m.incidentId} ({m.matchConfidence}%)
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Match Reasons List */}
                    <div className="p-3.5 rounded-xl bg-white border border-sky-400/30 space-y-2 shadow-sm">
                        <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                            <span>Detected Correlation Reasons</span>
                            <span className="text-[10px] font-mono text-slate-500">
                                Proximity: {selectedMatch.distanceKm < 1 ? `${Math.round(selectedMatch.distanceKm * 1000)}m` : `${selectedMatch.distanceKm} km`} • Time diff: {selectedMatch.timeDiffMinutes} min
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {selectedMatch.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{reason}</span>
                                </div>
                            ))}
                        </div>

                        {/* Weighted Breakdown Badges */}
                        <div className="flex items-center gap-2 pt-2 border-t border-sky-400/20 flex-wrap text-[10px] font-mono text-slate-600">
                            <span className="text-slate-500 font-bold">Factors:</span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-400/30 text-sky-800">
                                Location (40%): {selectedMatch.weightsBreakdown.locationScore}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-400/30 text-sky-800">
                                Type (20%): {selectedMatch.weightsBreakdown.typeScore}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-400/30 text-sky-800">
                                Time (15%): {selectedMatch.weightsBreakdown.timeScore}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-400/30 text-sky-800">
                                Description (15%): {selectedMatch.weightsBreakdown.descriptionScore}%
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 border border-sky-400/30 text-sky-800">
                                Landmark (10%): {selectedMatch.weightsBreakdown.landmarkScore}%
                            </span>
                        </div>
                    </div>

                    {/* Side-by-Side Comparison Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* New Incoming Report Box */}
                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/30 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between border-b border-sky-400/20 pb-1.5">
                                <span className="font-bold text-sky-700 flex items-center gap-1.5">
                                    <PhoneCall className="w-3.5 h-3.5" />
                                    New Incoming Report ({report.id})
                                </span>
                                {getSeverityBadge(report.aiSuggestedSeverity)}
                            </div>
                            
                            <div className="space-y-1.5 text-[11px]">
                                <div className="text-slate-700">
                                    <span className="text-slate-500">Caller:</span> {report.reporterName || 'Anonymous'} {report.contactNumber ? `(${report.contactNumber})` : ''}
                                </div>
                                <div className="text-slate-700 flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                                    <span>{report.locationName}</span>
                                </div>
                                <div className="text-slate-700">
                                    <span className="text-slate-500">Type:</span> {getCategoryDisplayLabel(report.category)}
                                </div>
                                <div className="p-2 rounded bg-sky-50/60 border border-sky-400/20 text-slate-800 text-xs italic">
                                    "{report.rawText}"
                                </div>
                                {report.affectedPeople ? (
                                    <div className="text-amber-700 font-mono text-[10px] font-bold">
                                        Reported Affected: {report.affectedPeople} people
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Existing Active Incident Box */}
                        <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
                                <span className="font-bold text-amber-800 flex items-center gap-1.5">
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    Existing Unified Incident ({activeTarget.id})
                                </span>
                                {getSeverityBadge(activeTarget.severity)}
                            </div>

                            <div className="space-y-1.5 text-[11px]">
                                <div className="text-slate-700">
                                    <span className="text-slate-500">Title:</span> {activeTarget.title}
                                </div>
                                <div className="text-slate-700 flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>{activeTarget.locationDescription}</span>
                                </div>
                                <div className="text-slate-700 flex items-center justify-between">
                                    <span><span className="text-slate-500">Type:</span> {getCategoryDisplayLabel(activeTarget.category)}</span>
                                    <span className="font-mono text-sky-700 font-bold">
                                        {activeTarget.childReportIds.length} Linked Reports
                                    </span>
                                </div>
                                <div className="p-2 rounded bg-amber-50/60 border border-amber-200 text-slate-800 text-xs italic line-clamp-3">
                                    "{activeTarget.summary}"
                                </div>
                                <div className="text-slate-600 font-mono text-[10px]">
                                    Status: <strong className="text-amber-800">{activeTarget.status}</strong> • Affected: {activeTarget.affectedPeople || activeTarget.victimEstCount || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operator Note on Attachment */}
                    <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Operator Action Notes (Optional):
                        </label>
                        <input
                            type="text"
                            value={operatorNotes}
                            onChange={e => setOperatorNotes(e.target.value)}
                            placeholder="e.g. Caller 3 confirms 2nd vehicle rollover near bus depot, no additional fire."
                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30 transition-colors shadow-sm"
                        />
                    </div>

                    {/* Human Governance Notice */}
                    <div className="p-2 rounded-lg bg-sky-50/70 border border-sky-400/30 text-[11px] text-slate-600 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>
                            <strong>Operator Mandate:</strong> The system does NOT automatically merge reports or dispatch emergency services. Select an action below based on call verification.
                        </span>
                    </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-white border-t border-sky-400/20 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <button
                        type="button"
                        onClick={handleReview}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                        <Eye className="w-4 h-4 text-slate-500" />
                        REVIEW DETAILS
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handleCreateNew}
                            className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            title="Decline duplicate merge and maintain as a separate independent incident"
                        >
                            <PlusCircle className="w-4 h-4 text-amber-600" />
                            CREATE NEW INCIDENT
                        </button>

                        <button
                            type="button"
                            onClick={handleAttach}
                            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all active:scale-95"
                        >
                            <Link2 className="w-4 h-4 text-white" />
                            ATTACH TO INCIDENT
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

