import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
    LayoutDashboard,
    Inbox,
    ShieldAlert,
    Map,
    Users,
    Bell,
    BarChart3,
    Settings,
    ShieldCheck,
    Radio,
    Activity,
    Database
} from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { activeTab, setActiveTab, reports, incidents, units, currentUser } = useEmergency();

    const unverifiedReportsCount = reports.filter(r => r.verificationState === 'UNVERIFIED' && !r.isFlaggedMisleading).length;
    const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const assignedUnitsCount = units.filter(u => u.status === 'DISPATCHED' || u.status === 'EN_ROUTE' || u.status === 'ON_SCENE').length;

    const candidateDuplicatesCount = reports.filter(r => {
        if (r.assignedIncidentId || r.isFlaggedMisleading) return false;
        return incidents.some(inc => {
            const dist = Math.sqrt(Math.pow(r.latitude - inc.latitude, 2) + Math.pow(r.longitude - inc.longitude, 2));
            return dist < 0.05 && r.category === inc.category;
        });
    }).length;

    const navItems = [
        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'INCOMING_REPORTS', label: 'Incoming Reports', icon: Inbox, badge: unverifiedReportsCount },
        { id: 'ACTIVE_INCIDENTS', label: 'Active Incidents', icon: ShieldAlert, badge: activeIncidentsCount },
        { id: 'MAP', label: 'Map', icon: Map, badge: null },
        { id: 'RESPONSE_TEAMS', label: 'Response Teams', icon: Users, badge: assignedUnitsCount },
        { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell, badge: candidateDuplicatesCount > 0 ? candidateDuplicatesCount : null },
        { id: 'ANALYTICS', label: 'Reports & Analytics', icon: BarChart3, badge: null },
        { id: 'SETTINGS', label: 'Settings', icon: Settings, badge: null }
    ];

    return (
        <aside className="w-64 bg-white/95 border-r border-sky-400/30 shadow-[0_0_25px_rgba(56,189,248,0.18)] flex flex-col h-screen sticky top-0 z-30 select-none">
            {/* Brand Header */}
            <div className="p-4 border-b border-sky-400/30 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl shadow-lg shadow-sky-500/30 ring-1 ring-sky-300">
                    <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-1.5">
                        <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-mono">EmIntel</h1>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-sky-100 text-sky-700 border border-sky-400/30">1.4</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Emergency Call-Center Hub</p>
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    System Operations
                </div>

                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${isActive
                                    ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                                <span>{item.label}</span>
                            </div>

                            {item.badge !== null && item.badge > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${item.id === 'INCOMING_REPORTS' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                        item.id === 'ACTIVE_INCIDENTS' ? 'bg-red-100 text-red-700 border border-red-300' :
                                            'bg-sky-100 text-sky-700 border border-sky-300'
                                    }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Admin-Only Dataset Management Hub Link */}
                {currentUser?.role === 'ADMIN' && (
                    <div className="pt-2 mt-2 border-t border-sky-300/30">
                        <div className="px-3 py-1 text-[10px] font-bold text-sky-800 uppercase tracking-wider font-mono flex items-center justify-between">
                            <span>Admin Console</span>
                            <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 text-[9px] border border-sky-300 font-bold">ADMIN</span>
                        </div>
                        <button
                            onClick={() => setActiveTab('DATASET_HUB')}
                            className={`w-full mt-1 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                activeTab === 'DATASET_HUB'
                                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 font-bold'
                                    : 'text-slate-700 hover:text-slate-900 hover:bg-sky-50/80'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Database className={`w-4 h-4 ${activeTab === 'DATASET_HUB' ? 'text-white' : 'text-sky-600'}`} />
                                <span>Dataset Management</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                activeTab === 'DATASET_HUB' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-800 border border-sky-300'
                            }`}>
                                HUB
                            </span>
                        </button>
                    </div>
                )}
            </nav>

            {/* Footer System Status Card */}
            <div className="p-3 m-3 rounded-xl bg-sky-50/70 border border-sky-400/30 text-xs space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        Ingestion Stream
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold">ACTIVE</span>
                </div>
                <div className="w-full bg-sky-200/60 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-full animate-pulse"></div>
                </div>
                <p className="text-[10px] text-slate-500">Zero Social API Key Required • Mock Mode</p>
            </div>
        </aside>
    );
};
