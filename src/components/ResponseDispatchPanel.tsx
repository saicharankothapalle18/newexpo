import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UnitStatus, UnitType } from '../types';
import {
    Users,
    Flame,
    Cross,
    Shield,
    AlertOctagon,
    Truck,
    MapPin,
    Navigation,
    Radio,
    CheckCircle
} from 'lucide-react';

export const ResponseDispatchPanel: React.FC = () => {
    const { units, incidents, updateUnitStatus } = useEmergency();
    const [filterType, setFilterType] = useState<string>('ALL');

    const filteredUnits = units.filter(u => {
        if (filterType !== 'ALL' && u.unitType !== filterType) return false;
        return true;
    });

    const getUnitTypeIcon = (type: UnitType) => {
        switch (type) {
            case 'FIRE':
                return <Flame className="w-4 h-4 text-orange-500" />;
            case 'MEDICAL':
                return <Cross className="w-4 h-4 text-pink-500" />;
            case 'HAZMAT':
                return <AlertOctagon className="w-4 h-4 text-purple-600" />;
            case 'POLICE':
                return <Shield className="w-4 h-4 text-blue-600" />;
            default:
                return <Truck className="w-4 h-4 text-sky-600" />;
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Header & Filter Controls */}
            <div className="glass-panel p-4 rounded-xl border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100/80 border border-sky-400/30 rounded-xl text-sky-700 shadow-sm">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Emergency Response Coordination Roster</h2>
                        <p className="text-xs text-slate-500">Multi-agency tactical units, status tracking, and dispatch matrix</p>
                    </div>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 text-xs">
                    {['ALL', 'FIRE', 'MEDICAL', 'HAZMAT', 'POLICE'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                filterType === type
                                    ? 'bg-sky-100 text-sky-800 border border-sky-400/30 font-bold shadow-sm'
                                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map(unit => {
                    const assignedIncident = incidents.find(i => i.id === unit.assignedIncidentId);

                    return (
                        <div key={unit.id} className="glass-panel p-4 rounded-xl border border-sky-400/30 space-y-3 bg-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-sky-50 border border-sky-200">
                                        {getUnitTypeIcon(unit.unitType)}
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900">{unit.callSign}</h3>
                                        <div className="text-[10px] text-slate-500 font-mono">{unit.id} • {unit.unitType}</div>
                                    </div>
                                </div>

                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    unit.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                    unit.status === 'EN_ROUTE' ? 'bg-amber-50 text-amber-700 border border-amber-300 animate-pulse' :
                                    unit.status === 'ON_SCENE' ? 'bg-purple-50 text-purple-700 border border-purple-300' :
                                    'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}>
                                    {unit.status}
                                </span>
                            </div>

                            {/* Personnel & Location */}
                            <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded-lg bg-sky-50/40 border border-sky-400/20">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Users className="w-3.5 h-3.5 text-sky-600" />
                                    <span>Personnel: <strong className="text-slate-900">{unit.personnelCount}</strong></span>
                                </div>
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Navigation className="w-3.5 h-3.5 text-sky-600" />
                                    <span>ETA: <strong className="text-slate-900">{unit.etaMinutes ?? 0} mins</strong></span>
                                </div>
                            </div>

                            {/* Assignment details */}
                            {assignedIncident ? (
                                <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200 text-xs space-y-1">
                                    <div className="text-[10px] text-sky-800 font-semibold uppercase tracking-wider">Assigned Task:</div>
                                    <div className="font-semibold text-slate-900">{assignedIncident.title}</div>
                                    <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-sky-600" /> {assignedIncident.locationDescription}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-500 italic text-center border border-slate-200">
                                    Unassigned • Ready for Dispatch
                                </div>
                            )}

                            {/* Status Update Quick Toggle Buttons */}
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1">
                                {(['AVAILABLE', 'EN_ROUTE', 'ON_SCENE', 'OFFLINE'] as UnitStatus[]).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => updateUnitStatus(unit.id, st)}
                                        className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors border ${
                                            unit.status === st
                                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                                : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-800 border-slate-200'
                                        }`}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
