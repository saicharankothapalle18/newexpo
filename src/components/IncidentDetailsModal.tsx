import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UnifiedIncident, IncidentStatus, RawReport, SeverityLevel, ResponseTeamType, ResponseTeamAssignment, getCategoryDisplayLabel } from '../types';
import { IncidentTimeline } from './IncidentTimeline';
import {
    computeIncidentRiskZone,
    getLocationAccuracyLabel,
    RISK_COLORS,
    isIncidentZoneActive,
    getRiskLevelTitle
} from '../utils/riskZone';
import {
    ShieldAlert,
    AlertTriangle,
    Info,
    X,
    CheckCircle2,
    Link2,
    Unlink,
    Users,
    Clock,
    MapPin,
    MessageSquare,
    Send,
    ShieldCheck,
    Activity,
    Plus,
    Check,
    SplitSquareVertical,
    FileText,
    ExternalLink,
    Compass,
    Radio,
    PhoneCall,
    Siren,
    Truck,
    HeartPulse,
    Flame
} from 'lucide-react';

interface IncidentDetailsModalProps {
    incident: UnifiedIncident;
    onClose: () => void;
    onInspectReport?: (report: RawReport) => void;
}

export const IncidentDetailsModal: React.FC<IncidentDetailsModalProps> = ({
    incident,
    onClose,
    onInspectReport
}) => {
    const {
        reports,
        units,
        verifyIncident,
        mergeReportToIncident,
        unlinkReportFromIncident,
        updateIncidentStatus,
        updateIncidentSeverity,
        resolveIncident,
        addIncidentNote,
        dispatchUnit,
        coordinateResponseTeam,
        currentRole,
        currentUser,
        getCandidateLinksForReport
    } = useEmergency();

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TIMELINE' | 'REPORTS' | 'UNITS'>('OVERVIEW');
    const [newNoteText, setNewNoteText] = useState<string>('');
    const [selectedUnitToDispatch, setSelectedUnitToDispatch] = useState<string>('');
    const [selectedTeamType, setSelectedTeamType] = useState<ResponseTeamType>('POLICE');
    const [teamNameInput, setTeamNameInput] = useState<string>('Metro Police Squad 4');
    const [teamNotesInput, setTeamNotesInput] = useState<string>('');

    const childReports = reports.filter(r => incident.childReportIds.includes(r.id));
    const assignedUnits = units.filter(u => incident.assignedUnitIds.includes(u.id));
    const availableUnits = units.filter(u => u.status === 'AVAILABLE');

    const zone = computeIncidentRiskZone(incident);
    const accuracy = getLocationAccuracyLabel(incident.locationAccuracy);
    const isZoneActive = isIncidentZoneActive(incident);

    // Candidate duplicate reports matching this incident
    const candidateReports = reports.filter(r => {
        if (r.assignedIncidentId || r.acknowledgedSeparate || r.isFlaggedMisleading) return false;
        const links = getCandidateLinksForReport(r);
        return links.some(l => l.targetIncidentId === incident.id);
    });

    const handleAddNote = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNoteText.trim()) return;
        addIncidentNote(incident.id, newNoteText.trim());
        setNewNoteText('');
    };

    const handleDispatch = () => {
        if (!selectedUnitToDispatch) return;
        dispatchUnit(selectedUnitToDispatch, incident.id);
        setSelectedUnitToDispatch('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/40 backdrop-blur-md animate-fadeIn select-none">
            <div className="bg-white border border-sky-400/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-[0_10px_40px_rgba(56,189,248,0.25)]">
                {/* Header Bar */}
                <div className="p-4 border-b border-sky-400/20 bg-white/95 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${incident.severity === 'CRITICAL' ? 'bg-red-50 border-red-300 text-red-600' :
                                incident.severity === 'HIGH' ? 'bg-amber-50 border-amber-300 text-amber-600' :
                                    'bg-sky-50 border-sky-300 text-sky-600'
                            }`}>
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-400/30">
                                    {incident.id}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                                        incident.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                            'bg-sky-100 text-sky-800 border border-sky-300'
                                    }`}>
                                    {incident.severity}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-semibold">
                                    {incident.category.replace('_', ' ')}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${incident.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                        'bg-sky-50 text-sky-800 border border-sky-400/30'
                                    }`}>
                                    {incident.status}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-slate-900 mt-1">{incident.title}</h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-navigation Tabs Bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-sky-400/20 bg-sky-50/40 text-xs overflow-x-auto">
                    {[
                        { id: 'OVERVIEW', label: 'Incident Overview & Notes' },
                        { id: 'TIMELINE', label: `Chronological Timeline` },
                        { id: 'REPORTS', label: `Linked Reports (${childReports.length})` },
                        { id: 'UNITS', label: `Assigned Units (${assignedUnits.length})` }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id as any)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${activeTab === t.id
                                    ? 'bg-sky-500/20 text-sky-900 border border-sky-400/40 shadow-sm font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    {activeTab === 'OVERVIEW' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                            {/* Left 8 Cols: Summary, Candidate Duplicates, Verification, Notes */}
                            <div className="lg:col-span-8 space-y-4">
                                {/* Summary Box */}
                                <div className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Executive Briefing & Location
                                    </h3>
                                    <p className="text-xs text-slate-700 leading-relaxed font-sans">{incident.summary}</p>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-sky-400/20">
                                        <div className="text-slate-600">
                                            <div className="text-[10px] text-slate-400 uppercase font-mono">Location & Region</div>
                                            <div className="text-slate-800 font-medium truncate" title={`${incident.locationDescription} • ${incident.city || ''}, ${incident.country || ''}`}>
                                                {incident.city ? `${incident.city}, ${incident.country || ''}` : incident.locationDescription}
                                            </div>
                                            <div className="text-[10px] text-sky-600 font-mono truncate">{incident.locationDescription}</div>
                                        </div>
                                        <div className="text-slate-600">
                                            <div className="text-[10px] text-slate-400 uppercase font-mono">Casualties Est</div>
                                            <div className="text-slate-900 font-bold">{incident.victimEstCount} Victims</div>
                                        </div>
                                        <div className="text-slate-600">
                                            <div className="text-[10px] text-slate-400 uppercase font-mono">Hazmat Hazard</div>
                                            <div className="text-amber-600 font-bold">{incident.hazmatInvolved ? 'YES' : 'NONE'}</div>
                                        </div>
                                        <div className="text-slate-600">
                                            <div className="text-[10px] text-slate-400 uppercase font-mono">Created / Timezone</div>
                                            <div className="text-slate-800 font-mono">
                                                {new Date(incident.createdTime).toLocaleTimeString()}
                                                {incident.timeZone && <span className="text-[9px] text-slate-500 block">{incident.timeZone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Operator Human Verification Card */}
                                <div className="p-3.5 rounded-xl bg-white border border-sky-400/30 flex items-center justify-between gap-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                            Human Authorization Governance
                                        </div>
                                        <p className="text-[11px] text-slate-500">
                                            {incident.verifiedBy ? (
                                                <>Authorized by <strong className="text-emerald-700">{incident.verifiedBy}</strong> at {new Date(incident.verifiedAt!).toLocaleTimeString()}</>
                                            ) : (
                                                <span className="text-amber-700 font-semibold">Awaiting Call-Center Operator Verification Sign-Off</span>
                                            )}
                                        </p>
                                    </div>

                                    {!incident.verifiedBy ? (
                                        <button
                                            onClick={() => verifyIncident(incident.id)}
                                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            Verify Incident
                                        </button>
                                    ) : (
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-mono">
                                            <Check className="w-3 h-3 text-emerald-600" />
                                            VERIFIED
                                        </span>
                                    )}
                                </div>

                                {/* Candidate Duplicates Alert Panel */}
                                {candidateReports.length > 0 && (
                                    <div className="glass-panel p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-3 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                                                <Link2 className="w-4 h-4 text-amber-600 animate-pulse" />
                                                Candidate Duplicate Reports Detected ({candidateReports.length})
                                            </h3>
                                            <span className="text-[10px] text-amber-700 font-mono font-bold">Awaiting Operator Approval</span>
                                        </div>

                                        <div className="space-y-2">
                                            {candidateReports.map(rep => {
                                                const links = getCandidateLinksForReport(rep);
                                                const link = links.find(l => l.targetIncidentId === incident.id);
                                                if (!link) return null;

                                                return (
                                                    <div key={rep.id} className="p-3 rounded-xl bg-white border border-sky-400/30 text-xs space-y-2 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sky-700 font-bold">{rep.id}</span>
                                                                <span className="text-slate-500 text-[11px]">({rep.sourceName})</span>
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono font-bold text-[11px] border border-amber-300">
                                                                {link.breakdown.compositeScore}% Match
                                                            </span>
                                                        </div>

                                                        <p className="text-slate-700 text-[11px]">"{rep.rawText}"</p>

                                                        <div className="grid grid-cols-4 gap-1 p-1.5 rounded bg-sky-50/70 border border-sky-400/30 text-[10px] text-center font-mono text-slate-600">
                                                            <div>Dist: <strong className="text-sky-700">{link.breakdown.distanceKm}km</strong></div>
                                                            <div>Time: <strong className="text-sky-700">{link.breakdown.timeDiffMinutes}m</strong></div>
                                                            <div>Category: <strong className="text-sky-700">{link.breakdown.categoryScore}%</strong></div>
                                                            <div>Semantic: <strong className="text-sky-700">{link.breakdown.semanticScore}%</strong></div>
                                                        </div>

                                                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-sky-400/20">
                                                            <button
                                                                onClick={() => mergeReportToIncident(rep.id, incident.id)}
                                                                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Link2 className="w-3.5 h-3.5" /> Approve & Attach Duplicate
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Operator Notes Log */}
                                <div className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <MessageSquare className="w-4 h-4 text-sky-600" />
                                        Operator Shift Notes & Updates ({incident.notes.length})
                                    </h3>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                        {incident.notes.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No notes logged yet.</p>
                                        ) : (
                                            incident.notes.map(note => (
                                                <div key={note.id} className="p-2.5 rounded-lg bg-sky-50/40 border border-sky-400/20 text-xs space-y-1 shadow-sm">
                                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                                        <span className="font-semibold text-sky-700">{note.authorRole} ({note.authorId})</span>
                                                        <span className="font-mono">{new Date(note.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                    <p className="text-slate-800">{note.text}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add Note Form */}
                                    <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                                        <input
                                            type="text"
                                            placeholder="Log operational update or dispatch note..."
                                            value={newNoteText}
                                            onChange={e => setNewNoteText(e.target.value)}
                                            className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30"
                                        />
                                        <button
                                            type="submit"
                                            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm border border-sky-400/30"
                                        >
                                            <Send className="w-3.5 h-3.5" /> Log Note
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Right 4 Cols: Geospatial Risk Zone & Lifecycle Status */}
                            <div className="lg:col-span-4 space-y-4">
                                {/* Geospatial Risk Zone Card */}
                                <div className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm" style={{ borderLeft: `4px solid ${zone.color}` }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900">
                                            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                                            <span>GPS Tactical Risk Zone</span>
                                        </div>
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${RISK_COLORS[zone.riskLevel].badge}`}>
                                            {zone.riskLevel === 'RED' && '🔴 CRITICAL'}
                                            {zone.riskLevel === 'ORANGE' && '🟠 HIGH RISK'}
                                            {zone.riskLevel === 'YELLOW' && '🟡 MODERATE'}
                                        </span>
                                    </div>

                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">Zone Status:</span>
                                            <span className={`font-mono font-bold ${isZoneActive ? 'text-sky-700' : 'text-slate-400'}`}>
                                                {isZoneActive ? 'Active On Tactical Map' : 'Inactive (Resolved/Closed)'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">Estimated Radius:</span>
                                            <span className="font-mono font-bold text-slate-900">{zone.radiusMeters} meters</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500">GPS Accuracy:</span>
                                            <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded border ${accuracy.badgeClass}`}>
                                                {accuracy.text}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1 border-t border-sky-400/20">
                                            <span>Region:</span>
                                            <span className="text-sky-700 font-semibold">🌍 {[incident.city, incident.country].filter(Boolean).join(', ') || 'Global'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                            <span>GPS Coords:</span>
                                            <span>{incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</span>
                                        </div>
                                    </div>

                                    {/* Dynamic Severity Quick Tuner */}
                                    <div className="pt-2 border-t border-sky-400/20 space-y-1.5">
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between font-bold">
                                            <span>Severity Level</span>
                                            <span className="text-[9px] text-sky-600 font-sans font-semibold">Updates Map Radius & Color</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                type="button"
                                                onClick={() => updateIncidentSeverity(incident.id, 'CRITICAL')}
                                                className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold border transition-all ${
                                                    incident.severity === 'CRITICAL'
                                                        ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-300'
                                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                                }`}
                                            >
                                                🔴 Red
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateIncidentSeverity(incident.id, 'HIGH')}
                                                className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold border transition-all ${
                                                    incident.severity === 'HIGH'
                                                        ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-300'
                                                        : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                                }`}
                                            >
                                                🟠 Orange
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateIncidentSeverity(incident.id, 'MEDIUM')}
                                                className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold border transition-all ${
                                                    incident.severity === 'MEDIUM' || incident.severity === 'LOW'
                                                        ? 'bg-yellow-400 text-slate-900 border-yellow-300 shadow-md ring-2 ring-yellow-200'
                                                        : 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                                                }`}
                                            >
                                                🟡 Yellow
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Lifecycle Status Selector */}
                                <div className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Lifecycle Status State
                                    </h3>

                                    <select
                                        value={incident.status}
                                        onChange={e => updateIncidentStatus(incident.id, e.target.value as IncidentStatus)}
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-sky-800 font-semibold focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30"
                                    >
                                        {(['NEW', 'UNDER_REVIEW', 'POSSIBLE_DUPLICATE', 'VERIFIED', 'RESPONSE_REQUESTED', 'TEAM_ASSIGNED', 'RESPONDING', 'RESOLVED', 'CLOSED'] as IncidentStatus[]).map(st => (
                                            <option key={st} value={st}>{st.replace('_', ' ')}</option>
                                        ))}
                                    </select>

                                    <div className="pt-2 border-t border-sky-400/20 space-y-2">
                                        {incident.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => resolveIncident(incident.id, 'Resolved by Operator in Incident Hub')}
                                                className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <Check className="w-4 h-4 text-emerald-600" />
                                                <span>Mark Incident as Resolved</span>
                                            </button>
                                        )}

                                        {incident.status !== 'RESPONSE_REQUESTED' && incident.status !== 'TEAM_ASSIGNED' && incident.status !== 'RESPONDING' && incident.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => updateIncidentStatus(incident.id, 'RESPONSE_REQUESTED')}
                                                className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <ShieldAlert className="w-4 h-4 text-red-600" />
                                                <span>Request Emergency Response</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Fast Unit Dispatch Card */}
                                <div className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-purple-600" />
                                        Dispatched Units ({assignedUnits.length})
                                    </h3>

                                    <div className="space-y-1.5">
                                        {assignedUnits.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No response units assigned yet.</p>
                                        ) : (
                                            assignedUnits.map(unit => (
                                                <div key={unit.id} className="p-2 rounded-lg bg-sky-50/40 border border-sky-400/20 text-xs flex items-center justify-between shadow-sm">
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{unit.callSign}</div>
                                                        <div className="text-[10px] text-slate-500">ETA: {unit.etaMinutes ?? 0}m</div>
                                                    </div>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 font-mono">
                                                        {unit.status}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Dispatch select */}
                                    <div className="pt-2 border-t border-sky-400/20 space-y-2">
                                        <div className="flex gap-2">
                                            <select
                                                value={selectedUnitToDispatch}
                                                onChange={e => setSelectedUnitToDispatch(e.target.value)}
                                                className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                            >
                                                <option value="">Dispatch Unit...</option>
                                                {availableUnits.map(u => (
                                                    <option key={u.id} value={u.id}>{u.callSign} ({u.unitType})</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleDispatch}
                                                disabled={!selectedUnitToDispatch}
                                                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm"
                                            >
                                                Deploy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Timeline Tab */}
                    {activeTab === 'TIMELINE' && (
                        <div className="max-w-3xl mx-auto py-2">
                            <IncidentTimeline
                                incident={incident}
                                childReports={childReports}
                                units={units}
                            />
                        </div>
                    )}

                    {/* Linked Reports Tab (Requirements 5 & 10) */}
                    {activeTab === 'REPORTS' && (
                        <div className="space-y-4">
                            {/* Summary Bar for Consolidated Reports */}
                            <div className="p-3.5 rounded-xl bg-white border border-sky-400/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono shadow-sm">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Total Linked Calls</div>
                                    <div className="text-lg font-bold text-sky-700">{childReports.length} Reports</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Unique Callers</div>
                                    <div className="text-lg font-bold text-slate-900">
                                        {new Set(childReports.map(r => r.reporterName || r.contactNumber || r.id)).size} Callers
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">First Report Intake</div>
                                    <div className="text-xs font-semibold text-slate-800 mt-1">
                                        {childReports[0] ? new Date(childReports[0].timestamp).toLocaleTimeString() : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold">Latest Intake Update</div>
                                    <div className="text-xs font-semibold text-amber-700 mt-1">
                                        {childReports.length > 0 ? new Date(childReports[childReports.length - 1].timestamp).toLocaleTimeString() : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-slate-600 font-medium">
                                Detailed records for each linked intake call. All raw records are preserved independently:
                            </div>

                            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                                {childReports.map(rep => (
                                    <div key={rep.id} className="p-3.5 rounded-xl bg-white border border-sky-400/30 text-xs space-y-2 hover:border-sky-400 hover:shadow-[0_2px_15px_rgba(56,189,248,0.20)] transition-all shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-sky-400/20 pb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sky-700 font-bold">{rep.id}</span>
                                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-50 border border-sky-400/30 text-sky-800">
                                                    {rep.sourceName}
                                                </span>
                                                <span className="text-slate-600 text-[11px]">
                                                    Caller: <strong className="text-slate-900">{rep.reporterName || 'Anonymous'}</strong> {rep.contactNumber ? `(${rep.contactNumber})` : ''}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                    rep.aiSuggestedSeverity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-300' :
                                                    rep.aiSuggestedSeverity === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                    'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                                }`}>
                                                    {rep.aiSuggestedSeverity}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono">
                                                    {new Date(rep.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-slate-700 text-xs leading-relaxed italic">
                                            "{rep.rawText}"
                                        </p>

                                        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                                            <div className="flex items-center gap-1.5 truncate">
                                                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                                                <span className="truncate">{rep.locationName}</span>
                                                {rep.locationAccuracy && rep.locationAccuracy !== 'EXACT_GPS' && (
                                                    <span className="text-[9px] font-mono px-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                                        {rep.locationAccuracy}
                                                    </span>
                                                )}
                                            </div>

                                            {rep.affectedPeople ? (
                                                <span className="font-mono text-amber-700 font-bold text-[10px] shrink-0">
                                                    Reported Victims: {rep.affectedPeople}
                                                </span>
                                            ) : null}
                                        </div>

                                        {rep.notes && rep.notes.length > 0 && (
                                            <div className="p-2 rounded bg-sky-50/50 border border-sky-400/20 text-[11px] text-slate-700">
                                                <strong className="text-sky-700">Intake Notes:</strong> {rep.notes.join(' • ')}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-sky-400/20">
                                            {onInspectReport && (
                                                <button
                                                    onClick={() => onInspectReport(rep)}
                                                    className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-400/30 text-xs font-semibold shadow-sm"
                                                >
                                                    Inspect Report
                                                </button>
                                            )}
                                            <button
                                                onClick={() => unlinkReportFromIncident(rep.id, incident.id)}
                                                className="px-2.5 py-1 rounded text-red-600 hover:bg-red-50 border border-red-200 text-xs flex items-center gap-1 transition-colors"
                                                title="Unlink this report if it belongs to a separate real-world event"
                                            >
                                                <Unlink className="w-3.5 h-3.5" /> Unlink Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned Units & Response Team Coordination Tab (Requirement 7 & 12) */}
                    {activeTab === 'UNITS' && (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                            {/* Response Team Coordination Card */}
                            <div className="glass-panel p-4 rounded-xl border border-sky-400/30 bg-white space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-sky-400/20 text-sky-600">
                                            <Siren className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                Coordinate Authorized Response Team
                                            </h3>
                                            <p className="text-[10px] text-slate-500">
                                                Manual operator authorization for emergency service coordination
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-400/30 font-bold">
                                        Human Authorization Required
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                                            Team Agency / Type:
                                        </label>
                                        <select
                                            value={selectedTeamType}
                                            onChange={e => setSelectedTeamType(e.target.value as ResponseTeamType)}
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                        >
                                            <option value="POLICE">Police</option>
                                            <option value="MEDICAL">Medical / Ambulance</option>
                                            <option value="FIRE_RESCUE">Fire & Rescue</option>
                                            <option value="DISASTER_RESPONSE">Disaster Response</option>
                                            <option value="HAZMAT">Hazmat Containment</option>
                                            <option value="OTHER_AUTHORIZED">Other Authorized Team</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                                            Team Call Sign / Unit Name:
                                        </label>
                                        <input
                                            type="text"
                                            value={teamNameInput}
                                            onChange={e => setTeamNameInput(e.target.value)}
                                            placeholder="e.g. Traffic Division Unit 4"
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                                            Operator Instructions:
                                        </label>
                                        <input
                                            type="text"
                                            value={teamNotesInput}
                                            onChange={e => setTeamNotesInput(e.target.value)}
                                            placeholder="Route, perimeter, hazard info..."
                                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[10px] text-slate-500">
                                        ⚡ Coordinated team status transitions CAD case to RESPONSE_COORDINATED.
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!teamNameInput.trim()) return;
                                            coordinateResponseTeam(incident.id, selectedTeamType, teamNameInput.trim(), teamNotesInput.trim() || undefined);
                                            setTeamNotesInput('');
                                        }}
                                        className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 border border-sky-400/30"
                                    >
                                        <Siren className="w-3.5 h-3.5" />
                                        Coordinate Response Team
                                    </button>
                                </div>
                            </div>

                            {/* Coordinated Teams History List */}
                            {incident.responseTeamAssignments && incident.responseTeamAssignments.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Coordinated Authorized Teams ({incident.responseTeamAssignments.length})
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {incident.responseTeamAssignments.map(rta => (
                                            <div key={rta.id} className="p-3 rounded-xl bg-white border border-sky-400/30 text-xs space-y-1 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900 text-xs">{rta.teamName}</span>
                                                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                        {rta.status}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-600">
                                                    Agency: <strong className="text-sky-700">{rta.teamType.replace(/_/g, ' ')}</strong>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                    Authorized: {new Date(rta.assignedAt).toLocaleTimeString()} by {rta.authorizedBy || 'Operator'}
                                                </div>
                                                {rta.operatorNotes && (
                                                    <div className="text-[11px] text-slate-700 pt-1 border-t border-sky-400/20">
                                                        Note: {rta.operatorNotes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dispatched Field Units Section */}
                            <div className="space-y-2 pt-2">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-purple-600" />
                                    Tactical Response Field Units ({assignedUnits.length})
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {assignedUnits.map(unit => (
                                        <div key={unit.id} className="p-3.5 rounded-xl bg-white border border-sky-400/30 text-xs space-y-1.5 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">{unit.callSign}</span>
                                                <span className="px-2 py-0.5 rounded font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 text-[10px]">
                                                    {unit.status}
                                                </span>
                                            </div>
                                            <div className="text-slate-600">Type: <strong className="text-sky-700">{unit.unitType}</strong></div>
                                            <div className="text-slate-600">Personnel: <strong className="text-slate-900">{unit.personnelCount} responders</strong></div>
                                            <div className="text-slate-600">Estimated Arrival ETA: <strong className="text-emerald-700">{unit.etaMinutes ?? 0} minutes</strong></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
