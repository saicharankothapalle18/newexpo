import React, { useState } from 'react';
import { UnifiedIncident, RawReport, IncidentNote, ResponseUnit } from '../types';
import {
    Clock,
    ShieldAlert,
    CheckCircle2,
    Users,
    FileText,
    Link2,
    Sparkles,
    Check,
    AlertTriangle,
    MapPin,
    Filter
} from 'lucide-react';

export interface TimelineEvent {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    type: 'CREATION' | 'VERIFICATION' | 'REPORT_MERGE' | 'DISPATCH' | 'NOTE' | 'STATUS_CHANGE' | 'RESOLUTION';
    author?: string;
    authorRole?: string;
    badgeText?: string;
}

interface IncidentTimelineProps {
    incident: UnifiedIncident;
    childReports?: RawReport[];
    units?: ResponseUnit[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
    incident,
    childReports = [],
    units = []
}) => {
    const [filterType, setFilterType] = useState<string>('ALL');

    // Synthesize chronological timeline events from incident history
    const events: TimelineEvent[] = [];

    // 1. Initial Creation Event
    events.push({
        id: `evt-create-${incident.id}`,
        timestamp: incident.createdTime,
        title: 'Unified Incident Spawned',
        description: `Incident initialized at ${incident.locationDescription}. Severity categorized as ${incident.severity}.`,
        type: 'CREATION',
        author: incident.primaryOperatorId || 'Operator',
        authorRole: 'OPERATOR',
        badgeText: 'CAD Spawn'
    });

    // 2. Child Reports Ingestion & Merges
    childReports.forEach((rep) => {
        events.push({
            id: `evt-rep-${rep.id}`,
            timestamp: rep.timestamp,
            title: `Report Ingested: ${rep.id} (${rep.sourceType.replace('_', ' ')})`,
            description: `"${rep.rawText}" - Ingested via ${rep.sourceName}. Location: ${rep.locationName}.`,
            type: 'REPORT_MERGE',
            badgeText: 'Intake Linked'
        });
    });

    // 3. Human Verification Event
    if (incident.verifiedBy && incident.verifiedAt) {
        events.push({
            id: `evt-verify-${incident.id}`,
            timestamp: incident.verifiedAt,
            title: 'Human Authorization Verified',
            description: `Operator verified emergency validity and approved escalation to operational dispatch.`,
            type: 'VERIFICATION',
            author: incident.verifiedBy,
            authorRole: 'OPERATOR',
            badgeText: 'Verified'
        });
    }

    // 4. Assigned Units Dispatches
    incident.assignedUnitIds.forEach(uId => {
        const unit = units.find(u => u.id === uId);
        events.push({
            id: `evt-unit-${uId}`,
            timestamp: unit ? unit.lastUpdated : incident.lastUpdatedTime,
            title: `Emergency Unit Dispatched: ${unit ? unit.callSign : uId}`,
            description: `Assigned to incident sector. Status: ${unit ? unit.status : 'DISPATCHED'}. Personnel: ${unit ? unit.personnelCount : 'Tactical crew'}.`,
            type: 'DISPATCH',
            badgeText: 'Dispatch'
        });
    });

    // 5. Explicit Timeline Events on Unified Incident
    if (incident.timelineEvents && incident.timelineEvents.length > 0) {
        incident.timelineEvents.forEach(te => {
            let eventType: TimelineEvent['type'] = 'NOTE';
            if (te.type === 'TEAM_COORDINATED') eventType = 'DISPATCH';
            else if (te.type === 'REPORT_ATTACHED' || te.type === 'DUPLICATE_DETECTED' || te.type === 'REPORT_RECEIVED') eventType = 'REPORT_MERGE';
            else if (te.type === 'STATUS_CHANGED') eventType = 'STATUS_CHANGE';

            events.push({
                id: `evt-te-${te.id}`,
                timestamp: te.timestamp,
                title: te.type.replace(/_/g, ' '),
                description: te.description,
                type: eventType,
                author: te.authorName || 'Operator',
                authorRole: 'OPERATOR',
                badgeText: te.type.replace(/_/g, ' ')
            });
        });
    }

    // 6. Operator Incident Notes
    if (incident.notes && incident.notes.length > 0) {
        incident.notes.forEach(n => {
            events.push({
                id: `evt-note-${n.id}`,
                timestamp: n.timestamp,
                title: 'Operator Operational Note Added',
                description: n.text,
                type: 'NOTE',
                author: n.authorId,
                authorRole: n.authorRole,
                badgeText: 'Note'
            });
        });
    }

    // 7. Resolution Event
    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
        events.push({
            id: `evt-resolve-${incident.id}`,
            timestamp: incident.lastUpdatedTime,
            title: `Incident Transitioned to ${incident.status}`,
            description: `Hazard contained and all response operations concluded. Units stood down.`,
            type: 'RESOLUTION',
            badgeText: 'Resolved'
        });
    }

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const uniqueEvents = events.filter(e => {
        if (seenIds.has(e.id)) return false;
        seenIds.add(e.id);
        return true;
    });

    // Sort descending by timestamp (newest first)
    uniqueEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filteredEvents = uniqueEvents.filter(e => {
        if (filterType === 'ALL') return true;
        if (filterType === 'VERIFICATION' && e.type !== 'VERIFICATION') return false;
        if (filterType === 'DISPATCH' && e.type !== 'DISPATCH') return false;
        if (filterType === 'NOTE' && e.type !== 'NOTE') return false;
        if (filterType === 'REPORT' && e.type !== 'REPORT_MERGE') return false;
        return true;
    });

    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'CREATION':
                return <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />;
            case 'VERIFICATION':
                return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
            case 'REPORT_MERGE':
                return <Link2 className="w-3.5 h-3.5 text-amber-600" />;
            case 'DISPATCH':
                return <Users className="w-3.5 h-3.5 text-purple-600" />;
            case 'NOTE':
                return <FileText className="w-3.5 h-3.5 text-blue-600" />;
            case 'RESOLUTION':
                return <Check className="w-3.5 h-3.5 text-emerald-600" />;
            default:
                return <Clock className="w-3.5 h-3.5 text-slate-500" />;
        }
    };

    return (
        <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center justify-between text-xs pb-1 border-b border-sky-400/20">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    Chronological Audit Stream ({filteredEvents.length})
                </span>

                <div className="flex items-center gap-1 text-[10px]">
                    {[
                        { id: 'ALL', label: 'All' },
                        { id: 'VERIFICATION', label: 'Verifications' },
                        { id: 'REPORT', label: 'Reports' },
                        { id: 'DISPATCH', label: 'Dispatches' },
                        { id: 'NOTE', label: 'Notes' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id)}
                            className={`px-2 py-0.5 rounded transition-colors ${
                                filterType === f.id
                                    ? 'bg-sky-100 text-sky-800 border border-sky-400/30 font-bold shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Visual Timeline Stream */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200">
                {filteredEvents.length === 0 ? (
                    <div className="text-slate-400 text-xs py-4 text-center">
                        No events found for this filter category.
                    </div>
                ) : (
                    filteredEvents.map(evt => (
                        <div key={evt.id} className="relative group">
                            {/* Milestone Marker Dot */}
                            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border border-sky-300 flex items-center justify-center shadow-sm">
                                {getEventIcon(evt.type)}
                            </div>

                            {/* Event Card */}
                            <div className="p-3 rounded-xl bg-white border border-sky-400/30 text-xs space-y-1 hover:border-sky-400 hover:shadow-sm transition-all shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-xs">{evt.title}</span>
                                        {evt.badgeText && (
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                                evt.type === 'VERIFICATION' ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' :
                                                evt.type === 'DISPATCH' ? 'bg-purple-50 text-purple-700 border border-purple-300' :
                                                evt.type === 'REPORT_MERGE' ? 'bg-amber-50 text-amber-700 border border-amber-300' :
                                                evt.type === 'CREATION' ? 'bg-sky-50 text-sky-700 border border-sky-300' :
                                                'bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}>
                                                {evt.badgeText}
                                            </span>
                                        )}
                                    </div>

                                    <span className="font-mono text-[10px] text-slate-500">
                                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>

                                <p className="text-slate-600 text-[11px] leading-relaxed font-sans">
                                    {evt.description}
                                </p>

                                {evt.author && (
                                    <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1 font-mono">
                                        <span>Logged by:</span>
                                        <span className="text-sky-700 font-semibold">{evt.author}</span>
                                        {evt.authorRole && <span>({evt.authorRole})</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
