import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UnifiedIncident, RawReport, SeverityLevel, RiskLevel } from '../types';
import { InteractiveMap } from './InteractiveMap';
import {
    computeIncidentRiskZone,
    getLocationAccuracyLabel,
    RISK_COLORS,
    isIncidentZoneActive,
    getIncidentSituation,
    SituationLevel
} from '../utils/riskZone';
import {
    MapPin,
    Radio,
    ShieldAlert,
    AlertTriangle,
    Info,
    Compass,
    Search,
    ExternalLink,
    Crosshair,
    Navigation,
    Layers,
    Activity,
    CheckCircle2
} from 'lucide-react';

interface DedicatedMapViewProps {
    onSelectIncident: (incident: UnifiedIncident) => void;
    onSelectReport: (report: RawReport) => void;
}

export const DedicatedMapView: React.FC<DedicatedMapViewProps> = ({
    onSelectIncident,
    onSelectReport
}) => {
    const { incidents, updateIncidentSeverity } = useEmergency();

    // Active Situation Filter: ALL, CRITICAL, HIGH_RISK, NORMAL
    const [situationFilter, setSituationFilter] = useState<SituationLevel | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [focusedIncident, setFocusedIncident] = useState<UnifiedIncident | null>(null);

    const activeIncidents = incidents.filter(isIncidentZoneActive);

    // Compute live situation metrics across active incidents
    const situationCounts = {
        total: activeIncidents.length,
        critical: activeIncidents.filter(i => getIncidentSituation(i).level === 'CRITICAL').length,
        highRisk: activeIncidents.filter(i => getIncidentSituation(i).level === 'HIGH_RISK').length,
        normal: activeIncidents.filter(i => getIncidentSituation(i).level === 'NORMAL').length
    };

    // Filter incidents by situation & search query
    const filteredIncidents = activeIncidents.filter(inc => {
        const sit = getIncidentSituation(inc);
        if (situationFilter !== 'ALL' && sit.level !== situationFilter) {
            return false;
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return (
                inc.id.toLowerCase().includes(query) ||
                inc.title.toLowerCase().includes(query) ||
                (inc.city && inc.city.toLowerCase().includes(query)) ||
                (inc.country && inc.country.toLowerCase().includes(query)) ||
                inc.locationDescription.toLowerCase().includes(query) ||
                inc.category.toLowerCase().includes(query)
            );
        }
        return true;
    });

    const handleQuickSituationChange = (incId: string, newSev: SeverityLevel) => {
        updateIncidentSeverity(incId, newSev);
    };

    const handleFocusIncidentOnMap = (inc: UnifiedIncident) => {
        setFocusedIncident(inc);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] w-full gap-3 select-none">
            {/* Tactical Map Header Bar */}
            <div className="bg-white/95 backdrop-blur border border-sky-400/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_4px_25px_rgba(56,189,248,0.18)]">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-sky-400/20 border border-sky-400/40 text-sky-600 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                        <Compass className="w-5 h-5 animate-spin-slow" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold font-mono text-slate-900 tracking-wider uppercase">
                                Real-Time Tactical Geospatial & Situation Command Center
                            </h2>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Google Maps Free API
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Dual Half-Screen Console (50% Map / 50% Situation Dispatch)</span>
                            <span>•</span>
                            <span>Live Situations: 🔴 Critical / 🟠 High Risk / 🟡 Normal</span>
                            <span>•</span>
                            <span className="text-sky-700 font-medium">Real-Time GPS Synchronization</span>
                        </p>
                    </div>
                </div>

                {/* Live Search Input */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter incidents, location, address..."
                            className="pl-8 pr-3 py-1.5 bg-white border border-sky-400/30 rounded-lg text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30 w-56 sm:w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Main Area: Exact 50% / 50% Half-Screen Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-0">
                {/* LEFT HALF (50% Screen): Real-Time Tactical Google Map Canvas */}
                <div className="h-full rounded-2xl overflow-hidden shadow-xl border border-sky-400/30 relative flex flex-col bg-slate-100">
                    <InteractiveMap
                        onSelectIncident={onSelectIncident}
                        onSelectReport={onSelectReport}
                        fullscreen={false}
                        focusedIncident={focusedIncident}
                    />
                </div>

                {/* RIGHT HALF (50% Screen): Real-Time Situation & Incidence Command Console */}
                <div className="h-full flex flex-col bg-white/95 backdrop-blur border border-sky-400/30 rounded-2xl p-3.5 overflow-hidden shadow-[0_4px_25px_rgba(56,189,248,0.18)]">
                    
                    {/* Console Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-sky-200">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
                                <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="font-mono text-xs font-bold text-slate-900 uppercase">
                                    Real-Time Situation & Incidence Dispatch
                                </h3>
                                <p className="text-[10px] text-slate-500 font-mono">
                                    Live Feed: {filteredIncidents.length} of {activeIncidents.length} Incidents Active
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Activity className="w-3 h-3 text-emerald-600 animate-pulse" />
                            <span>Live CAD Sync Active</span>
                        </div>
                    </div>

                    {/* Situation Filter Cards Row (Critical / High Risk / Normal) */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                        {/* All Situations */}
                        <button
                            type="button"
                            onClick={() => setSituationFilter('ALL')}
                            className={`p-2 rounded-xl border text-left transition-all ${
                                situationFilter === 'ALL'
                                    ? 'bg-sky-500 text-white border-sky-600 shadow-md ring-2 ring-sky-300'
                                    : 'bg-white hover:bg-sky-50/50 text-slate-700 border-slate-200'
                            }`}
                        >
                            <div className="text-[10px] font-mono font-bold uppercase truncate">
                                All Situations
                            </div>
                            <div className="text-base font-extrabold font-mono mt-0.5">
                                {situationCounts.total}
                            </div>
                        </button>

                        {/* Critical Situation (Red) */}
                        <button
                            type="button"
                            onClick={() => setSituationFilter('CRITICAL')}
                            className={`p-2 rounded-xl border text-left transition-all ${
                                situationFilter === 'CRITICAL'
                                    ? 'bg-red-500 text-white border-red-600 shadow-md ring-2 ring-red-300'
                                    : 'bg-red-50/60 hover:bg-red-100/60 text-red-800 border-red-200'
                            }`}
                        >
                            <div className="text-[10px] font-mono font-bold uppercase truncate flex items-center gap-1">
                                <span>🔴 Critical</span>
                            </div>
                            <div className="text-base font-extrabold font-mono mt-0.5 text-red-700 group-hover:text-red-900">
                                {situationCounts.critical}
                            </div>
                        </button>

                        {/* High Risk Situation (Orange) */}
                        <button
                            type="button"
                            onClick={() => setSituationFilter('HIGH_RISK')}
                            className={`p-2 rounded-xl border text-left transition-all ${
                                situationFilter === 'HIGH_RISK'
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                                    : 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-800 border-amber-200'
                            }`}
                        >
                            <div className="text-[10px] font-mono font-bold uppercase truncate flex items-center gap-1">
                                <span>🟠 High Risk</span>
                            </div>
                            <div className="text-base font-extrabold font-mono mt-0.5 text-amber-700">
                                {situationCounts.highRisk}
                            </div>
                        </button>

                        {/* Normal Situation (Yellow) */}
                        <button
                            type="button"
                            onClick={() => setSituationFilter('NORMAL')}
                            className={`p-2 rounded-xl border text-left transition-all ${
                                situationFilter === 'NORMAL'
                                    ? 'bg-yellow-400 text-slate-900 border-yellow-500 shadow-md ring-2 ring-yellow-200'
                                    : 'bg-yellow-50/60 hover:bg-yellow-100/60 text-yellow-800 border-yellow-200'
                            }`}
                        >
                            <div className="text-[10px] font-mono font-bold uppercase truncate flex items-center gap-1">
                                <span>🟡 Normal</span>
                            </div>
                            <div className="text-base font-extrabold font-mono mt-0.5 text-yellow-800">
                                {situationCounts.normal}
                            </div>
                        </button>
                    </div>

                    {/* Real-Time Incidents Feed List */}
                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                        {filteredIncidents.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 text-xs font-mono space-y-1">
                                <Info className="w-6 h-6 mx-auto text-slate-300" />
                                <p>No active incidents match current situation filter or search query.</p>
                            </div>
                        ) : (
                            filteredIncidents.map(inc => {
                                const zone = computeIncidentRiskZone(inc);
                                const situation = getIncidentSituation(inc);
                                const accuracy = getLocationAccuracyLabel(inc.locationAccuracy);
                                const isFocused = focusedIncident?.id === inc.id;

                                return (
                                    <div
                                        key={inc.id}
                                        className={`p-3 rounded-xl border transition-all space-y-2 group shadow-sm ${
                                            isFocused
                                                ? 'bg-sky-50/70 border-sky-400 ring-2 ring-sky-300 shadow-md'
                                                : 'bg-white hover:bg-sky-50/30 border-slate-200 hover:border-sky-300'
                                        }`}
                                        style={{ borderLeft: `5px solid ${situation.colorHex}` }}
                                    >
                                        {/* Header Row: Situation Badge & Incidence ID */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${situation.badgeClass}`}>
                                                    {situation.emoji} {situation.label.toUpperCase()}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-sky-800">
                                                    {inc.id}
                                                </span>
                                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                                    {inc.category.replace('_', ' ')}
                                                </span>
                                            </div>

                                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                                                Zone: {zone.radiusMeters}m
                                            </span>
                                        </div>

                                        {/* Incident Title */}
                                        <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                            {inc.title}
                                        </div>

                                        {/* Location & Coordinates Breakdown */}
                                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                <span className="line-clamp-1">{inc.locationDescription}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                                                <span className="text-sky-700">
                                                    🌍 {[inc.city, inc.state, inc.country].filter(Boolean).join(', ') || 'Andhra Pradesh'}
                                                </span>
                                                <span>
                                                    GPS: <strong>{inc.latitude.toFixed(5)}, {inc.longitude.toFixed(5)}</strong>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Real-time Situation Triage Quick Buttons (Direct Real-time State Tuning) */}
                                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[10px] font-mono">
                                            <span className="text-slate-400 font-semibold">Triage Situation:</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickSituationChange(inc.id, 'CRITICAL')}
                                                    className={`px-2 py-0.5 rounded transition-all border ${
                                                        situation.level === 'CRITICAL'
                                                            ? 'bg-red-500 text-white border-red-500 font-bold shadow-sm'
                                                            : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                                    }`}
                                                    title="Mark Critical Situation (Red Zone)"
                                                >
                                                    🔴 Critical
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickSituationChange(inc.id, 'HIGH')}
                                                    className={`px-2 py-0.5 rounded transition-all border ${
                                                        situation.level === 'HIGH_RISK'
                                                            ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                                                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                                                    }`}
                                                    title="Mark High Risk Situation (Orange Zone)"
                                                >
                                                    🟠 High Risk
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuickSituationChange(inc.id, 'MEDIUM')}
                                                    className={`px-2 py-0.5 rounded transition-all border ${
                                                        situation.level === 'NORMAL'
                                                            ? 'bg-yellow-400 text-slate-900 border-yellow-400 font-bold shadow-sm'
                                                            : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-200'
                                                    }`}
                                                    title="Mark Normal Situation (Yellow Zone)"
                                                >
                                                    🟡 Normal
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons: Focus Map & Open Full Dossier */}
                                        <div className="flex items-center gap-2 pt-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleFocusIncidentOnMap(inc)}
                                                className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <Navigation className="w-3.5 h-3.5 text-sky-600" />
                                                <span>Focus on Google Map</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onSelectIncident(inc)}
                                                className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                                <span>Dossier</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Operational Footer Disclaimer */}
                    <div className="pt-2.5 mt-2 border-t border-sky-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Google Maps Free API • Real-Time CAD Stream</span>
                        <span>Authorized Verification Mandated</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DedicatedMapView;
