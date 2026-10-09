import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UnifiedIncident, IncidentStatus, SeverityLevel } from '../types';
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    Clock,
    MapPin,
    Users,
    Link2,
    Eye,
    Plus,
    Search,
    Check,
    Filter
} from 'lucide-react';
import {
    computeIncidentRiskZone,
    getLocationAccuracyLabel,
    RISK_COLORS,
    isIncidentZoneActive
} from '../utils/riskZone';

interface UnifiedIncidentListProps {
    onSelectIncident: (incident: UnifiedIncident) => void;
}

export const UnifiedIncidentList: React.FC<UnifiedIncidentListProps> = ({ onSelectIncident }) => {
    const {
        incidents,
        reports,
        getCandidateLinksForReport,
        verifyIncident,
        resolveIncident,
        dashboardFilter,
        setDashboardFilter
    } = useEmergency();

    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const filteredIncidents = incidents.filter(inc => {
        // Dashboard filter integration
        if (dashboardFilter === 'CRITICAL_INCIDENTS' && inc.severity !== 'CRITICAL') return false;
        if (dashboardFilter === 'AWAITING_VERIFICATION' && (inc.verifiedBy || inc.status === 'RESOLVED')) return false;
        if (dashboardFilter === 'RESPONSE_REQUIRED' && (inc.status === 'RESOLVED' || inc.assignedUnitIds.length > 0)) return false;
        if (dashboardFilter === 'RESOLVED' && (inc.status !== 'RESOLVED' && inc.status !== 'CLOSED')) return false;
        if (dashboardFilter === 'ACTIVE_INCIDENTS' && (inc.status === 'RESOLVED' || inc.status === 'CLOSED')) return false;

        // Local category filter
        if (filterCategory !== 'ALL' && inc.category !== filterCategory) return false;

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                inc.id.toLowerCase().includes(q) ||
                inc.title.toLowerCase().includes(q) ||
                inc.locationDescription.toLowerCase().includes(q) ||
                inc.summary.toLowerCase().includes(q)
            );
        }
        return true;
    });

    return (
        <div className="space-y-3 select-none">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-sky-400/25">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-700">
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            Active Incident Register
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-mono font-bold border border-sky-400/30">
                                {filteredIncidents.length}
                            </span>
                        </h2>
                    </div>
                </div>

                {/* Filter selectors & search */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                        <input
                            type="text"
                            placeholder="Search incidents by ID, title, location..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-8 pr-2.5 py-1 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30"
                        />
                    </div>

                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                    >
                        <option value="ALL">All Categories</option>
                        <option value="TRAFFIC_ACCIDENT">Traffic Accident</option>
                        <option value="STRUCTURE_FIRE">Structure Fire</option>
                        <option value="HAZMAT_CHEMICAL">Hazmat Chemical</option>
                        <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                        <option value="POWER_GRID_OUTAGE">Power Grid Outage</option>
                    </select>
                </div>
            </div>

            {/* Incidents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredIncidents.length === 0 ? (
                    <div className="col-span-2 p-10 text-center rounded-2xl bg-white border border-sky-400/30 space-y-3 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-sm">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800">No incidents recorded</h4>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                No emergency incidents are currently open. Triage incoming reports or import a dataset to coordinate incidents.
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredIncidents.map(inc => {
                        // Count candidate duplicate matches
                        const candidateMatchesCount = reports.filter(r => {
                            if (r.assignedIncidentId || r.acknowledgedSeparate) return false;
                            const links = getCandidateLinksForReport(r);
                            return links.some(l => l.targetIncidentId === inc.id);
                        }).length;

                        const zone = computeIncidentRiskZone(inc);
                        const accuracy = getLocationAccuracyLabel(inc.locationAccuracy);
                        const isZoneActive = isIncidentZoneActive(inc);

                        return (
                            <div
                                key={inc.id}
                                className={`glass-panel p-3.5 rounded-xl border transition-all shadow-sm ${
                                    zone.riskLevel === 'RED' && isZoneActive
                                        ? 'border-red-300 bg-red-50/30 hover:border-red-400 hover:shadow-[0_4px_18px_rgba(239,68,68,0.18)]'
                                        : zone.riskLevel === 'ORANGE' && isZoneActive
                                            ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400 hover:shadow-[0_4px_18px_rgba(245,158,11,0.18)]'
                                            : inc.status === 'RESOLVED'
                                                ? 'border-slate-200 bg-slate-50/60 opacity-80'
                                                : 'border-sky-400/30 hover:border-sky-400 hover:shadow-[0_4px_18px_rgba(56,189,248,0.22)]'
                                }`}
                                style={{ borderLeft: isZoneActive ? `4px solid ${zone.color}` : '4px solid #94a3b8' }}
                            >
                                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-400/30">
                                            {inc.id}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono font-medium">
                                            {inc.category.replace('_', ' ')}
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${RISK_COLORS[zone.riskLevel].badge}`}>
                                            {zone.riskLevel === 'RED' && '🔴 CRITICAL'}
                                            {zone.riskLevel === 'ORANGE' && '🟠 HIGH RISK'}
                                            {zone.riskLevel === 'YELLOW' && '🟡 MODERATE'}
                                        </span>
                                        {accuracy.isApproximate && (
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${accuracy.badgeClass}`}>
                                                ⚠️ Approx
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            {new Date(inc.createdTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded font-bold ${inc.status === 'RESOLVED' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                                inc.status === 'UNDER_REVIEW' || !inc.verifiedBy ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                    'bg-sky-50 text-sky-800 border border-sky-400/30'
                                            }`}>
                                            {inc.status}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xs font-bold text-slate-900 mb-1">{inc.title}</h3>
                                <div className="text-[11px] text-slate-600 flex items-center gap-1 mb-1.5">
                                    <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                                    <span className="truncate">{inc.locationDescription}</span>
                                </div>
                                <p className="text-[11px] text-slate-700 line-clamp-2 leading-relaxed mb-2.5">
                                    {inc.summary}
                                </p>

                                {/* Candidate Duplicates Alert Banner */}
                                {candidateMatchesCount > 0 && (
                                    <div className="mb-2 p-1.5 rounded-lg bg-amber-100/70 border border-amber-300 text-xs text-amber-900 flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-[10px]">
                                            <Link2 className="w-3 h-3 text-amber-600 animate-pulse" />
                                            {candidateMatchesCount} candidate duplicate report(s) detected
                                        </span>
                                        <button
                                            onClick={() => onSelectIncident(inc)}
                                            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[9px] shadow-sm"
                                        >
                                            Review
                                        </button>
                                    </div>
                                )}

                                {/* Bottom stats & action */}
                                <div className="flex items-center justify-between text-xs pt-2.5 border-t border-sky-400/20">
                                    <div className="flex items-center gap-2.5 text-[10px] text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-sky-500" />
                                            {inc.childReportIds.length} Linked
                                        </span>
                                        {inc.assignedUnitIds.length > 0 && (
                                            <span className="flex items-center gap-1 text-purple-600">
                                                <Users className="w-3 h-3" />
                                                {inc.assignedUnitIds.length} Units
                                            </span>
                                        )}
                                        {inc.verifiedBy ? (
                                            <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-amber-700 font-semibold">Unverified</span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {!inc.verifiedBy && inc.status !== 'RESOLVED' && (
                                            <button
                                                onClick={() => verifyIncident(inc.id)}
                                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] transition-colors flex items-center gap-1 shadow-sm"
                                                title="Operator Quick Verify"
                                            >
                                                <Check className="w-3 h-3" /> Verify
                                            </button>
                                        )}

                                        <button
                                            onClick={() => onSelectIncident(inc)}
                                            className="px-2.5 py-1 rounded bg-sky-500 hover:bg-sky-600 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-sm border border-sky-400/30"
                                        >
                                            <Eye className="w-3 h-3" /> Inspect Hub
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
