import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { OperatorUser, UserRole } from '../types';
import { DEMO_OPERATORS } from '../mock/initialData';
import {
    ShieldAlert,
    Radio,
    Headphones,
    Users,
    ShieldCheck,
    CheckCircle2,
    Lock,
    Volume2,
    VolumeX,
    Activity,
    Server,
    Wifi
} from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { login, audioEnabled, setAudioEnabled } = useEmergency();

    const [selectedPresetId, setSelectedPresetId] = useState<string>(DEMO_OPERATORS[0].id);
    const [customName, setCustomName] = useState<string>('Marcus Vance');
    const [customBadge, setCustomBadge] = useState<string>('BDG-9821');
    const [customRole, setCustomRole] = useState<UserRole>('OPERATOR');
    const [customConsole, setCustomConsole] = useState<string>('Console #4 - Emergency Intake');
    const [customShift, setCustomShift] = useState<'MORNING' | 'DAY' | 'NIGHT'>('DAY');
    const [useManualInput, setUseManualInput] = useState<boolean>(false);

    const handleSelectPreset = (op: OperatorUser) => {
        setSelectedPresetId(op.id);
        setCustomName(op.name);
        setCustomBadge(op.badgeNumber);
        setCustomRole(op.role);
        setCustomConsole(op.consoleNumber);
        setCustomShift(op.shift);
    };

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (useManualInput) {
            const operator: OperatorUser = {
                id: `OP-${Math.floor(100 + Math.random() * 900)}`,
                name: customName || 'Call Center Operator',
                role: customRole,
                consoleNumber: customConsole || 'Intake Desk #1',
                shift: customShift,
                badgeNumber: customBadge || 'BDG-0001',
                stationName: 'Metro Central 911 Communications'
            };
            login(operator);
        } else {
            const chosen = DEMO_OPERATORS.find(o => o.id === selectedPresetId) || DEMO_OPERATORS[0];
            login(chosen);
        }
    };

    return (
        <div className="min-h-screen w-screen bg-white bg-grid-pattern text-slate-800 flex flex-col justify-between p-4 sm:p-8 select-none">
            {/* Top Security Banner */}
            <header className="flex items-center justify-between max-w-5xl mx-auto w-full pb-6 border-b border-sky-400/30">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-amber-500 rounded-xl shadow-md shadow-red-500/20 ring-1 ring-sky-400/30">
                        <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black tracking-wider text-slate-900 font-mono">
                                EmIntel <span className="text-xs font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-400/30 font-mono">v1.4 Live CAD</span>
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500">Emergency Intelligence & Incident Coordination System</p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <Wifi className="w-3.5 h-3.5" />
                        <span>CAD Mesh: Online</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-600 font-semibold">
                        <Server className="w-3.5 h-3.5" />
                        <span>Telephony: Ready</span>
                    </div>
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs shadow-sm transition-colors ${audioEnabled
                                ? 'bg-sky-50 text-sky-800 border-sky-400/40 font-semibold'
                                : 'bg-white text-slate-500 border-slate-300'
                            }`}
                    >
                        {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                        <span>{audioEnabled ? 'Audio Chimes Active' : 'Muted'}</span>
                    </button>
                </div>
            </header>

            {/* Login Center Box */}
            <main className="max-w-4xl mx-auto w-full my-auto py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Left Info Panel */}
                    <div className="lg:col-span-5 space-y-5">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-100 border border-sky-400/30 text-sky-800 text-xs font-mono font-semibold">
                                <Radio className="w-3 h-3 text-sky-600 animate-ping" />
                                <span>Dispatcher Workstation Terminal</span>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Call-Center Operations Sign-In
                            </h2>
                            <p className="text-xs text-slate-600 leading-relaxed font-sans">
                                Authenticate your station console to manage incoming emergency reports, execute spatiotemporal duplicate triage, review automated candidate matches, and authorize field responder dispatch.
                            </p>
                        </div>

                        {/* System telemetry status pill */}
                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/30 space-y-2.5 text-xs shadow-[0_4px_20px_rgba(56,189,248,0.15)]">
                            <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                                <span>Active Node Health</span>
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> 100% OPERATIONAL
                                </span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>E-911 VoIP Telephony Gateway</span>
                                    <span className="text-emerald-600 font-mono font-semibold">CONNECTED</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>Spatiotemporal Correlation Engine</span>
                                    <span className="text-sky-700 font-mono font-semibold">IDLE / STANDBY</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                    <span>GIS Tactical RTK Mapping</span>
                                    <span className="text-emerald-600 font-mono font-semibold">GLOBAL & REGIONAL</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Login Form & Presets Card */}
                    <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-sky-400/30 shadow-[0_10px_40px_rgba(56,189,248,0.22)] bg-white/95 space-y-5">
                        <div className="flex items-center justify-between border-b border-sky-400/20 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-sky-600" />
                                    Operator Console Credentials
                                </h3>
                                <p className="text-[11px] text-slate-500">Select preconfigured operator station or enter manual badge credentials</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setUseManualInput(!useManualInput)}
                                className="text-xs text-sky-600 hover:text-sky-800 underline font-medium"
                            >
                                {useManualInput ? 'Use Operator Presets' : 'Custom Operator ID'}
                            </button>
                        </div>

                        {!useManualInput ? (
                            /* Quick Presets Selection */
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-slate-700">
                                    Choose Active Duty Operator Profile:
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {DEMO_OPERATORS.map(op => {
                                        const isSelected = selectedPresetId === op.id;
                                        return (
                                            <div
                                                key={op.id}
                                                onClick={() => handleSelectPreset(op)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all shadow-sm ${isSelected
                                                        ? 'bg-sky-400/15 border-sky-400 shadow-md ring-2 ring-sky-400/30'
                                                        : 'bg-white border-sky-400/30 hover:border-sky-400 hover:shadow-[0_2px_12px_rgba(56,189,248,0.20)]'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-mono text-[11px] font-bold text-sky-700">
                                                        {op.badgeNumber}
                                                    </span>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${op.role === 'SUPERVISOR' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                                            op.role === 'ADMIN' ? 'bg-red-100 text-red-800 border border-red-300' :
                                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                        {op.role}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-900 text-xs">{op.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-0.5">{op.consoleNumber}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-1">Shift: {op.shift}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            /* Manual Form */
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Operator Name</label>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={e => setCustomName(e.target.value)}
                                            placeholder="Operator Full Name"
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30 shadow-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Badge / Callsign</label>
                                        <input
                                            type="text"
                                            value={customBadge}
                                            onChange={e => setCustomBadge(e.target.value)}
                                            placeholder="e.g. BDG-9821"
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-400/30 font-mono shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Role Authority</label>
                                        <select
                                            value={customRole}
                                            onChange={e => setCustomRole(e.target.value as UserRole)}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm"
                                        >
                                            <option value="OPERATOR">Call Center Operator</option>
                                            <option value="SUPERVISOR">Watch Supervisor</option>
                                            <option value="RESPONDER">Field Dispatcher</option>
                                            <option value="ADMIN">System Administrator</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[11px] text-slate-600 font-medium">Shift</label>
                                        <select
                                            value={customShift}
                                            onChange={e => setCustomShift(e.target.value as any)}
                                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm"
                                        >
                                            <option value="DAY">Day Shift (06:00 - 18:00)</option>
                                            <option value="MORNING">Morning Shift (00:00 - 08:00)</option>
                                            <option value="NIGHT">Night Shift (18:00 - 06:00)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] text-slate-600 font-medium">Workstation Console</label>
                                    <input
                                        type="text"
                                        value={customConsole}
                                        onChange={e => setCustomConsole(e.target.value)}
                                        placeholder="e.g. Desk #4 - Emergency Intake"
                                        className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 focus:outline-none focus:border-sky-500 shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Sign In Action Button */}
                        <form onSubmit={handleSignIn} className="pt-2">
                            <button
                                type="submit"
                                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 via-blue-600 to-sky-500 hover:from-sky-600 hover:to-blue-700 text-white shadow-xl shadow-sky-500/25 border border-sky-400/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                            >
                                <Headphones className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                                <span>Initialize Operator Session & Enter Dashboard</span>
                            </button>
                        </form>

                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono text-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Authorized Emergency Personnel Only • 256-bit Encrypted CAD Link</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Status Footer */}
            <footer className="max-w-5xl mx-auto w-full pt-4 border-t border-sky-400/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
                <div>Emergency Intelligence & Incident Coordination System • First Working Version</div>
                <div className="font-mono">Demo Mode • External Services Mocked • Ready for Testing</div>
            </footer>
        </div>
    );
};

