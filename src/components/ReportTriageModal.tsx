import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { RawReport, UnifiedIncident, IncidentStatus, CandidateLink } from '../types';
import {
    ShieldAlert,
    PhoneCall,
    Rss,
    ShieldCheck,
    AlertTriangle,
    Link2,
    Plus,
    X,
    Search,
    MapPin,
    Clock,
    Sparkles,
    CheckCircle2,
    FileText,
    ExternalLink,
    Flag,
    Send,
    SplitSquareVertical,
    Check
} from 'lucide-react';

interface ReportTriageModalProps {
    report: RawReport;
    onClose: () => void;
    onOpenIncident: (incident: UnifiedIncident) => void;
}

export const ReportTriageModal: React.FC<ReportTriageModalProps> = ({
    report,
    onClose,
    onOpenIncident
}) => {
    const {
        incidents,
        mergeReportToIncident,
        createIncidentFromReport,
        keepReportAsSeparateIncident,
        flagReportMisleading,
        addReportNote,
        updateIncidentStatus,
        getCandidateLinksForReport
    } = useEmergency();

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedTargetIncidentId, setSelectedTargetIncidentId] = useState<string | null>(null);
    const [operatorMergeNote, setOperatorMergeNote] = useState<string>('');
    const [newReportNoteText, setNewReportNoteText] = useState<string>('');
    const [statusUpdateChoice, setStatusUpdateChoice] = useState<IncidentStatus | ''>('');
    const [showFlagConfirm, setShowFlagConfirm] = useState<boolean>(false);
    const [flagReason, setFlagReason] = useState<string>('Unverified false claim or spam call');

    // Candidate links computed by correlation engine
    const candidateLinks = getCandidateLinksForReport(report);

    // Initial selected target incident: highest score candidate if exists
    React.useEffect(() => {
        if (candidateLinks.length > 0 && !selectedTargetIncidentId) {
            setSelectedTargetIncidentId(candidateLinks[0].targetIncidentId);
        }
    }, [candidateLinks, selectedTargetIncidentId]);

    // Active incidents matching search query
    const filteredIncidents = incidents.filter(inc => {
        if (inc.status === 'RESOLVED' || inc.status === 'CLOSED') return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            inc.id.toLowerCase().includes(q) ||
            inc.title.toLowerCase().includes(q) ||
            inc.locationDescription.toLowerCase().includes(q) ||
            inc.category.toLowerCase().includes(q)
        );
    });

    const selectedTargetIncident = incidents.find(i => i.id === selectedTargetIncidentId) || null;

    // Handle Attach / Merge
    const handleAttachToIncident = () => {
        if (!selectedTargetIncidentId) return;
        mergeReportToIncident(report.id, selectedTargetIncidentId, operatorMergeNote.trim() || undefined);

        if (statusUpdateChoice) {
            updateIncidentStatus(selectedTargetIncidentId, statusUpdateChoice);
        }

        onClose();
    };

    // Handle Create New Incident
    const handleCreateNew = () => {
        createIncidentFromReport(report.id);
        onClose();
    };

    // Handle Keep as Separate Incident
    const handleKeepSeparate = () => {
        keepReportAsSeparateIncident(report.id);
        onClose();
    };

    // Handle Add Note to Raw Report
    const handleAddReportNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReportNoteText.trim()) return;
        addReportNote(report.id, newReportNoteText.trim());
        setNewReportNoteText('');
    };

    // Handle Flag Misleading
    const handleConfirmFlag = () => {
        flagReportMisleading(report.id, flagReason);
        setShowFlagConfirm(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-sm animate-fadeIn select-none">
            <div className="bg-white border border-sky-400/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.30)]">
                {/* Header */}
                <div className="p-4 border-b border-sky-400/30 bg-sky-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-sky-100/80 border border-sky-400/30 text-sky-700 shadow-sm">
                            {report.sourceType === 'PHONE_CALL' ? (
                                <PhoneCall className="w-5 h-5 text-sky-600" />
                            ) : report.sourceType === 'OFFICIAL_ALERT' ? (
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            ) : (
                                <Rss className="w-5 h-5 text-amber-600" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-400/30">
                                    {report.id}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    {report.sourceType.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                    report.aiSuggestedSeverity === 'CRITICAL' ? 'bg-red-100 text-red-800 border border-red-300' :
                                    report.aiSuggestedSeverity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                }`}>
                                    {report.aiSuggestedSeverity} SEVERITY
                                </span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-900 mt-1">
                                Operator Report Intake & Spatiotemporal Triage Hub
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-sky-100/60 transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Split Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Left 5 Cols: Incoming Report Details & Notes */}
                    <div className="lg:col-span-5 space-y-4">
                        <div className="p-4 rounded-xl bg-white border border-sky-400/30 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-sky-600" />
                                Report Transmission Details
                            </h3>

                            <div className="p-3 rounded-lg bg-sky-50/40 border border-sky-400/20 text-xs text-slate-800 font-sans leading-relaxed">
                                <p className="italic font-medium">"{report.rawText}"</p>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Caller / Source:</span>
                                    <span className="font-semibold text-slate-900">{report.reporterName || report.sourceName}</span>
                                </div>
                                {report.contactNumber && (
                                    <div className="flex items-center justify-between text-slate-500">
                                        <span>Contact Number:</span>
                                        <span className="font-mono text-sky-700 font-bold">{report.contactNumber}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Location Description:</span>
                                    <span className="text-slate-800 font-medium flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                        {report.locationName}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Location Accuracy:</span>
                                    <span className="font-mono text-[11px]">
                                        {report.locationAccuracy === 'TEXT_DERIVED' ? (
                                            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                                ⚠️ Text-Derived
                                            </span>
                                        ) : report.locationAccuracy === 'APPROXIMATE' ? (
                                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                ⚠️ Approximate
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                                Exact GPS
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Ingestion Timestamp:</span>
                                    <span className="font-mono text-slate-700 font-medium">
                                        {new Date(report.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            </div>

                            {/* AI Suggestion Box */}
                            <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] text-sky-800 font-semibold">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                                        AI Assistant Telemetry
                                    </span>
                                    <span className="font-mono font-bold">{report.aiCategoryConfidence}% Confidence</span>
                                </div>
                                <div className="text-[11px] text-slate-700">
                                    Suggested Category: <strong className="text-slate-900">{report.aiSuggestedCategory.replace('_', ' ')}</strong>
                                </div>
                            </div>
                        </div>

                        {/* Report Operator Notes */}
                        <div className="p-4 rounded-xl bg-white border border-sky-400/30 shadow-sm space-y-3">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Operator Notes & Intake Observations
                            </h3>

                            {report.notes && report.notes.length > 0 ? (
                                <div className="space-y-1.5 max-h-28 overflow-y-auto">
                                    {report.notes.map((note, idx) => (
                                        <div key={idx} className="p-2 rounded bg-sky-50/40 text-xs text-slate-800 border border-sky-400/20">
                                            {note}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-slate-400 italic">No notes logged for this report yet.</p>
                            )}

                            <form onSubmit={handleAddReportNote} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add operator intake note..."
                                    value={newReportNoteText}
                                    onChange={e => setNewReportNoteText(e.target.value)}
                                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs border border-sky-500 transition-colors flex items-center gap-1 shadow-sm"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>

                        {/* Flag Misleading Accordion */}
                        <div className="pt-1">
                            {!showFlagConfirm ? (
                                <button
                                    onClick={() => setShowFlagConfirm(true)}
                                    className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors font-medium"
                                >
                                    <Flag className="w-3.5 h-3.5" />
                                    <span>Flag Report as Misleading or False Call</span>
                                </button>
                            ) : (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-2 text-xs">
                                    <span className="font-semibold text-red-800">Flag Misleading Report Reason:</span>
                                    <input
                                        type="text"
                                        value={flagReason}
                                        onChange={e => setFlagReason(e.target.value)}
                                        className="w-full px-2.5 py-1.5 rounded bg-white border border-red-300 text-xs text-slate-900 focus:outline-none"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setShowFlagConfirm(false)}
                                            className="px-2.5 py-1 rounded text-slate-600 hover:text-slate-800 text-[11px]"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleConfirmFlag}
                                            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow-sm"
                                        >
                                            Confirm Flag
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right 7 Cols: Duplicate Correlation, Search Existing Incidents, and Operator Actions */}
                    <div className="lg:col-span-7 space-y-4">
                        {/* Spatiotemporal Duplicate Correlation Engine Recommendations */}
                        {candidateLinks.length > 0 && (
                            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/40 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-amber-600 animate-pulse" />
                                        <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                                            Automated Duplicate Matches Detected ({candidateLinks.length})
                                        </h3>
                                    </div>
                                    <span className="text-[10px] text-amber-700 font-mono font-semibold">Spatiotemporal Proximity Match</span>
                                </div>

                                <div className="space-y-2">
                                    {candidateLinks.map(link => {
                                        const inc = incidents.find(i => i.id === link.targetIncidentId);
                                        if (!inc) return null;
                                        const isSelected = selectedTargetIncidentId === inc.id;

                                        return (
                                            <div
                                                key={link.targetIncidentId}
                                                onClick={() => setSelectedTargetIncidentId(inc.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-400/40'
                                                        : 'bg-white/80 border-amber-200 hover:border-amber-400'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sky-700 font-bold text-xs">{inc.id}</span>
                                                        <span className="text-xs font-semibold text-slate-900">{inc.title}</span>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-100 text-amber-800 border border-amber-300">
                                                        {link.breakdown.compositeScore}% Match
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                                                    {inc.summary}
                                                </p>

                                                <div className="grid grid-cols-4 gap-1 p-1.5 rounded bg-slate-50 border border-slate-200 text-[10px] text-center font-mono text-slate-600">
                                                    <div>Distance: <strong className="text-sky-700">{link.breakdown.distanceKm}km</strong></div>
                                                    <div>Time: <strong className="text-sky-700">{link.breakdown.timeDiffMinutes}m</strong></div>
                                                    <div>Category: <strong className="text-sky-700">{link.breakdown.categoryScore}%</strong></div>
                                                    <div>Text: <strong className="text-sky-700">{link.breakdown.semanticScore}%</strong></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Search Any Existing Incident */}
                        <div className="p-4 rounded-xl bg-white border border-sky-400/30 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                    <Search className="w-4 h-4 text-sky-600" />
                                    Search Possible Existing Incidents
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    Select an incident below to link this report
                                </span>
                            </div>

                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Search by incident ID, title, category, or location..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                />
                            </div>

                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {filteredIncidents.length === 0 ? (
                                    <div className="p-4 text-center text-slate-400 text-xs">
                                        No active incidents match your query.
                                    </div>
                                ) : (
                                    filteredIncidents.map(inc => {
                                        const isSelected = selectedTargetIncidentId === inc.id;
                                        return (
                                            <div
                                                key={inc.id}
                                                onClick={() => setSelectedTargetIncidentId(inc.id)}
                                                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between text-xs transition-all ${
                                                    isSelected
                                                        ? 'bg-sky-50 border-sky-400 text-slate-900 shadow-sm ring-1 ring-sky-400/40'
                                                        : 'bg-white border-slate-200 hover:border-sky-300 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sky-700 font-bold">{inc.id}</span>
                                                    <span className="font-medium truncate max-w-xs">{inc.title}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px]">
                                                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
                                                        inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                                        inc.severity === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {inc.severity}
                                                    </span>
                                                    <span className="text-slate-500 font-mono">{inc.status}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Selected Incident Action Workspace */}
                        {selectedTargetIncident && (
                            <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-400/30 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] text-sky-700 uppercase font-mono font-bold">Selected Target Incident:</div>
                                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2 mt-0.5">
                                            <span>{selectedTargetIncident.id} - {selectedTargetIncident.title}</span>
                                        </div>
                                    </div>

                                    {/* Open matching incident button */}
                                    <button
                                        onClick={() => onOpenIncident(selectedTargetIncident)}
                                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-sky-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-sky-400/30 shadow-sm"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>Open Matching Incident Hub</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-sky-400/20">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Add Merge Note to Incident Log:</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Eyewitness corroborates multi-car collision"
                                            value={operatorMergeNote}
                                            onChange={e => setOperatorMergeNote(e.target.value)}
                                            className="w-full px-2.5 py-1.5 rounded bg-white border border-sky-400/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Update Incident Status (Optional):</label>
                                        <select
                                            value={statusUpdateChoice}
                                            onChange={e => setStatusUpdateChoice(e.target.value as IncidentStatus)}
                                            className="w-full px-2.5 py-1.5 rounded bg-white border border-sky-400/30 text-xs text-sky-900 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                        >
                                            <option value="">Keep Current ({selectedTargetIncident.status})</option>
                                            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                            <option value="VERIFIED">VERIFIED</option>
                                            <option value="RESPONSE_REQUESTED">RESPONSE_REQUESTED</option>
                                            <option value="TEAM_ASSIGNED">TEAM_ASSIGNED</option>
                                            <option value="RESPONDING">RESPONDING</option>
                                            <option value="RESOLVED">RESOLVED</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Confirm Attach Button */}
                                <div className="pt-1 flex justify-end">
                                    <button
                                        onClick={handleAttachToIncident}
                                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-colors flex items-center gap-2"
                                    >
                                        <Link2 className="w-4 h-4" />
                                        <span>Attach & Merge Report to {selectedTargetIncident.id}</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Operator Master Controls Footer */}
                <div className="p-4 border-t border-sky-400/30 bg-sky-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-slate-600">
                        Select an action above, or promote this intake to its own incident:
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Keep as separate incident */}
                        <button
                            onClick={handleKeepSeparate}
                            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-sky-400/30 shadow-sm transition-colors flex items-center gap-1.5"
                            title="Acknowledge this report as a distinct independent emergency, declining duplicate correlation"
                        >
                            <SplitSquareVertical className="w-4 h-4 text-amber-500" />
                            <span>Keep as Separate Incident</span>
                        </button>

                        {/* Create brand new unified incident */}
                        <button
                            onClick={handleCreateNew}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create New Unified Incident</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
