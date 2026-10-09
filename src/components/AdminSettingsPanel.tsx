import React, { useState, useEffect, useCallback } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
    Sliders,
    Save,
    AlertTriangle,
    ShieldCheck,
    Mic,
    Database,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    HardDrive,
    FileSpreadsheet,
    FileJson,
    Music,
    FileText,
    Check,
    Info,
    Lock
} from 'lucide-react';
import { AdminMp3UploadPanel } from './AdminMp3UploadPanel';

interface DatasetFileInfo {
    fileName: string;
    subfolder: string;
    format: string;
    fileSizeBytes: number;
    savedPath: string;
    modifiedAt: string;
}

interface DatasetCounts {
    excel: number;
    json: number;
    audio: number;
    csv: number;
    totalBytes: number;
}

interface CleanupResult {
    success: boolean;
    deletedCount: number;
    failedCount: number;
    totalBytesFreed: number;
    deletedFiles: Array<{ fileName: string; format: string; subfolder: string; bytesFreed: number; path: string }>;
    failedFiles: Array<{ fileName: string; error: string; path: string }>;
    remainingFiles: Record<string, number>;
    timestamp: string;
    executedBy: string;
}

export const AdminSettingsPanel: React.FC = () => {
    const { config, updateConfig, currentUser, addAuditLog, purgeDatasetRecords } = useEmergency();
    const [formConfig, setFormConfig] = useState(config);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState<'CONFIG' | 'AUDIO' | 'DATABASE'>('DATABASE');

    // Database / Dataset Management State
    const [serverFiles, setServerFiles] = useState<DatasetFileInfo[]>([]);
    const [counts, setCounts] = useState<DatasetCounts>({ excel: 0, json: 0, audio: 0, csv: 0, totalBytes: 0 });
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    // Cleanup Form & Modal State
    const [targetFormats, setTargetFormats] = useState<{ excel: boolean; json: boolean; audio: boolean; csv: boolean }>({
        excel: true,
        json: true,
        audio: true,
        csv: false
    });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);

    const isAdmin = currentUser?.role === 'ADMIN';

    // Fetch server dataset inventory
    const fetchDatasetFiles = useCallback(async () => {
        if (!isAdmin) return;
        setIsLoadingFiles(true);
        setFileError(null);
        try {
            const res = await fetch('/api/dataset/files', {
                headers: {
                    'x-user-role': 'ADMIN'
                }
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to query server files');
            }
            const data = await res.json();
            setServerFiles(data.files || []);
            if (data.counts) {
                setCounts(data.counts);
            }
        } catch (err: any) {
            setFileError(err.message || 'Failed to inspect server storage');
        } finally {
            setIsLoadingFiles(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        if (activeSection === 'DATABASE') {
            fetchDatasetFiles();
        }
    }, [activeSection, fetchDatasetFiles]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateConfig(formConfig);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    // Calculate files matching selected cleanup formats
    const matchingFilesForCleanup = serverFiles.filter(f => {
        if (targetFormats.excel && (f.format === 'EXCEL' || f.fileName.endsWith('.xlsx') || f.fileName.endsWith('.xls'))) return true;
        if (targetFormats.json && (f.format === 'JSON' || f.fileName.endsWith('.json'))) return true;
        if (targetFormats.audio && (f.format === 'AUDIO' || f.fileName.endsWith('.mp3') || f.fileName.endsWith('.wav') || f.fileName.endsWith('.m4a'))) return true;
        if (targetFormats.csv && (f.format === 'CSV' || f.fileName.endsWith('.csv'))) return true;
        return false;
    });

    // Execute server-side cleanup operation
    const handleExecuteCleanup = async () => {
        setIsCleaning(true);
        setFileError(null);
        try {
            const formatsToSend: string[] = [];
            if (targetFormats.excel) formatsToSend.push('EXCEL');
            if (targetFormats.json) formatsToSend.push('JSON');
            if (targetFormats.audio) formatsToSend.push('AUDIO');
            if (targetFormats.csv) formatsToSend.push('CSV');

            const res = await fetch('/api/dataset/cleanup', {
                method: 'POST',
                headers: {
                    'x-user-role': 'ADMIN',
                    'x-admin-id': currentUser?.id || 'ADM-01',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ formats: formatsToSend })
            });

            const data: CleanupResult = await res.json();
            if (!res.ok) {
                throw new Error((data as any).error || 'Dataset cleanup failed');
            }

            setCleanupResult(data);
            setIsConfirmModalOpen(false);

            // Purge associated CAD records in memory
            const deletedNames = (data.deletedFiles || []).map(f => f.fileName);
            const purgedStats = purgeDatasetRecords(deletedNames);

            // Record in audit log
            addAuditLog(
                'DATASET_CLEANUP',
                `Dataset Cleanup Executed: Purged ${data.deletedCount} files (${(data.totalBytesFreed / 1024).toFixed(1)} KB) and ${purgedStats.purgedReports} CAD reports by ${currentUser?.name || 'Administrator'}.`,
                undefined,
                undefined,
                undefined,
                {
                    deletedFiles: data.deletedFiles,
                    failedFiles: data.failedFiles,
                    bytesFreed: data.totalBytesFreed,
                    purgedReportsCount: purgedStats.purgedReports,
                    purgedIncidentsCount: purgedStats.purgedIncidents,
                    administrator: currentUser?.name,
                    adminId: currentUser?.id,
                    timestamp: data.timestamp
                }
            );

            // Refresh file list from server
            await fetchDatasetFiles();
        } catch (err: any) {
            setFileError(err.message || 'Cleanup operation failed');
        } finally {
            setIsCleaning(false);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Navigation Tabs for Admin Suite */}
            <div className="flex items-center gap-2 border-b border-sky-400/30 pb-2 text-xs">
                <button
                    onClick={() => setActiveSection('DATABASE')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                        activeSection === 'DATABASE'
                            ? 'bg-sky-500/20 text-sky-900 border border-sky-400/40 shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-sky-50 border border-transparent'
                    }`}
                >
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Database & Dataset Management</span>
                </button>

                <button
                    onClick={() => setActiveSection('CONFIG')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                        activeSection === 'CONFIG'
                            ? 'bg-sky-500/20 text-sky-900 border border-sky-400/40 shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-sky-50 border border-transparent'
                    }`}
                >
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span>Engine Weights & Boundaries</span>
                </button>

                <button
                    onClick={() => setActiveSection('AUDIO')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-all ${
                        activeSection === 'AUDIO'
                            ? 'bg-sky-500/20 text-sky-900 border border-sky-400/40 shadow-sm'
                            : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-sky-50 border border-transparent'
                    }`}
                >
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span>Admin MP3 Audio Ingestion</span>
                </button>
            </div>

            {/* Section 1: MP3 Audio Upload Console */}
            {activeSection === 'AUDIO' && (
                <div className="space-y-4">
                    <AdminMp3UploadPanel />
                </div>
            )}

            {/* Section 2: Enhanced Database & Dataset Management */}
            {activeSection === 'DATABASE' && (
                <div className="space-y-5">
                    {/* Security Notice */}
                    <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-400/30 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-sky-900">
                            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                            <span>
                                Storage & Database Management Console &mdash; Active Administrator:{' '}
                                <strong>{currentUser?.name || 'Administrator'}</strong> ({currentUser?.badgeNumber || 'BDG-0012'})
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] border border-emerald-300">
                            ROLE: {currentUser?.role}
                        </span>
                    </div>

                    {fileError && (
                        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{fileError}</span>
                        </div>
                    )}

                    {/* Cleanup Results Banner */}
                    {cleanupResult && (
                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2">
                            <div className="flex items-center justify-between font-bold">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>
                                        Cleanup Successful: {cleanupResult.deletedCount} dataset files permanently deleted ({formatBytes(cleanupResult.totalBytesFreed)} freed)
                                    </span>
                                </div>
                                <span className="font-mono text-[10px] text-emerald-700">
                                    Audit logged at {new Date(cleanupResult.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            {cleanupResult.deletedFiles.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-white/70 border border-emerald-200 text-[11px] font-mono text-slate-700 space-y-1">
                                    <div className="font-semibold text-slate-800">Removed files:</div>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {cleanupResult.deletedFiles.map((df, i) => (
                                            <li key={i}>
                                                <span className="font-bold">{df.fileName}</span> ({df.format}) &mdash; {formatBytes(df.bytesFreed)} from <code className="text-slate-500">{df.path}</code>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {cleanupResult.failedFiles.length > 0 && (
                                <div className="p-2.5 rounded-lg bg-rose-100/70 border border-rose-300 text-rose-800 font-mono text-[11px]">
                                    <div className="font-bold">Failed to delete:</div>
                                    <ul className="list-disc list-inside">
                                        {cleanupResult.failedFiles.map((ff, i) => (
                                            <li key={i}>{ff.fileName}: {ff.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Storage Status & Counts Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/20 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Excel Files</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-800">{counts.excel}</div>
                            <div className="text-[10px] text-slate-400">.xlsx, .xls</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/20 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                                <FileJson className="w-3.5 h-3.5 text-amber-600" />
                                <span>JSON Files</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-800">{counts.json}</div>
                            <div className="text-[10px] text-slate-400">.json arrays/objs</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/20 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                                <Music className="w-3.5 h-3.5 text-purple-600" />
                                <span>Audio (MP3)</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-800">{counts.audio}</div>
                            <div className="text-[10px] text-slate-400">.mp3 recordings</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/20 shadow-sm">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span>CSV Files</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-800">{counts.csv}</div>
                            <div className="text-[10px] text-slate-400">.csv streams</div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-sky-400/20 shadow-sm col-span-2 sm:col-span-1">
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold mb-1">
                                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                                <span>Storage Used</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-slate-800">{formatBytes(counts.totalBytes)}</div>
                            <div className="text-[10px] text-slate-400">data/emergency-dataset</div>
                        </div>
                    </div>

                    {/* Server-Side Cleanup Control Panel */}
                    <div className="glass-panel p-5 rounded-2xl border border-rose-300/60 bg-gradient-to-br from-white to-rose-50/20 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-300">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Server-Side Dataset Deletion & Cleanup</h3>
                                    <p className="text-xs text-slate-500">
                                        Permanently delete selected dataset formats from server storage and clean up associated CAD records
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                disabled={matchingFilesForCleanup.length === 0 || isCleaning}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                                    matchingFilesForCleanup.length === 0 || isCleaning
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/25'
                                }`}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Purge Selected Files ({matchingFilesForCleanup.length})</span>
                            </button>
                        </div>

                        {/* Format Selection Checkboxes */}
                        <div className="text-xs space-y-2">
                            <div className="font-semibold text-slate-700">Target Formats for Removal:</div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 select-none">
                                    <input
                                        type="checkbox"
                                        checked={targetFormats.excel}
                                        onChange={e => setTargetFormats({ ...targetFormats, excel: e.target.checked })}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-medium text-slate-800">Excel (.xlsx, .xls)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 select-none">
                                    <input
                                        type="checkbox"
                                        checked={targetFormats.json}
                                        onChange={e => setTargetFormats({ ...targetFormats, json: e.target.checked })}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-medium text-slate-800">JSON (.json)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 select-none">
                                    <input
                                        type="checkbox"
                                        checked={targetFormats.audio}
                                        onChange={e => setTargetFormats({ ...targetFormats, audio: e.target.checked })}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-medium text-slate-800">Audio (.mp3)</span>
                                </label>

                                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-50 select-none">
                                    <input
                                        type="checkbox"
                                        checked={targetFormats.csv}
                                        onChange={e => setTargetFormats({ ...targetFormats, csv: e.target.checked })}
                                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="font-medium text-slate-800">CSV (.csv)</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Safety Policy:</strong> Only dataset files located under <code className="font-mono text-slate-800">data/emergency-dataset/</code> matching the selected formats are eligible for deletion. Application source code, configuration files (<code className="font-mono text-slate-800">package.json</code>, <code className="font-mono text-slate-800">tsconfig.json</code>), authentication accounts, and unrelated system records are strictly preserved.
                            </span>
                        </div>
                    </div>

                    {/* Stored Dataset Files Inventory */}
                    <div className="glass-panel p-5 rounded-2xl border border-sky-400/20 bg-white shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-sky-400/10">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">Configured Server Storage Inventory</h3>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px]">
                                    {serverFiles.length} files total
                                </span>
                            </div>

                            <button
                                onClick={fetchDatasetFiles}
                                disabled={isLoadingFiles}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                                <span>Refresh Inventory</span>
                            </button>
                        </div>

                        {serverFiles.length === 0 ? (
                            <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                                <Database className="w-8 h-8 mx-auto text-slate-300" />
                                <div className="font-semibold text-slate-700">No dataset files currently stored on server.</div>
                                <div className="text-[11px] text-slate-400">All requested dataset categories are clean.</div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                                            <th className="pb-2">Filename</th>
                                            <th className="pb-2">Format</th>
                                            <th className="pb-2">Subfolder</th>
                                            <th className="pb-2">Size</th>
                                            <th className="pb-2">Targeted</th>
                                            <th className="pb-2">Last Modified</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {serverFiles.map((file, idx) => {
                                            const isTargeted = matchingFilesForCleanup.some(m => m.fileName === file.fileName);
                                            return (
                                                <tr key={idx} className="hover:bg-sky-50/40 font-mono text-[11px]">
                                                    <td className="py-2 font-bold text-slate-800">{file.fileName}</td>
                                                    <td className="py-2">
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                                                            {file.format}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 text-slate-600">{file.subfolder}/</td>
                                                    <td className="py-2 text-slate-600">{formatBytes(file.fileSizeBytes)}</td>
                                                    <td className="py-2">
                                                        {isTargeted ? (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                                                                Pending Purge
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                                Preserved
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-slate-500 text-[10px]">
                                                        {new Date(file.modifiedAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Confirmation Modal */}
                    {isConfirmModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-rose-300 space-y-4">
                                <div className="flex items-center gap-3 pb-3 border-b border-rose-100">
                                    <div className="p-3 rounded-xl bg-rose-100 text-rose-700 border border-rose-300">
                                        <AlertTriangle className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">Confirm Permanent Dataset Cleanup</h3>
                                        <p className="text-xs text-rose-600 font-semibold">
                                            Authorized Admin Action Required
                                        </p>
                                    </div>
                                </div>

                                <div className="text-xs text-slate-600 space-y-2">
                                    <p>
                                        You are about to permanently delete <strong>{matchingFilesForCleanup.length} dataset file(s)</strong> from configured server storage:
                                    </p>
                                    <div className="max-h-36 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                                        {matchingFilesForCleanup.map((f, i) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{f.fileName}</span>
                                                <span className="text-slate-400">{formatBytes(f.fileSizeBytes)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] space-y-1">
                                        <div className="font-bold flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5" />
                                            <span>Immediate System Effects:</span>
                                        </div>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            <li>Targeted files will be unlinked and permanently erased from disk.</li>
                                            <li>Associated CAD intake reports and incident records will be purged.</li>
                                            <li>A permanent audit trail entry will be logged under Administrator: <strong>{currentUser?.name}</strong>.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsConfirmModalOpen(false)}
                                        disabled={isCleaning}
                                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleExecuteCleanup}
                                        disabled={isCleaning}
                                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                                    >
                                        {isCleaning ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                <span>Executing Cleanup...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                <span>Confirm & Execute Permanent Cleanup</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Engine Weights Configuration */}
            {activeSection === 'CONFIG' && (
                <div className="glass-panel p-5 rounded-xl border border-sky-400/30 space-y-4 bg-white shadow-sm">
                    <div className="flex items-center gap-3 pb-3 border-b border-sky-400/20">
                        <div className="p-2.5 bg-sky-100/80 border border-sky-400/30 rounded-xl text-sky-700 shadow-sm">
                            <Sliders className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Spatiotemporal Correlation Engine Configuration</h2>
                            <p className="text-xs text-slate-500">Adjust algorithm scoring weights, distance boundaries, and correlation thresholds</p>
                        </div>
                    </div>

                    {savedSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2 shadow-sm">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Engine parameters successfully updated and saved to audit log.
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        {/* Weights sliders */}
                        <div className="space-y-3 p-4 rounded-xl bg-sky-50/40 border border-sky-400/30">
                            <h3 className="font-semibold text-sky-800 uppercase tracking-wider text-[11px]">Composite Weight Distribution (Sum = 1.0)</h3>

                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Spatial Proximity Weight (Haversine):</span>
                                    <span className="font-mono text-sky-700 font-bold">{formConfig.spatialWeight.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="0.8"
                                    step="0.05"
                                    value={formConfig.spatialWeight}
                                    onChange={e => setFormConfig({ ...formConfig, spatialWeight: parseFloat(e.target.value) })}
                                    className="w-full accent-sky-500 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Temporal Decay Weight (Exponential):</span>
                                    <span className="font-mono text-sky-700 font-bold">{formConfig.temporalWeight.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="0.8"
                                    step="0.05"
                                    value={formConfig.temporalWeight}
                                    onChange={e => setFormConfig({ ...formConfig, temporalWeight: parseFloat(e.target.value) })}
                                    className="w-full accent-sky-500 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Category Compatibility Weight:</span>
                                    <span className="font-mono text-sky-700 font-bold">{formConfig.categoryWeight.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.5"
                                    step="0.05"
                                    value={formConfig.categoryWeight}
                                    onChange={e => setFormConfig({ ...formConfig, categoryWeight: parseFloat(e.target.value) })}
                                    className="w-full accent-sky-500 cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-slate-700">
                                    <span>Semantic / NLP Text Similarity Weight:</span>
                                    <span className="font-mono text-sky-700 font-bold">{formConfig.semanticWeight.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.05"
                                    max="0.5"
                                    step="0.05"
                                    value={formConfig.semanticWeight}
                                    onChange={e => setFormConfig({ ...formConfig, semanticWeight: parseFloat(e.target.value) })}
                                    className="w-full accent-sky-500 cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Thresholds & Boundaries */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-400/30 space-y-2">
                                <label className="font-semibold text-slate-700 block">Max Correlation Radius (Km):</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="10"
                                    value={formConfig.maxRadiusKm}
                                    onChange={e => setFormConfig({ ...formConfig, maxRadiusKm: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                />
                            </div>

                            <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-400/30 space-y-2">
                                <label className="font-semibold text-slate-700 block">Auto-Link Threshold Score (%):</label>
                                <input
                                    type="number"
                                    min="50"
                                    max="95"
                                    value={formConfig.autoLinkThreshold}
                                    onChange={e => setFormConfig({ ...formConfig, autoLinkThreshold: parseInt(e.target.value) })}
                                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-sky-400/30 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-sky-500/25"
                            >
                                <Save className="w-4 h-4" /> Save Engine Config
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
