import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { AuditActionType } from '../types';
import { FileText, Download, Filter, Search, ShieldCheck, Clock, User, Info } from 'lucide-react';

export const AuditHistoryView: React.FC = () => {
    const { auditLogs } = useEmergency();
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterAction, setFilterAction] = useState<string>('ALL');

    const filteredLogs = auditLogs.filter(log => {
        if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return (
                log.summary.toLowerCase().includes(q) ||
                log.userName.toLowerCase().includes(q) ||
                (log.incidentId && log.incidentId.toLowerCase().includes(q)) ||
                (log.reportId && log.reportId.toLowerCase().includes(q))
            );
        }
        return true;
    });

    const exportCSV = () => {
        const headers = ['ID', 'Timestamp', 'User Name', 'Role', 'Action Type', 'Incident ID', 'Report ID', 'Summary'];
        const rows = filteredLogs.map(l => [
            l.id,
            l.timestamp,
            `"${l.userName}"`,
            l.userRole,
            l.actionType,
            l.incidentId || '',
            l.reportId || '',
            `"${l.summary.replace(/"/g, '""')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `EmIntel_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-4">
            {/* Top Header & Export Controls */}
            <div className="glass-panel p-4 rounded-xl border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-sky-100/80 border border-sky-400/30 rounded-xl text-sky-700 shadow-sm">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Immutable Public Safety Audit Trail</h2>
                        <p className="text-xs text-slate-500">Cryptographically verifiable log of all operator verifications, automated merges, dispatches, and overrides</p>
                    </div>
                </div>

                <button
                    onClick={exportCSV}
                    className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/25"
                >
                    <Download className="w-4 h-4" /> Export CSV Audit Record
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass-panel p-3 rounded-xl border border-sky-400/30 flex flex-col sm:flex-row items-center gap-3 bg-white shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                        type="text"
                        placeholder="Search audit trail by keyword, User ID, Incident ID, or Report ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                    />
                </div>

                <select
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 w-full sm:w-auto shadow-sm"
                >
                    <option value="ALL">All Action Types</option>
                    <option value="REPORT_INGESTED">Report Ingested</option>
                    <option value="HUMAN_VERIFIED">Human Verified</option>
                    <option value="REPORTS_MERGED">Reports Merged</option>
                    <option value="UNIT_DISPATCHED">Unit Dispatched</option>
                    <option value="REPORT_FLAGGED_MISLEADING">Report Flagged</option>
                    <option value="SYSTEM_CONFIG_UPDATED">Config Updated</option>
                    <option value="DATASET_CLEANUP">Dataset Cleanup</option>
                </select>
            </div>

            {/* Audit Log Table */}
            <div className="glass-panel rounded-xl border border-sky-400/30 overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-sky-50/70 text-slate-600 font-mono text-[11px] uppercase tracking-wider border-b border-sky-400/20">
                            <tr>
                                <th className="p-3">Timestamp</th>
                                <th className="p-3">User / Identity</th>
                                <th className="p-3">Action Type</th>
                                <th className="p-3">Associated Target</th>
                                <th className="p-3">Summary Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100 font-sans">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-slate-500 text-xs">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-slate-700">No audit trail records recorded yet</p>
                                            <p className="text-[11px] text-slate-400">Operator intakes, verifications, duplicate merges, and dispatches will be permanently logged here.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-sky-50/50 transition-colors">
                                        <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-sky-600" />
                                                <span className="font-semibold text-slate-900">{log.userName}</span>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                                                    {log.userRole}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                                log.actionType === 'HUMAN_VERIFIED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                                log.actionType === 'REPORTS_MERGED' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                                                log.actionType === 'UNIT_DISPATCHED' ? 'bg-purple-50 text-purple-700 border border-purple-300' :
                                                log.actionType === 'REPORT_FLAGGED_MISLEADING' ? 'bg-red-50 text-red-700 border border-red-300' :
                                                log.actionType === 'DATASET_CLEANUP' ? 'bg-rose-50 text-rose-700 border border-rose-300' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {log.actionType}
                                            </span>
                                        </td>
                                        <td className="p-3 font-mono text-sky-700 font-bold whitespace-nowrap">
                                            {log.incidentId || log.reportId || log.unitId || '—'}
                                        </td>
                                        <td className="p-3 text-slate-700">
                                            {log.summary}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
