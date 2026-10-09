import React from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { Bell, ShieldAlert, Link2, CheckCircle2, Clock, Info } from 'lucide-react';

export const NotificationsView: React.FC = () => {
    const { auditLogs, incidents, reports } = useEmergency();

    // Create notifications stream from audit logs & candidate link events
    const notificationItems = auditLogs.map(log => ({
        id: log.id,
        timestamp: log.timestamp,
        title: log.actionType.replace(/_/g, ' '),
        message: log.summary,
        type: log.actionType,
        severity: log.actionType === 'REPORT_FLAGGED_MISLEADING' ? 'HIGH' :
            log.actionType === 'REPORTS_MERGED' ? 'MEDIUM' : 'INFO'
    }));

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-xl border border-sky-400/30 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100/80 border border-sky-400/30 rounded-xl text-sky-700 shadow-sm">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Call Center Operational Alerts & Notifications</h2>
                        <p className="text-xs text-slate-500">Real-time alerts for duplicate report candidate detection, critical crises, and verification actions</p>
                    </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-mono text-xs font-bold border border-sky-400/30 shadow-sm">
                    {notificationItems.length} Alerts
                </span>
            </div>

            <div className="space-y-2.5">
                {notificationItems.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-white border border-sky-400/30 space-y-2 shadow-sm">
                        <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                        <h4 className="text-sm font-bold text-slate-800">No alerts or notifications recorded yet</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Operational alerts, duplicate merges, and priority crises will appear here in real time.
                        </p>
                    </div>
                ) : (
                    notificationItems.map(item => (
                        <div key={item.id} className="glass-panel p-3.5 rounded-xl border border-sky-400/30 flex items-start gap-3 bg-white shadow-sm hover:border-sky-400 hover:shadow-md transition-all">
                            <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 shrink-0 mt-0.5">
                                {item.type === 'REPORTS_MERGED' ? <Link2 className="w-4 h-4 text-amber-600" /> :
                                    item.type === 'HUMAN_VERIFIED' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                                        <ShieldAlert className="w-4 h-4 text-sky-600" />}
                            </div>

                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">{item.title}</span>
                                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(item.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 font-sans">{item.message}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
