import React from 'react';
import { UnifiedIncident, SeverityLevel } from '../types';
import {
    computeIncidentRiskZone,
    getLocationAccuracyLabel,
    RISK_COLORS,
    getRiskLevelTitle
} from '../utils/riskZone';
import { useEmergency } from '../context/EmergencyContext';
import {
    X,
    ShieldAlert,
    AlertTriangle,
    Info,
    MapPin,
    Clock,
    Users,
    FileText,
    Truck,
    CheckCircle2,
    Compass,
    Radio,
    ExternalLink,
    Check
} from 'lucide-react';

interface ZoneInfoPanelProps {
    incident: UnifiedIncident;
    onClose: () => void;
    onOpenFullDetails: (incident: UnifiedIncident) => void;
}

export const ZoneInfoPanel: React.FC<ZoneInfoPanelProps> = ({
    incident,
    onClose,
    onOpenFullDetails
}) => {
    const {
        units,
        updateIncidentSeverity,
        verifyIncident,
        resolveIncident
    } = useEmergency();

    const zone = computeIncidentRiskZone(incident);
    const locAccuracy = getLocationAccuracyLabel(incident.locationAccuracy);
    const assignedUnits = units.filter(u => incident.assignedUnitIds.includes(u.id));

    const isVerified = incident.status === 'VERIFIED' || incident.status === 'RESPONDING' || incident.status === 'TEAM_ASSIGNED' || !!incident.verifiedBy;

    const handleSeverityChange = (newSev: SeverityLevel) => {
        updateIncidentSeverity(incident.id, newSev);
    };

    const handleQuickResolve = () => {
        resolveIncident(incident.id, 'Resolved directly from Tactical Risk Zone Controller');
        onClose();
    };

    const handleQuickVerify = () => {
        verifyIncident(incident.id);
    };

    return (
        <div className="absolute bottom-3 right-3 sm:right-14 z-30 w-80 sm:w-96 max-w-[calc(100%-1.5rem)] max-h-[calc(100%-1.5rem)] bg-white/98 backdrop-blur-xl border border-sky-400/30 rounded-2xl shadow-[0_10px_40px_rgba(56,189,248,0.25)] overflow-hidden flex flex-col font-sans animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header bar with dynamic risk color styling */}
            <div
                className="p-3.5 border-b border-sky-400/20 flex items-center justify-between"
                style={{
                    borderTop: `4px solid ${zone.color}`,
                    background: `linear-gradient(180deg, ${zone.color}15 0%, rgba(240, 249, 255, 0.6) 100%)`
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shadow-md text-xs"
                        style={{ backgroundColor: zone.color }}
                    >
                        {zone.riskLevel === 'RED' && <ShieldAlert className="w-4 h-4" />}
                        {zone.riskLevel === 'ORANGE' && <AlertTriangle className="w-4 h-4" />}
                        {zone.riskLevel === 'YELLOW' && <Info className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-900">
                                {incident.id}
                            </span>
                            <span
                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${RISK_COLORS[zone.riskLevel].badge}`}
                            >
                                {zone.riskLevel === 'RED' && '🔴 CRITICAL'}
                                {zone.riskLevel === 'ORANGE' && '🟠 HIGH RISK'}
                                {zone.riskLevel === 'YELLOW' && '🟡 MODERATE'}
                            </span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-600">
                            {getRiskLevelTitle(zone.riskLevel)}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-sky-50 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Close zone info panel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-3.5 space-y-3 flex-1 overflow-y-auto text-xs text-slate-700">
                {/* Zone Classification Badge */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50/70 border border-sky-400/30">
                    <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                        <span className="text-[11px] font-mono font-semibold text-slate-900">
                            {zone.label}
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-sky-700 font-bold">
                        Radius: {zone.radiusMeters}m
                    </span>
                </div>

                {/* Incident Title & Type */}
                <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                        Incident & Classification
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                        {incident.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="bg-sky-50 px-2 py-0.5 rounded text-[10px] font-mono text-sky-800 border border-sky-400/30">
                            Type: {incident.category.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${
                            isVerified
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                        }`}>
                            {isVerified ? 'VERIFIED' : 'AWAITING VERIFICATION'}
                        </span>
                    </div>
                </div>

                {/* Location & Accuracy */}
                <div className="p-2.5 rounded-lg bg-white border border-sky-400/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-500 font-bold">
                            <MapPin className="w-3 h-3 text-sky-500" /> Location
                        </span>
                        <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${locAccuracy.badgeClass}`}
                            title={locAccuracy.tooltip}
                        >
                            {locAccuracy.text}
                        </span>
                    </div>
                    <div className="text-slate-800 text-xs font-semibold">
                        {incident.locationDescription}
                    </div>
                    {(incident.country || incident.city) && (
                        <div className="text-[11px] font-mono text-sky-700 flex items-center justify-between font-medium">
                            <span>🌍 {[incident.city, incident.state, incident.country].filter(Boolean).join(', ')}</span>
                            {incident.timeZone && <span className="text-slate-500 text-[10px]">({incident.timeZone})</span>}
                        </div>
                    )}
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                        <Compass className="w-3 h-3 text-slate-400" />
                        <span>GPS: {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}</span>
                    </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-white border border-sky-400/30 shadow-sm">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-bold">
                            <FileText className="w-3 h-3 text-sky-500" /> Linked Reports
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                            {incident.childReportIds.length} <span className="text-[10px] font-normal text-slate-500">sources</span>
                        </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-sky-400/30 shadow-sm">
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 font-bold">
                            <Users className="w-3 h-3 text-purple-500" /> Affected Persons
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                            {incident.affectedPeople ?? (incident.victimEstCount || 'None reported')}
                        </div>
                    </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-1 p-2 rounded-lg bg-white border border-sky-400/30 font-mono text-[10px] text-slate-600 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> First Reported:
                        </span>
                        <span className="text-slate-800 font-semibold">
                            {incident.firstReportedAt
                                ? new Date(incident.firstReportedAt).toLocaleTimeString()
                                : new Date(incident.createdTime).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> Latest Update:
                        </span>
                        <span className="text-slate-800 font-semibold">
                            {incident.lastUpdatedAt
                                ? new Date(incident.lastUpdatedAt).toLocaleTimeString()
                                : new Date(incident.lastUpdatedTime).toLocaleTimeString()}
                        </span>
                    </div>
                </div>

                {/* Assigned Response Teams */}
                <div className="p-2.5 rounded-lg bg-white border border-sky-400/30 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-slate-500 font-bold">
                            <Truck className="w-3 h-3 text-amber-500" /> Assigned Units
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                            {assignedUnits.length} assigned
                        </span>
                    </div>
                    {assignedUnits.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {assignedUnits.map(unit => (
                                <span
                                    key={unit.id}
                                    className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-400/30 rounded text-[10px] font-mono font-medium"
                                >
                                    {unit.callSign} ({unit.status})
                                </span>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[11px] text-slate-400 italic">No response units currently assigned</div>
                    )}
                </div>

                {/* Operator Notes */}
                {incident.notes && incident.notes.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-sky-50/50 border border-sky-400/30 space-y-1 shadow-sm">
                        <div className="text-[10px] font-mono uppercase text-sky-800 font-bold">
                            Latest Operator Note
                        </div>
                        <div className="text-[11px] text-slate-700 italic">
                            "{incident.notes[incident.notes.length - 1].text}"
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">
                            by {incident.notes[incident.notes.length - 1].authorId} •{' '}
                            {new Date(incident.notes[incident.notes.length - 1].timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                )}

                {/* Safety & Decision Support Notice */}
                <div className="p-2 rounded bg-amber-50 border border-amber-300 text-[10px] text-amber-900 leading-tight font-sans">
                    <strong>Decision-Support Notice:</strong> Circular zones represent estimated spatial impact areas. Emergency dispatch requires authorized operator verification.
                </div>

                {/* Interactive Dynamic Controls (Change Severity / Radius / Resolve) */}
                <div className="p-2.5 rounded-lg bg-white border border-sky-400/30 space-y-2 shadow-sm">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                        <span>Dynamic Risk Tuning</span>
                        <span className="text-[9px] text-sky-600 font-semibold">Test Live Updates</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        <button
                            type="button"
                            onClick={() => handleSeverityChange('CRITICAL')}
                            className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold transition-all border ${
                                incident.severity === 'CRITICAL'
                                    ? 'bg-red-500 text-white border-red-400 shadow-md ring-2 ring-red-300'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                        >
                            🔴 Red Zone
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSeverityChange('HIGH')}
                            className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold transition-all border ${
                                incident.severity === 'HIGH'
                                    ? 'bg-amber-500 text-white border-amber-400 shadow-md ring-2 ring-amber-300'
                                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            }`}
                        >
                            🟠 Orange Zone
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSeverityChange('MEDIUM')}
                            className={`py-1 px-1.5 rounded text-[10px] font-mono font-bold transition-all border ${
                                incident.severity === 'MEDIUM' || incident.severity === 'LOW'
                                    ? 'bg-yellow-400 text-slate-900 border-yellow-300 shadow-md ring-2 ring-yellow-200'
                                    : 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
                            }`}
                        >
                            🟡 Yellow Zone
                        </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                        {!isVerified && (
                            <button
                                type="button"
                                onClick={handleQuickVerify}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold rounded flex items-center justify-center gap-1 transition-colors shadow-sm"
                            >
                                <Check className="w-3 h-3" /> Verify
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleQuickResolve}
                            className="flex-1 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 font-mono text-[10px] font-bold rounded flex items-center justify-center gap-1 border border-sky-400/30 transition-colors shadow-sm"
                        >
                            <CheckCircle2 className="w-3 h-3 text-sky-600" /> Resolve & Clear Zone
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3 bg-white border-t border-sky-400/20 flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        onOpenFullDetails(incident);
                    }}
                    className="flex-1 py-2 px-3 bg-sky-500 hover:bg-sky-600 text-white font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-sky-500/20 border border-sky-400/30"
                >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Full Incident Details
                </button>
            </div>
        </div>
    );
};

