import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { UserRole } from '../types';
import {
    ShieldAlert,
    Radio,
    Activity,
    Users,
    PlusCircle,
    Play,
    Pause,
    Clock,
    Volume2,
    VolumeX,
    Keyboard,
    LogOut,
    LayoutDashboard,
    Inbox,
    ShieldCheck,
    Map
} from 'lucide-react';

interface HeaderProps {
    onOpenNewReportModal: () => void;
    onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    onOpenNewReportModal,
    onOpenShortcutsModal
}) => {
    const {
        currentUser,
        logout,
        currentRole,
        setCurrentRole,
        activeTab,
        setActiveTab,
        reports,
        incidents,
        units,
        audioEnabled,
        setAudioEnabled,
        isSimulatingIngestion,
        setIsSimulatingIngestion
    } = useEmergency();

    const [timeStr, setTimeStr] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    const unverifiedCount = reports.filter(r => r.verificationState === 'UNVERIFIED' && !r.isFlaggedMisleading).length;
    const criticalIncidentCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED' && i.status !== 'CLOSED').length;
    const availableUnitsCount = units.filter(u => u.status === 'AVAILABLE').length;

    return (
        <header className="bg-white/95 border-b border-sky-400/30 sticky top-0 z-40 backdrop-blur-md px-4 py-2.5 select-none shadow-[0_4px_25px_rgba(56,189,248,0.15)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Left Brand Title */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg shadow-lg shadow-sky-500/30 ring-1 ring-sky-300">
                        <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-bold tracking-tight text-slate-900 font-mono">
                                EmIntel <span className="text-[10px] font-normal text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-400/30 font-mono">Live CAD</span>
                            </h1>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                                CAD DISPATCH ONLINE
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">Emergency Intelligence & Incident Coordination System</p>
                    </div>
                </div>

                {/* Middle Quick Metrics Bar */}
                <div className="hidden md:flex items-center gap-3 bg-sky-50/70 px-3 py-1.5 rounded-lg border border-sky-400/30 text-xs shadow-sm">
                    <div className="flex items-center gap-1.5 text-amber-600">
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Intake: <strong className="font-mono text-slate-900 text-xs">{unverifiedCount}</strong></span>
                    </div>
                    <div className="h-3.5 w-px bg-sky-200"></div>
                    <div className="flex items-center gap-1.5 text-red-600">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Critical: <strong className="font-mono text-slate-900 text-xs">{criticalIncidentCount}</strong></span>
                    </div>
                    <div className="h-3.5 w-px bg-sky-200"></div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                        <Users className="w-3.5 h-3.5" />
                        <span>Units Ready: <strong className="font-mono text-slate-900 text-xs">{availableUnitsCount}</strong></span>
                    </div>
                    <div className="h-3.5 w-px bg-sky-200"></div>
                    <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{timeStr || '12:00:00'}</span>
                    </div>
                </div>

                {/* Right Operator Profile & Utility Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Audio Chime Mute Toggle */}
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors shadow-sm ${audioEnabled
                                ? 'bg-sky-50 text-sky-700 border-sky-400/40 hover:bg-sky-100'
                                : 'bg-white text-slate-400 border-sky-200 hover:text-slate-600'
                            }`}
                        title={audioEnabled ? 'Audio chimes enabled (Press M to mute)' : 'Muted (Press M to enable)'}
                    >
                        {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    {/* Keyboard Shortcuts Trigger */}
                    <button
                        onClick={onOpenShortcutsModal}
                        className="p-1.5 rounded-lg bg-white hover:bg-sky-50 text-slate-700 border border-sky-400/30 text-xs transition-colors shadow-sm"
                        title="Keyboard Shortcuts Cheat Sheet (Press ?)"
                    >
                        <Keyboard className="w-4 h-4 text-sky-600" />
                    </button>

                    {/* Live Stream Simulator Toggle */}
                    <button
                        onClick={() => setIsSimulatingIngestion(!isSimulatingIngestion)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-sm ${isSimulatingIngestion
                                ? 'bg-amber-50 text-amber-800 border-amber-400/50 hover:bg-amber-100'
                                : 'bg-white text-slate-600 border-sky-400/30 hover:bg-sky-50'
                            }`}
                        title="Simulate random incoming 911 reports"
                    >
                        {isSimulatingIngestion ? (
                            <>
                                <Pause className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Pause Feed</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="hidden sm:inline">Simulate Feed</span>
                            </>
                        )}
                    </button>

                    {/* Quick Manual Intake Button */}
                    <button
                        onClick={onOpenNewReportModal}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/25 border border-sky-300 transition-all"
                        title="Log manual 911 telephone call intake (Press N)"
                    >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Log 911 Call</span>
                    </button>

                    {/* Operator Profile Badge & Logout */}
                    {currentUser && (
                        <div className="flex items-center gap-2 bg-sky-50/80 px-2.5 py-1 rounded-lg border border-sky-400/30 text-xs shadow-sm">
                            <div className="space-y-0.5">
                                <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                                    <span>{currentUser.name}</span>
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-sky-100 text-sky-700 border border-sky-400/30 font-mono">
                                        {currentUser.role}
                                    </span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-mono">{currentUser.consoleNumber}</div>
                            </div>

                            <button
                                onClick={logout}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
                                title="Sign out / Switch Operator Console"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <nav className="flex items-center gap-1 mt-2 border-t border-sky-300/30 pt-1.5 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'DASHBOARD'
                            ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                        }`}
                >
                    <LayoutDashboard className="w-3.5 h-3.5 text-sky-600" />
                    <span>Call Center Command Hub</span>
                </button>

                <button
                    onClick={() => setActiveTab('INCOMING_REPORTS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'INCOMING_REPORTS'
                            ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                        }`}
                >
                    <Inbox className="w-3.5 h-3.5 text-amber-600" />
                    <span>Incoming Intake ({unverifiedCount})</span>
                </button>

                <button
                    onClick={() => setActiveTab('ACTIVE_INCIDENTS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'ACTIVE_INCIDENTS'
                            ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                        }`}
                >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Incident Register ({incidents.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('MAP')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'MAP'
                            ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                        }`}
                >
                    <Map className="w-3.5 h-3.5 text-sky-600" />
                    <span>Tactical GIS Map</span>
                </button>

                <button
                    onClick={() => setActiveTab('RESPONSE_TEAMS')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'RESPONSE_TEAMS'
                            ? 'bg-sky-400/20 text-sky-950 border border-sky-400/40 shadow-sm font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-sky-50/80'
                        }`}
                >
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>Response Coordination</span>
                </button>
            </nav>
        </header>
    );
};
