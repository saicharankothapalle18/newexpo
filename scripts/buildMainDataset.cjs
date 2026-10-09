const fs = require('fs');
const path = require('path');

// 1. Read dataset files
const smsPath = path.join(__dirname, '../data/emergency-dataset/csv/sms_helpline.csv');
const twPath = path.join(__dirname, '../data/emergency-dataset/csv/twitter_feed.csv');
const waPath = path.join(__dirname, '../data/emergency-dataset/json/whatsapp_community.json');

const smsContent = fs.readFileSync(smsPath, 'utf8');
const twContent = fs.readFileSync(twPath, 'utf8');
const waData = JSON.parse(fs.readFileSync(waPath, 'utf8'));

// Parse CSV helper
function parseCsv(content) {
    const lines = content.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        const commaIdx1 = line.indexOf(',');
        const commaIdx2 = line.indexOf(',', commaIdx1 + 1);
        const commaIdx3 = line.indexOf(',', commaIdx2 + 1);
        if (commaIdx1 === -1 || commaIdx2 === -1 || commaIdx3 === -1) continue;
        const col0 = line.substring(0, commaIdx1).trim();
        const col1 = line.substring(commaIdx1 + 1, commaIdx2).trim();
        const col2 = line.substring(commaIdx2 + 1, commaIdx3).trim();
        const col3 = line.substring(commaIdx3 + 1).trim();
        records.push({ id: col0, timestamp: col1, sender: col2, text: col3 });
    }
    return records;
}

const smsRecords = parseCsv(smsContent);
const twRecords = parseCsv(twContent);
const waRecords = waData.messages.map(m => ({
    id: m.message_id,
    timestamp: m.timestamp,
    sender: m.sender,
    text: m.text
}));

console.log(`Parsed ${smsRecords.length} SMS, ${twRecords.length} Tweets, ${waRecords.length} WhatsApp messages.`);

// Geographic anchors for the 4 core dataset clusters
const VELACHERY_GPS = { lat: 12.9796, lng: 80.2185 };
const TAMBARAM_GPS = { lat: 12.9280, lng: 80.1220 };
const MEDAVAKKAM_GPS = { lat: 12.9200, lng: 80.1884 };
const SAIDAPET_GPS = { lat: 13.0213, lng: 80.2231 };

// Classify message to incident
function classifyRecord(text) {
    const lower = text.toLowerCase();
    if (lower.includes('velachery') || lower.includes('insulin') || lower.includes('mrts') || lower.includes('medical shop') || lower.includes('diabetic')) {
        return {
            incidentId: 'INC-2001',
            lat: VELACHERY_GPS.lat + (Math.random() - 0.5) * 0.003,
            lng: VELACHERY_GPS.lng + (Math.random() - 0.5) * 0.003,
            locationName: 'Velachery MRTS Backside, Vijayanagar, Chennai',
            category: 'MEDICAL_EMERGENCY',
            severity: 'CRITICAL',
            accuracy: 'EXACT_GPS'
        };
    }
    if (lower.includes('transformer') || lower.includes('tambaram') || lower.includes('sanatorium') || lower.includes('fire') || lower.includes('eb compound') || lower.includes('electrical')) {
        return {
            incidentId: 'INC-2002',
            lat: TAMBARAM_GPS.lat + (Math.random() - 0.5) * 0.003,
            lng: TAMBARAM_GPS.lng + (Math.random() - 0.5) * 0.003,
            locationName: 'Tambaram Sanatorium Railway EB Compound, Chennai',
            category: 'FIRE',
            severity: 'CRITICAL',
            accuracy: 'EXACT_GPS'
        };
    }
    if (lower.includes('medavakkam') || lower.includes('boat') || lower.includes('elderly woman') || lower.includes('children') || lower.includes('evacuat') || lower.includes('school')) {
        return {
            incidentId: 'INC-2003',
            lat: MEDAVAKKAM_GPS.lat + (Math.random() - 0.5) * 0.003,
            lng: MEDAVAKKAM_GPS.lng + (Math.random() - 0.5) * 0.003,
            locationName: 'Medavakkam Inner Residential Road, School Backside, Chennai',
            category: 'FLOOD',
            severity: 'CRITICAL',
            accuracy: 'EXACT_GPS'
        };
    }
    if (lower.includes('saidapet') || lower.includes('traffic') || lower.includes('bridge') || lower.includes('metro')) {
        return {
            incidentId: 'INC-2004',
            lat: SAIDAPET_GPS.lat + (Math.random() - 0.5) * 0.003,
            lng: SAIDAPET_GPS.lng + (Math.random() - 0.5) * 0.003,
            locationName: 'Maraimalai Adigal Bridge, Saidapet, Anna Salai, Chennai',
            category: 'FLOOD',
            severity: 'HIGH',
            accuracy: 'EXACT_GPS'
        };
    }
    // General city weather / status inquiry
    return {
        incidentId: null,
        lat: 12.9800 + (Math.random() - 0.5) * 0.05,
        lng: 80.2000 + (Math.random() - 0.5) * 0.05,
        locationName: 'Chennai Metropolitan Region, Tamil Nadu',
        category: 'NATURAL_DISASTER',
        severity: 'MEDIUM',
        accuracy: 'APPROXIMATE'
    };
}

const allReports = [];

// Process SMS
smsRecords.forEach(r => {
    const meta = classifyRecord(r.text);
    allReports.push({
        id: r.id,
        sourceType: 'PHONE_CALL',
        sourceName: 'SMS Emergency Helpline 112',
        verificationState: 'VERIFIED',
        timestamp: r.timestamp,
        reporterName: r.sender,
        contactNumber: '+91 94440 ' + Math.floor(10000 + Math.random() * 89999),
        latitude: parseFloat(meta.lat.toFixed(6)),
        longitude: parseFloat(meta.lng.toFixed(6)),
        locationName: meta.locationName,
        landmark: 'Chennai Disaster Zone',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: meta.accuracy,
        rawText: r.text,
        affectedPeople: meta.severity === 'CRITICAL' ? (meta.incidentId === 'INC-2002' ? 18 : (meta.incidentId === 'INC-2003' ? 11 : 6)) : 1,
        extractedTextKeywords: r.text.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 7),
        category: meta.category,
        aiSuggestedCategory: meta.category,
        aiCategoryConfidence: 94,
        aiSuggestedSeverity: meta.severity,
        aiSeverityConfidence: 91,
        assignedIncidentId: meta.incidentId,
        isFlaggedMisleading: false,
        notes: ['Ingested from main dataset file: sms_helpline.csv']
    });
});

// Process Twitter
twRecords.forEach(r => {
    const meta = classifyRecord(r.text);
    allReports.push({
        id: r.id,
        sourceType: 'PUBLIC_FEED',
        sourceName: 'Twitter Public Emergency Stream',
        verificationState: 'VERIFIED',
        timestamp: r.timestamp,
        reporterName: r.sender,
        contactNumber: '+91 98840 ' + Math.floor(10000 + Math.random() * 89999),
        latitude: parseFloat(meta.lat.toFixed(6)),
        longitude: parseFloat(meta.lng.toFixed(6)),
        locationName: meta.locationName,
        landmark: 'Chennai Disaster Zone',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: meta.accuracy,
        rawText: r.text,
        affectedPeople: meta.severity === 'CRITICAL' ? (meta.incidentId === 'INC-2002' ? 18 : (meta.incidentId === 'INC-2003' ? 11 : 6)) : 1,
        extractedTextKeywords: r.text.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 7),
        category: meta.category,
        aiSuggestedCategory: meta.category,
        aiCategoryConfidence: 92,
        aiSuggestedSeverity: meta.severity,
        aiSeverityConfidence: 89,
        assignedIncidentId: meta.incidentId,
        isFlaggedMisleading: false,
        notes: ['Ingested from main dataset file: twitter_feed.csv']
    });
});

// Process WhatsApp
waRecords.forEach(r => {
    const meta = classifyRecord(r.text);
    allReports.push({
        id: r.id,
        sourceType: 'PUBLIC_REPORT',
        sourceName: 'WhatsApp Disaster Community Group',
        verificationState: 'VERIFIED',
        timestamp: r.timestamp,
        reporterName: r.sender,
        contactNumber: '+91 97910 ' + Math.floor(10000 + Math.random() * 89999),
        latitude: parseFloat(meta.lat.toFixed(6)),
        longitude: parseFloat(meta.lng.toFixed(6)),
        locationName: meta.locationName,
        landmark: 'Chennai Disaster Zone',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: meta.accuracy,
        rawText: r.text,
        affectedPeople: meta.severity === 'CRITICAL' ? (meta.incidentId === 'INC-2002' ? 18 : (meta.incidentId === 'INC-2003' ? 11 : 6)) : 1,
        extractedTextKeywords: r.text.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 7),
        category: meta.category,
        aiSuggestedCategory: meta.category,
        aiCategoryConfidence: 95,
        aiSuggestedSeverity: meta.severity,
        aiSeverityConfidence: 93,
        assignedIncidentId: meta.incidentId,
        isFlaggedMisleading: false,
        notes: ['Ingested from main dataset file: whatsapp_community.json']
    });
});

// Add Hotline Audio Calls
const audioCalls = [
    { id: 'CALL-001', audio: 'stage_2_call_001.mp3', text: 'Distress call from Velachery MRTS rear side. Water level rising above 4 feet. Elderly diabetic patient needing urgent insulin delivery.', inc: 'INC-2001', lat: 12.9796, lng: 80.2185 },
    { id: 'CALL-002', audio: 'stage_2_call_002.mp3', text: 'Second caller confirming 6 stranded people near medical shop Velachery MRTS. Urgent ambulance request.', inc: 'INC-2001', lat: 12.9792, lng: 80.2190 },
    { id: 'CALL-003', audio: 'stage_2_call_003.mp3', text: 'Explosion heard at Tambaram Sanatorium transformer yard. Heavy smoke and spark hazards across road.', inc: 'INC-2002', lat: 12.9280, lng: 80.1220 },
    { id: 'CALL-004', audio: 'stage_2_call_004.mp3', text: 'TNEB substation coordinator reporting electrical fire contained, requesting police perimeter around Tambaram compound.', inc: 'INC-2002', lat: 12.9275, lng: 80.1215 },
    { id: 'CALL-005', audio: 'stage_2_call_005.mp3', text: 'Emergency rescue boat dispatch requested at Medavakkam. 11 people stranded in flooded houses near government school.', inc: 'INC-2003', lat: 12.9200, lng: 80.1884 },
    { id: 'CALL-006', audio: 'stage_2_call_006.mp3', text: 'Evacuation in progress at Medavakkam second street. Elderly woman and children safely moved to relief boat.', inc: 'INC-2003', lat: 12.9205, lng: 80.1878 },
    { id: 'CALL-007', audio: 'stage_2_call_007.mp3', text: 'Saidapet bridge police outpost reporting high water surge from Chembarambakkam reservoir. Traffic diversion active.', inc: 'INC-2004', lat: 13.0213, lng: 80.2231 }
];

audioCalls.forEach(c => {
    allReports.push({
        id: c.id,
        sourceType: 'PHONE_CALL',
        sourceName: 'Emergency Voice Hotline (Audio: ' + c.audio + ')',
        verificationState: 'VERIFIED',
        timestamp: '2026-10-07T08:21:00',
        reporterName: 'CAD Hotline Desk #1',
        contactNumber: '+91 800 112 9999',
        latitude: c.lat,
        longitude: c.lng,
        locationName: c.inc === 'INC-2001' ? 'Velachery MRTS Backside, Chennai' : (c.inc === 'INC-2002' ? 'Tambaram Sanatorium Station, Chennai' : (c.inc === 'INC-2003' ? 'Medavakkam Residential School Lane, Chennai' : 'Saidapet Maraimalai Adigal Bridge, Chennai')),
        landmark: 'Disaster Zone',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: c.text,
        affectedPeople: c.inc === 'INC-2002' ? 18 : (c.inc === 'INC-2003' ? 11 : (c.inc === 'INC-2001' ? 6 : 0)),
        extractedTextKeywords: ['hotline', 'audio', 'call', 'emergency', 'dispatch'],
        category: c.inc === 'INC-2001' ? 'MEDICAL_EMERGENCY' : (c.inc === 'INC-2002' ? 'FIRE' : 'FLOOD'),
        aiSuggestedCategory: c.inc === 'INC-2001' ? 'MEDICAL_EMERGENCY' : (c.inc === 'INC-2002' ? 'FIRE' : 'FLOOD'),
        aiCategoryConfidence: 98,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 95,
        assignedIncidentId: c.inc,
        isFlaggedMisleading: false,
        notes: ['Audio file reference: ' + c.audio]
    });
});

// Group child report IDs
const inc1Reports = allReports.filter(r => r.assignedIncidentId === 'INC-2001').map(r => r.id);
const inc2Reports = allReports.filter(r => r.assignedIncidentId === 'INC-2002').map(r => r.id);
const inc3Reports = allReports.filter(r => r.assignedIncidentId === 'INC-2003').map(r => r.id);
const inc4Reports = allReports.filter(r => r.assignedIncidentId === 'INC-2004').map(r => r.id);

const incidents = [
    {
        id: 'INC-2001',
        title: 'Velachery MRTS Stranded Residents & Diabetic Insulin Emergency',
        category: 'MEDICAL_EMERGENCY',
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        latitude: VELACHERY_GPS.lat,
        longitude: VELACHERY_GPS.lng,
        locationDescription: 'Velachery MRTS Station Backside & Vijayanagar Main Road Junction',
        landmark: 'Behind Velachery MRTS Railway Station, Near Apollo Pharmacy',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: '6 individuals stranded in deep water behind Velachery MRTS station. Diabetic elderly resident in critical need of insulin delivery. Rapid response team reached and life-saving medication delivered.',
        createdTime: '2026-10-07T08:20:00Z',
        lastUpdatedTime: new Date().toISOString(),
        firstReportedAt: '2026-10-07T08:20:00Z',
        lastUpdatedAt: new Date().toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins (SUP-01)',
        verifiedAt: '2026-10-07T08:22:00Z',
        childReportIds: inc1Reports,
        candidateReportIds: [],
        victimEstCount: 6,
        affectedPeople: 6,
        hazmatInvolved: false,
        assignedUnitIds: ['MED-01'],
        notes: [
            {
                id: 'NOTE-1',
                timestamp: '2026-10-07T08:25:00Z',
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Insulin successfully delivered to patient by EMS Ambulance 01. Water level 3.5ft.',
                isSystemGenerated: false
            }
        ]
    },
    {
        id: 'INC-2002',
        title: 'Tambaram Sanatorium High-Voltage Transformer Fire & Power Grid Hazard',
        category: 'FIRE',
        severity: 'CRITICAL',
        status: 'RESPONDING',
        latitude: TAMBARAM_GPS.lat,
        longitude: TAMBARAM_GPS.lng,
        locationDescription: 'Tambaram Sanatorium Railway Station & TNEB Electrical Compound',
        landmark: 'Station Approach Road, Near Substation Yard',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'High-voltage electrical transformer caught fire near railway approach road following power surge and storm flooding. 18 people affected in immediate vicinity. Fire tender ENG-01 dispatched, flames extinguished, electrical sector isolated.',
        createdTime: '2026-10-07T08:27:00Z',
        lastUpdatedTime: new Date().toISOString(),
        firstReportedAt: '2026-10-07T08:27:00Z',
        lastUpdatedAt: new Date().toISOString(),
        primaryOperatorId: 'DISP-22',
        verifiedBy: 'Elena Rostova (ADM-01)',
        verifiedAt: '2026-10-07T08:28:00Z',
        childReportIds: inc2Reports,
        candidateReportIds: [],
        victimEstCount: 18,
        affectedPeople: 18,
        hazmatInvolved: false,
        assignedUnitIds: ['ENG-01'],
        notes: [
            {
                id: 'NOTE-2',
                timestamp: '2026-10-07T08:33:00Z',
                authorId: 'DISP-22',
                authorRole: 'RESPONDER',
                text: 'Flames suppressed with dry chemical powder. Area isolated. Grid restored.',
                isSystemGenerated: false
            }
        ]
    },
    {
        id: 'INC-2003',
        title: 'Medavakkam Residential Flood Inundation & Emergency Boat Evacuation',
        category: 'FLOOD',
        severity: 'CRITICAL',
        status: 'IN_PROGRESS',
        latitude: MEDAVAKKAM_GPS.lat,
        longitude: MEDAVAKKAM_GPS.lng,
        locationDescription: 'Medavakkam Inner Residential Road & School Compound Backside',
        landmark: 'Behind Government Higher Secondary School, Water Tank Road',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Severe storm runoff inundation exceeding 4 feet across residential streets. 11 citizens trapped inside ground-floor homes. Rescue Boat BOAT-01 deployed, prioritizing elderly woman and children first.',
        createdTime: '2026-10-07T08:34:00Z',
        lastUpdatedTime: new Date().toISOString(),
        firstReportedAt: '2026-10-07T08:34:00Z',
        lastUpdatedAt: new Date().toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins (SUP-01)',
        verifiedAt: '2026-10-07T08:35:00Z',
        childReportIds: inc3Reports,
        candidateReportIds: [],
        victimEstCount: 11,
        affectedPeople: 11,
        hazmatInvolved: false,
        assignedUnitIds: ['BOAT-01'],
        notes: [
            {
                id: 'NOTE-3',
                timestamp: '2026-10-07T08:38:00Z',
                authorId: 'DISP-22',
                authorRole: 'RESPONDER',
                text: 'Rescue boat operational. First batch of 5 residents safely transported to shelter.',
                isSystemGenerated: false
            }
        ]
    },
    {
        id: 'INC-2004',
        title: 'Saidapet Maraimalai Adigal Bridge / Adyar River Flood Runoff Monitoring',
        category: 'FLOOD',
        severity: 'HIGH',
        status: 'VERIFIED',
        latitude: SAIDAPET_GPS.lat,
        longitude: SAIDAPET_GPS.lng,
        locationDescription: 'Maraimalai Adigal Bridge & Saidapet Metro Approach, Anna Salai',
        landmark: 'Adyar River Crossing, Near Saidapet Metro Station',
        country: 'India',
        state: 'Tamil Nadu',
        city: 'Chennai',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Adyar river experiencing extreme runoff from upstream reservoirs. Maraimalai Adigal bridge approach partially submerged. Heavy traffic diversion coordinated by traffic police unit POLICE-01.',
        createdTime: '2026-10-07T08:45:00Z',
        lastUpdatedTime: new Date().toISOString(),
        firstReportedAt: '2026-10-07T08:45:00Z',
        lastUpdatedAt: new Date().toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins (SUP-01)',
        verifiedAt: '2026-10-07T08:46:00Z',
        childReportIds: inc4Reports,
        candidateReportIds: [],
        victimEstCount: 0,
        affectedPeople: 0,
        hazmatInvolved: false,
        assignedUnitIds: ['POLICE-01'],
        notes: [
            {
                id: 'NOTE-4',
                timestamp: '2026-10-07T08:48:00Z',
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Traffic diverted to Guindy flyover. Water level being monitored hourly.',
                isSystemGenerated: false
            }
        ]
    }
];

// Response units stationed exactly at main dataset coordinates
const units = [
    {
        id: 'ENG-01',
        callSign: 'Rescue Fire Engine 01',
        unitType: 'FIRE',
        status: 'DISPATCHED',
        assignedIncidentId: 'INC-2002',
        latitude: 12.9249,
        longitude: 80.1000,
        personnelCount: 5,
        etaMinutes: 2,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'MED-01',
        callSign: 'Rapid EMS Ambulance 01',
        unitType: 'MEDICAL',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-2001',
        latitude: 12.9784,
        longitude: 80.2184,
        personnelCount: 2,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'BOAT-01',
        callSign: 'Disaster Rescue Boat 01',
        unitType: 'RESCUE',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-2003',
        latitude: 12.9185,
        longitude: 80.1873,
        personnelCount: 4,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'POLICE-01',
        callSign: 'Traffic Police Patrol 01',
        unitType: 'POLICE',
        status: 'DISPATCHED',
        assignedIncidentId: 'INC-2004',
        latitude: 13.0213,
        longitude: 80.2231,
        personnelCount: 2,
        etaMinutes: 1,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'HAZMAT-01',
        callSign: 'Hazmat Containment Unit 01',
        unitType: 'HAZMAT',
        status: 'AVAILABLE',
        assignedIncidentId: null,
        latitude: 13.0827,
        longitude: 80.2707,
        personnelCount: 6,
        etaMinutes: 8,
        lastUpdated: new Date().toISOString()
    }
];

// Generate TypeScript output file
const code = `import {
    RawReport,
    UnifiedIncident,
    ResponseUnit,
    AuditLogEntry,
    OperatorUser
} from '../types';

// Default Region Geographic Anchors: Main Disaster Dataset (Chennai)
export const CHENNAI_LAT = 12.9600;
export const CHENNAI_LNG = 80.1800;

export const VELACHERY_LAT = 12.9796;
export const VELACHERY_LNG = 80.2185;

export const TAMBARAM_LAT = 12.9280;
export const TAMBARAM_LNG = 80.1220;

export const MEDAVAKKAM_LAT = 12.9200;
export const MEDAVAKKAM_LNG = 80.1884;

export const SAIDAPET_LAT = 13.0213;
export const SAIDAPET_LNG = 80.2231;

// Operator Profiles
export const DEMO_OPERATORS: OperatorUser[] = [
    {
        id: 'OP-104',
        name: 'Marcus Vance',
        role: 'OPERATOR',
        consoleNumber: 'Desk #4 - Emergency Intake',
        shift: 'DAY',
        badgeNumber: 'BDG-9821',
        stationName: 'Disaster CAD Dispatch Center'
    },
    {
        id: 'SUP-01',
        name: 'Sarah Jenkins',
        role: 'SUPERVISOR',
        consoleNumber: 'Command Console Alpha',
        shift: 'DAY',
        badgeNumber: 'BDG-4402',
        stationName: 'Global Incident Coordination Post #1'
    },
    {
        id: 'DISP-22',
        name: 'Alex Rivera',
        role: 'RESPONDER',
        consoleNumber: 'Tactical Radio Dispatch 2',
        shift: 'DAY',
        badgeNumber: 'BDG-7104',
        stationName: 'Rapid Response Emergency Operations'
    },
    {
        id: 'ADM-01',
        name: 'Elena Rostova',
        role: 'ADMIN',
        consoleNumber: 'System Operations Console',
        shift: 'DAY',
        badgeNumber: 'BDG-0012',
        stationName: 'Emergency IT & Telemetry Center'
    }
];

// ===========================================================================
// MAIN DATASET INGESTED INCIDENTS (Chennai Disaster Operations Zone)
// ===========================================================================
export const INITIAL_INCIDENTS: UnifiedIncident[] = ${JSON.stringify(incidents, null, 4)};

// ===========================================================================
// MAIN DATASET INGESTED REPORTS (SMS, Twitter, WhatsApp & Audio Calls)
// ===========================================================================
export const INITIAL_REPORTS: RawReport[] = ${JSON.stringify(allReports, null, 4)};

// ===========================================================================
// EMERGENCY RESPONSE UNITS (Stationed at Main Dataset Coordinates)
// ===========================================================================
export const INITIAL_UNITS: ResponseUnit[] = ${JSON.stringify(units, null, 4)};

// Audit Trail
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: 'LOG-001',
        timestamp: '2026-10-07T08:20:00Z',
        actionType: 'INCIDENT_CREATED',
        userId: 'ADM-01',
        userRole: 'ADMIN',
        userName: 'Elena Rostova',
        summary: 'Ingested main disaster dataset: sms_helpline.csv, twitter_feed.csv, whatsapp_community.json, and audio calls into CAD registry.',
        incidentId: 'INC-2001',
        details: { totalReports: ${allReports.length}, totalIncidents: 4 }
    }
];
`;

const outPath = path.join(__dirname, '../src/mock/initialData.ts');
fs.writeFileSync(outPath, code, 'utf8');
console.log('Successfully wrote main dataset to ' + outPath);
console.log('Total incidents:', incidents.length);
console.log('Total reports:', allReports.length);
