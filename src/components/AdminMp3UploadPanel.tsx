import React, { useState, useRef } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
    Mic,
    UploadCloud,
    FileAudio,
    CheckCircle2,
    AlertTriangle,
    Loader2,
    Play,
    Pause,
    Send,
    Sparkles,
    ShieldAlert,
    Lock,
    Copy,
    Check,
    RefreshCw,
    FileText
} from 'lucide-react';
import { RawReport } from '../types';

export const AdminMp3UploadPanel: React.FC = () => {
    const { currentUser, ingestNewReport, setActiveTab } = useEmergency();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'UPLOADING' | 'TRANSCRIBING' | 'COMPLETED' | 'ERROR'>('IDLE');
    const [transcript, setTranscript] = useState<string>('');
    const [engineInfo, setEngineInfo] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [savedReportId, setSavedReportId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isAdmin = currentUser?.role === 'ADMIN';

    // File selection & validation
    const handleFileSelect = (file: File) => {
        setErrorMessage(null);
        setTranscript('');
        setSavedReportId(null);
        setUploadStatus('IDLE');

        // 1. Validate File Extension
        if (!file.name.toLowerCase().endsWith('.mp3')) {
            setErrorMessage(`Invalid File Format: Only .mp3 audio files are allowed. Selected file: "${file.name}"`);
            setSelectedFile(null);
            setAudioBlobUrl(null);
            return;
        }

        // 2. Validate File Size (Max 25 MB for OpenAI Whisper)
        const MAX_BYTES = 25 * 1024 * 1024;
        if (file.size > MAX_BYTES) {
            setErrorMessage(`File Too Large: Maximum allowed size is 25MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
            setSelectedFile(null);
            setAudioBlobUrl(null);
            return;
        }

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setAudioBlobUrl(url);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isAdmin) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // Trigger server-side transcription
    const handleStartTranscription = async () => {
        if (!selectedFile) return;

        setUploadStatus('UPLOADING');
        setErrorMessage(null);

        try {
            // Give brief upload visual progress
            await new Promise(r => setTimeout(r, 400));
            setUploadStatus('TRANSCRIBING');

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                    'x-user-role': currentUser?.role || '',
                    'x-file-name': selectedFile.name,
                    'Content-Type': 'audio/mpeg'
                },
                body: selectedFile
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Server returned status ${response.status}`);
            }

            setTranscript(data.text || '');
            setEngineInfo(data.engine || 'OpenAI Whisper API');
            setUploadStatus('COMPLETED');
        } catch (err: any) {
            setUploadStatus('ERROR');
            setErrorMessage(err.message || 'Transcription failed due to a network or server error.');
        }
    };

    // Submit Transcript for Incident Analysis (Requirement 7: Do NOT automatically create or update an incident)
    const handleSubmitForAnalysis = () => {
        if (!transcript.trim()) return;

        // Auto-detect inferred location & category from transcript keywords
        let location = 'Chennai Emergency Call Sector';
        let category: any = 'OTHER';
        let severity: any = 'HIGH';
        let lat = 13.0827;
        let lng = 80.2707;

        const lower = transcript.toLowerCase();
        if (lower.includes('velachery') || lower.includes('insulin') || lower.includes('flood')) {
            location = 'Velachery MRTS West-side Approach, Chennai';
            category = 'FLOOD';
            severity = 'CRITICAL';
            lat = 12.9784;
            lng = 80.2184;
        } else if (lower.includes('tambaram') || lower.includes('transformer') || lower.includes('fire')) {
            location = 'Tambaram Sanatorium Station Electrical Compound, Chennai';
            category = 'FIRE';
            severity = 'HIGH';
            lat = 12.9249;
            lng = 80.1000;
        } else if (lower.includes('medavakkam') || lower.includes('boat')) {
            location = 'Medavakkam Main Road, Chennai';
            category = 'FLOOD';
            severity = 'HIGH';
            lat = 12.9185;
            lng = 80.1873;
        }

        // Save as a PENDING raw report without creating an incident
        const newReport = ingestNewReport({
            sourceType: 'PHONE_CALL',
            sourceName: `MP3 Audio Call: ${selectedFile?.name || 'dispatch_call.mp3'}`,
            verificationState: 'UNVERIFIED', // Pending review
            rawText: transcript,
            locationName: location,
            latitude: lat,
            longitude: lng,
            country: 'India',
            state: 'Tamil Nadu',
            city: 'Chennai',
            locationAccuracy: 'APPROXIMATE',
            category: category,
            aiSuggestedCategory: category,
            aiSuggestedSeverity: severity,
            reporterName: 'Audio Call Intake (Transcribed)',
            notes: [`Audio Source: ${selectedFile?.name || 'audio.mp3'}`, `Speech Engine: ${engineInfo || 'Whisper'}`],
            assignedIncidentId: null // Crucial: NOT linked or auto-dispatched yet!
        });

        setSavedReportId(newReport.id);
    };

    const handleCopy = () => {
        if (!transcript) return;
        navigator.clipboard.writeText(transcript);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // If not Admin, show access gate
    if (!isAdmin) {
        return (
            <div className="glass-panel p-6 rounded-2xl border border-sky-400/30 bg-white shadow-[0_0_25px_rgba(56,189,248,0.30)] text-center max-w-xl mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-900">Administrator Authorization Required</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        The MP3 Audio Transcription Console is restricted to Administrator personnel (Role: <span className="font-mono font-bold text-sky-700">ADMIN</span>).
                    </p>
                </div>
                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-400/20 text-xs text-slate-700">
                    Currently logged in as: <strong className="text-slate-900">{currentUser?.name || 'Guest'}</strong> ({currentUser?.role || 'UNAUTHENTICATED'})
                </div>
                <p className="text-[11px] text-slate-400">
                    Tip: Switch operator account to <span className="font-mono font-bold text-slate-700">Elena Rostova (ADMIN)</span> on the Login screen to unlock.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-sky-400/30 bg-white shadow-[0_0_35px_rgba(56,189,248,0.30)] space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sky-400/20">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-100/80 border border-sky-400/30 text-sky-700 shadow-sm">
                        <Mic className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-slate-900">Admin Emergency Audio Transcription Console</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                ADMIN ONLY
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Secure server-side OpenAI audio transcription • Automatic incident correlation readiness
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <strong className="block font-semibold">Transcription Service Alert:</strong>
                        <span>{errorMessage}</span>
                    </div>
                </div>
            )}

            {/* Success Saved Notification */}
            {savedReportId && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Transcript Successfully Ingested as Pending Report ({savedReportId})</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-mono font-bold text-[10px]">
                            UNVERIFIED PENDING
                        </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                        The call transcript has been saved to the <strong>Incoming Reports Queue</strong>. No incident was modified or spawned automatically, adhering to call-center governance. It is now ready for spatiotemporal duplicate triage!
                    </p>
                    <div className="pt-1">
                        <button
                            onClick={() => setActiveTab('REPORTS')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm transition-colors flex items-center gap-1"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View in Incoming Reports Queue</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Drag and Drop Zone */}
            <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    selectedFile
                        ? 'border-sky-400 bg-sky-50/50'
                        : 'border-sky-300 hover:border-sky-500 bg-sky-50/20 hover:bg-sky-50/40'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,audio/mpeg,audio/mp3"
                    className="hidden"
                    onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                        }
                    }}
                />

                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-sky-100 text-sky-700 shadow-sm">
                        <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-800">
                            {selectedFile ? selectedFile.name : 'Choose or drag & drop emergency call MP3 file'}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                            Standard audio limits: Max 25 MB • MP3 format only
                        </p>
                    </div>

                    {selectedFile && (
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-slate-600">
                            <span>Size: {(selectedFile.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">Valid MP3</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Audio Player Preview */}
            {audioBlobUrl && (
                <div className="p-3.5 rounded-xl bg-sky-50/40 border border-sky-400/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <FileAudio className="w-4 h-4 text-sky-600" />
                            Audio Playback Preview:
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{selectedFile?.name}</span>
                    </div>
                    <audio controls className="w-full h-9 rounded-lg shadow-sm" src={audioBlobUrl} />
                </div>
            )}

            {/* Action Bar for Transcription */}
            {selectedFile && uploadStatus !== 'COMPLETED' && (
                <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                        onClick={handleStartTranscription}
                        disabled={uploadStatus === 'UPLOADING' || uploadStatus === 'TRANSCRIBING'}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-sky-500/25 flex items-center gap-2 transition-all"
                    >
                        {uploadStatus === 'UPLOADING' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading Audio (Max 25MB)...</span>
                            </>
                        ) : uploadStatus === 'TRANSCRIBING' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                                <span>Whisper Audio Engine Transcribing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Start Server-Side Transcription</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Transcript Display & Ingestion Card */}
            {transcript && (
                <div className="p-4 rounded-xl bg-white border border-sky-400/30 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-sky-600" />
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                Transcribed Emergency Dialogue
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                                {engineInfo || 'Whisper-1'}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-sky-50 transition-colors"
                                title="Copy transcript"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    </div>

                    <div className="p-3.5 rounded-lg bg-sky-50/50 border border-sky-400/20 text-xs text-slate-800 leading-relaxed font-sans font-medium">
                        "{transcript}"
                    </div>

                    {/* Submit Transcript for Incident Analysis (Requirement 6 & 7) */}
                    <div className="pt-2 flex items-center justify-between border-t border-sky-400/20">
                        <div className="text-[11px] text-slate-500">
                            Protocol: Preserves database integrity by queuing as an <strong>Unverified Pending Intake Report</strong>.
                        </div>

                        <button
                            onClick={handleSubmitForAnalysis}
                            disabled={!!savedReportId}
                            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                                savedReportId
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                            }`}
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Transcript for Incident Analysis</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

