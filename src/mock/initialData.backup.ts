
import {
    RawReport,
    UnifiedIncident,
    ResponseUnit,
    AuditLogEntry,
    OperatorUser,
    ResponseTeamAssignment
} from '../types';

// Default demonstration region: Andhra Pradesh, India 🇮🇳 (Lat: 15.9129, Lng: 79.7400)
export const AP_CENTER_LAT = 15.9129;
export const AP_CENTER_LNG = 79.7400;

// Worldwide Geographic Base Anchors
export const VJA_LAT = 16.5062;
export const VJA_LNG = 80.6480;

export const VIZAG_LAT = 17.7126;
export const VIZAG_LNG = 83.3228;

export const LONDON_LAT = 51.5152;
export const LONDON_LNG = -0.1419;

export const TOKYO_LAT = 35.6938;
export const TOKYO_LNG = 139.7034;

export const SF_LAT = 37.7749;
export const SF_LNG = -122.4194;

export const SYDNEY_LAT = -33.8688;
export const SYDNEY_LNG = 151.2093;

export const VANCOUVER_LAT = 49.2827;
export const VANCOUVER_LNG = -123.1207;

export const DEMO_OPERATORS: OperatorUser[] = [
    {
        id: 'OP-104',
        name: 'Marcus Vance',
        role: 'OPERATOR',
        consoleNumber: 'Desk #4 - Emergency Intake',
        shift: 'DAY',
        badgeNumber: 'BDG-9821',
        stationName: 'Andhra Pradesh Central CAD Dispatch Center'
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

export const INITIAL_REPORTS: RawReport[] = [
    // -------------------------------------------------------------
    // INC-1001: Vijayawada, Andhra Pradesh, India (Road Accident with 5 Duplicates)
    // -------------------------------------------------------------
    {
        id: 'REP-1001',
        sourceType: 'PHONE_CALL',
        sourceName: 'Hotline Intake Desk #401',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
        reporterName: 'Kalyan Rao',
        contactNumber: '+91 98480 12345',
        latitude: VJA_LAT + 0.002,
        longitude: VJA_LNG - 0.003,
        locationName: 'Benz Circle & MG Road Junction, Vijayawada',
        landmark: 'Near Pandit Nehru Bus Station Ramp',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Two vehicles crashed near Benz Circle and bus station entrance in Vijayawada. Severe head-on collision between commercial truck and passenger bus. People are trapped inside.',
        affectedPeople: 3,
        extractedTextKeywords: ['vehicles', 'crashed', 'bus', 'station', 'trapped', 'benz', 'circle'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 96,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 94,
        assignedIncidentId: 'INC-1001',
        isFlaggedMisleading: false,
        notes: ['Caller stated airbag deployment and steam hissing from front engine.']
    },
    {
        id: 'REP-1002',
        sourceType: 'PHONE_CALL',
        sourceName: 'Hotline Intake Desk #405',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
        reporterName: 'Lakshmi Narayana',
        contactNumber: '+91 94401 54321',
        latitude: VJA_LAT + 0.0025,
        longitude: VJA_LNG - 0.0028,
        locationName: 'Bus Station Terminal 2 Crosswalk, Benz Circle',
        landmark: 'Pandit Nehru Bus Station Clocktower',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'An accident happened right near Pandit Nehru bus station entrance. A second car got clipped and people are injured on the sidewalk.',
        affectedPeople: 4,
        extractedTextKeywords: ['accident', 'bus', 'station', 'injured', 'sidewalk'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 92,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 90,
        assignedIncidentId: 'INC-1001',
        isFlaggedMisleading: false,
        notes: ['Caller witnessed pedestrian struck by spinning vehicle bumper.']
    },
    {
        id: 'REP-1003',
        sourceType: 'PUBLIC_FEED',
        sourceName: 'Smart City TrafficCam Feed #AP-VJA-09',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
        latitude: VJA_LAT + 0.002,
        longitude: VJA_LNG - 0.003,
        locationName: 'Benz Circle Transit Flyover Corridor',
        landmark: 'Vijayawada Bus Station Flyover Approach',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Automated video sensor: Multiple stopped vehicles blocking 3 lanes at Benz Circle with black fluid spill and debris.',
        affectedPeople: 0,
        extractedTextKeywords: ['vehicles', 'blocking', 'bus', 'terminal', 'spill', 'debris'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 95,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 89,
        assignedIncidentId: 'INC-1001',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1004',
        sourceType: 'PHONE_CALL',
        sourceName: 'Police Emergency Line 112',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        reporterName: 'Suresh Babu',
        contactNumber: '+91 88850 99881',
        latitude: VJA_LAT + 0.003,
        longitude: VJA_LNG - 0.0025,
        locationName: 'MG Road Northbound Flyover Entry',
        landmark: 'Opposite State Bank Bhavan, Vijayawada',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Heavy traffic jam on MG Road near bus station due to major vehicle collision. Sirens audible and emergency ambulance is en-route.',
        affectedPeople: 0,
        extractedTextKeywords: ['crash', 'bus', 'station', 'smoke', 'sirens'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 90,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 85,
        assignedIncidentId: 'INC-1001',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1005',
        sourceType: 'PUBLIC_REPORT',
        sourceName: 'AP Emergency Citizen App #REP-992',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        reporterName: 'Ananya Reddy',
        contactNumber: '+91 91000 44221',
        latitude: VJA_LAT + 0.0018,
        longitude: VJA_LNG - 0.0032,
        locationName: 'Pandit Nehru Bus Terminal Pedestrian Gate',
        landmark: 'Bus Terminal Gate 3',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Citizen alert with photo: Major multi-car collision at bus station entrance. Traffic police has barricaded the lane.',
        affectedPeople: 0,
        extractedTextKeywords: ['collision', 'bus', 'station', 'police', 'barricaded'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 91,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 88,
        assignedIncidentId: 'INC-1001',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1002: Visakhapatnam, Andhra Pradesh, India (Coastal Flooding)
    // -------------------------------------------------------------
    {
        id: 'REP-1010',
        sourceType: 'PHONE_CALL',
        sourceName: 'Coastal Emergency Intake #412',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
        reporterName: 'Venkat Raman',
        contactNumber: '+91 99890 33441',
        latitude: VIZAG_LAT + 0.002,
        longitude: VIZAG_LNG - 0.001,
        locationName: 'RK Beach Road & Marine Promenade, Visakhapatnam',
        landmark: 'Near INS Kursura Submarine Museum',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Severe storm surge and flash flooding on RK Beach Road. Water depth rising over 3.5 feet, multiple passenger vehicles submerged.',
        affectedPeople: 6,
        extractedTextKeywords: ['storm', 'flooding', 'rk', 'beach', 'submerged', 'water'],
        category: 'FLOOD',
        aiSuggestedCategory: 'FLOOD',
        aiCategoryConfidence: 97,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 94,
        assignedIncidentId: 'INC-1002',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1011',
        sourceType: 'PHONE_CALL',
        sourceName: 'Helpline 112 Intake Desk',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
        reporterName: 'Priya Sharma',
        contactNumber: '+91 97010 88776',
        latitude: VIZAG_LAT + 0.003,
        longitude: VIZAG_LNG - 0.0015,
        locationName: 'RK Beach Submarine Promenade, Visakhapatnam',
        landmark: 'Submarine Museum East Car Park',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Torrential rain overflowed storm drains. Water has entered ground floor of tourist hotels and beachside restaurants.',
        affectedPeople: 4,
        extractedTextKeywords: ['torrential', 'drains', 'water', 'hotels', 'flooding'],
        category: 'FLOOD',
        aiSuggestedCategory: 'FLOOD',
        aiCategoryConfidence: 92,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 91,
        assignedIncidentId: 'INC-1002',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1012',
        sourceType: 'OFFICIAL_ALERT',
        sourceName: 'AP State Disaster Management (APSDMA)',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
        latitude: VIZAG_LAT + 0.001,
        longitude: VIZAG_LNG - 0.002,
        locationName: 'Visakhapatnam Urban Coastal Zone',
        landmark: 'Coastal Defense Station #04',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Authoritative Sensor Alert: Sea level surge + torrential rainfall caused flash flooding across Visakhapatnam coastal highway corridor.',
        affectedPeople: 0,
        extractedTextKeywords: ['sensor', 'surge', 'torrential', 'flash', 'flooding'],
        category: 'FLOOD',
        aiSuggestedCategory: 'FLOOD',
        aiCategoryConfidence: 99,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 96,
        assignedIncidentId: 'INC-1002',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1013',
        sourceType: 'PUBLIC_FEED',
        sourceName: 'Vizag Weather Watch Network',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        latitude: VIZAG_LAT + 0.0025,
        longitude: VIZAG_LNG - 0.0012,
        locationName: 'Beach Road Underpass & Harbor Approach',
        landmark: 'Near Coastal Battery',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Crowdsourced weather feed: Underpass completely submerged. Civil defense rescue boats deployed to evacuate trapped motorists.',
        affectedPeople: 2,
        extractedTextKeywords: ['underpass', 'submerged', 'rescue', 'boats', 'evacuate'],
        category: 'FLOOD',
        aiSuggestedCategory: 'FLOOD',
        aiCategoryConfidence: 94,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 89,
        assignedIncidentId: 'INC-1002',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1003: Vijayawada Nearby Solo Accident (~800m away, separate incident)
    // -------------------------------------------------------------
    {
        id: 'REP-1020',
        sourceType: 'PHONE_CALL',
        sourceName: 'Hotline Intake Desk #403',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        reporterName: 'Naveen Kumar',
        contactNumber: '+91 99080 66554',
        latitude: VJA_LAT + 0.007,
        longitude: VJA_LNG + 0.006,
        locationName: 'MG Road Flyover North Exit, Vijayawada',
        landmark: 'Opposite D-Address Mall, MG Road',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'A solo auto-rickshaw lost control and hit a concrete divider 800m north of Benz Circle on MG Road. Driver has minor arm injury, no fire, no road blockage.',
        affectedPeople: 1,
        extractedTextKeywords: ['solo', 'divider', 'concrete', 'minor', 'mg', 'road'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 89,
        aiSuggestedSeverity: 'MEDIUM',
        aiSeverityConfidence: 85,
        assignedIncidentId: 'INC-1003',
        isFlaggedMisleading: false,
        acknowledgedSeparate: true
    },

    // -------------------------------------------------------------
    // INC-1004: London, United Kingdom (Structure Fire)
    // -------------------------------------------------------------
    {
        id: 'REP-1025',
        sourceType: 'PHONE_CALL',
        sourceName: 'London Emergency Services 999 Desk',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
        reporterName: 'Oliver Smith',
        contactNumber: '+44 20 7946 0192',
        latitude: LONDON_LAT,
        longitude: LONDON_LNG,
        locationName: 'Oxford Street & Dean Street, Soho, London',
        landmark: 'Near Tottenham Court Road Station',
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        timeZone: 'GMT (UTC+0)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Dense black smoke and visible flames coming from third-story windows of commercial building on Oxford Street in London. Fire alarm ringing, people evacuating.',
        affectedPeople: 2,
        extractedTextKeywords: ['flames', 'smoke', 'commercial', 'oxford', 'street', 'london'],
        category: 'FIRE',
        aiSuggestedCategory: 'FIRE',
        aiCategoryConfidence: 96,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 93,
        assignedIncidentId: 'INC-1004',
        isFlaggedMisleading: false
    },
    {
        id: 'REP-1026',
        sourceType: 'PUBLIC_FEED',
        sourceName: 'London Fire Brigade Automated Dispatch Sensor',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 34 * 60000).toISOString(),
        latitude: LONDON_LAT + 0.001,
        longitude: LONDON_LNG - 0.0005,
        locationName: 'Dean Street Commercial Plaza, Soho',
        landmark: 'Dean Street Crosswalk',
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        timeZone: 'GMT (UTC+0)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Thermal sensor detection: Heavy structure fire active on Oxford St. LFB appliance en-route.',
        affectedPeople: 0,
        extractedTextKeywords: ['thermal', 'structure', 'fire', 'oxford'],
        category: 'FIRE',
        aiSuggestedCategory: 'FIRE',
        aiCategoryConfidence: 98,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 95,
        assignedIncidentId: 'INC-1004',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1005: Tokyo, Japan (Seismic High-Rise Emergency)
    // -------------------------------------------------------------
    {
        id: 'REP-1030',
        sourceType: 'PHONE_CALL',
        sourceName: 'Tokyo Metropolitan Emergency 119',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        reporterName: 'Kenji Sato',
        contactNumber: '+81 3 5555 0143',
        latitude: TOKYO_LAT,
        longitude: TOKYO_LNG,
        locationName: 'Shinjuku Central Business District, Tokyo',
        landmark: 'Tokyo Metropolitan Government Plaza',
        country: 'Japan',
        state: 'Kanto',
        city: 'Tokyo',
        timeZone: 'JST (UTC+9)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Tremor caused structural cracks in high-rise lobby glass. Elevators automatically stopped, 3 occupants trapped in elevator shaft.',
        affectedPeople: 3,
        extractedTextKeywords: ['tremor', 'cracks', 'elevators', 'shinjuku', 'tokyo'],
        category: 'BUILDING_EMERGENCY',
        aiSuggestedCategory: 'BUILDING_EMERGENCY',
        aiCategoryConfidence: 94,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 90,
        assignedIncidentId: 'INC-1005',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1006: Tirupati, Andhra Pradesh, India (Approximate Location)
    // -------------------------------------------------------------
    {
        id: 'REP-1035',
        sourceType: 'PHONE_CALL',
        sourceName: 'Tirumala Toll Operations Hotline',
        verificationState: 'UNVERIFIED',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        reporterName: 'Ramesh Varma',
        contactNumber: '+91 877 222 3456',
        latitude: 13.6288,
        longitude: 79.4192,
        locationName: 'Tirumala First Ghat Road Mile 12, Tirupati',
        landmark: 'Between Alipiri and Windmill Bend',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Tirupati',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'APPROXIMATE',
        rawText: 'Caller heard boulder rumbling and saw small rockfall on ghat road curve. Location estimated from mile marker description.',
        affectedPeople: 0,
        extractedTextKeywords: ['boulder', 'rockfall', 'ghat', 'road', 'tirupati'],
        category: 'NATURAL_DISASTER',
        aiSuggestedCategory: 'NATURAL_DISASTER',
        aiCategoryConfidence: 87,
        aiSuggestedSeverity: 'MEDIUM',
        aiSeverityConfidence: 80,
        assignedIncidentId: 'INC-1006',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1007: Guntur, Andhra Pradesh, India (Resolved Power Substation)
    // -------------------------------------------------------------
    {
        id: 'REP-1040',
        sourceType: 'OFFICIAL_ALERT',
        sourceName: 'APCPDCL Electrical Operations',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        latitude: 16.3067,
        longitude: 80.4365,
        locationName: 'Arundelpet Substation, Guntur',
        landmark: 'Guntur Power Grid Yard 2',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Guntur',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Substation transformer overload. Repairs concluded, grid restored to full operational capacity.',
        affectedPeople: 0,
        extractedTextKeywords: ['substation', 'transformer', 'overload', 'repaired'],
        category: 'POWER_GRID_OUTAGE',
        aiSuggestedCategory: 'POWER_GRID_OUTAGE',
        aiCategoryConfidence: 98,
        aiSuggestedSeverity: 'LOW',
        aiSeverityConfidence: 95,
        assignedIncidentId: 'INC-1007',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1008: San Francisco, USA (Hazmat Vapor Spill)
    // -------------------------------------------------------------
    {
        id: 'REP-1045',
        sourceType: 'PHONE_CALL',
        sourceName: 'SF 911 Communications',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        reporterName: 'Mark Chen',
        contactNumber: '+1 415 555 0192',
        latitude: SF_LAT,
        longitude: SF_LNG,
        locationName: '16th St & 4th Avenue, Mission Bay, San Francisco',
        landmark: 'Mission Bay Biotech Hub',
        country: 'United States',
        state: 'California',
        city: 'San Francisco',
        timeZone: 'PST (UTC-8)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Industrial solvent vapor leak from commercial laboratory vent. Strong ammonia odor, 2 workers coughing.',
        affectedPeople: 2,
        extractedTextKeywords: ['solvent', 'vapor', 'leak', 'ammonia', 'hazmat'],
        category: 'HAZMAT_CHEMICAL',
        aiSuggestedCategory: 'HAZMAT_CHEMICAL',
        aiCategoryConfidence: 95,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 91,
        assignedIncidentId: 'INC-1008',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // INC-1009: Sydney, Australia (Wildfire Corridor)
    // -------------------------------------------------------------
    {
        id: 'REP-1046',
        sourceType: 'PUBLIC_FEED',
        sourceName: 'NSW Rural Fire Service Telemetry',
        verificationState: 'VERIFIED',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        latitude: SYDNEY_LAT,
        longitude: SYDNEY_LNG,
        locationName: 'Western Sydney Highway Corridor, Sydney',
        landmark: 'Penrith Valley Ridge',
        country: 'Australia',
        state: 'New South Wales',
        city: 'Sydney',
        timeZone: 'AEST (UTC+10)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Rapidly spreading brushfire smoke column threatening Western highway corridor. High wind gusts registered.',
        affectedPeople: 0,
        extractedTextKeywords: ['brushfire', 'smoke', 'sydney', 'highway'],
        category: 'FIRE',
        aiSuggestedCategory: 'FIRE',
        aiCategoryConfidence: 93,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 89,
        assignedIncidentId: 'INC-1009',
        isFlaggedMisleading: false
    },

    // -------------------------------------------------------------
    // FRESH UNASSIGNED TEST INTAKE REPORTS
    // -------------------------------------------------------------
    // 1. REP-1048: HIGH MATCH FOR VIJAYAWADA INCIDENT INC-1001 (~92%)
    {
        id: 'REP-1048',
        sourceType: 'PHONE_CALL',
        sourceName: 'Emergency Hotline Desk #404',
        verificationState: 'UNVERIFIED',
        timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        reporterName: 'Nageswara Rao',
        contactNumber: '+91 98499 77112',
        latitude: VJA_LAT + 0.0022,
        longitude: VJA_LNG - 0.0029,
        locationName: 'Benz Circle Bus Station Entrance, Vijayawada',
        landmark: 'Pandit Nehru Bus Station Ramp',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Second call on Benz Circle accident: Two vehicles collided right near Pandit Nehru bus terminal. 3 injured people lying on sidewalk, need ambulance urgently!',
        affectedPeople: 3,
        extractedTextKeywords: ['vehicles', 'collided', 'bus', 'station', 'injured', 'benz', 'circle'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 94,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 92,
        assignedIncidentId: null,
        isFlaggedMisleading: false
    },

    // 2. REP-1049: HIGH MATCH FOR VIZAG FLOOD INCIDENT INC-1002 (~88%)
    {
        id: 'REP-1049',
        sourceType: 'PHONE_CALL',
        sourceName: 'Vizag Port Helpline',
        verificationState: 'UNVERIFIED',
        timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
        reporterName: 'Murali Krishna',
        contactNumber: '+91 891 255 4321',
        latitude: VIZAG_LAT + 0.0022,
        longitude: VIZAG_LNG - 0.0011,
        locationName: 'RK Beach Promenade & Marine Museum, Visakhapatnam',
        landmark: 'Submarine Museum East Side',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Water depth on RK Beach Road is rising rapidly past 3.5 feet. Cars are drifting in current near Submarine Museum promenade.',
        affectedPeople: 5,
        extractedTextKeywords: ['water', 'rk', 'beach', 'drifting', 'flooding'],
        category: 'FLOOD',
        aiSuggestedCategory: 'FLOOD',
        aiCategoryConfidence: 95,
        aiSuggestedSeverity: 'HIGH',
        aiSeverityConfidence: 90,
        assignedIncidentId: null,
        isFlaggedMisleading: false
    },

    // 3. REP-1052: HIGH MATCH FOR LONDON FIRE INCIDENT INC-1004 (~93%)
    {
        id: 'REP-1052',
        sourceType: 'PHONE_CALL',
        sourceName: 'London 999 Intake Desk',
        verificationState: 'UNVERIFIED',
        timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
        reporterName: 'Emily Watson',
        contactNumber: '+44 20 7123 4567',
        latitude: LONDON_LAT + 0.0008,
        longitude: LONDON_LNG - 0.0003,
        locationName: 'Oxford Street near Dean Street, Soho, London',
        landmark: 'Oxford St Retail Corner',
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        timeZone: 'GMT (UTC+0)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Another caller for Oxford Street Soho fire: Thick black smoke pouring out of upper windows, shoppers running outside.',
        affectedPeople: 1,
        extractedTextKeywords: ['oxford', 'street', 'fire', 'smoke', 'soho'],
        category: 'FIRE',
        aiSuggestedCategory: 'FIRE',
        aiCategoryConfidence: 96,
        aiSuggestedSeverity: 'CRITICAL',
        aiSeverityConfidence: 92,
        assignedIncidentId: null,
        isFlaggedMisleading: false
    },

    // 4. REP-1050: REMOTE SOLO ACCIDENT 50 KM AWAY -> SHOULD RECOMMEND CREATING NEW INCIDENT!
    {
        id: 'REP-1050',
        sourceType: 'PHONE_CALL',
        sourceName: 'Rural Highway Patrol Transfer',
        verificationState: 'UNVERIFIED',
        timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
        reporterName: 'Bhanu Prakash',
        contactNumber: '+91 8812 234567',
        latitude: 16.7107,
        longitude: 81.0952,
        locationName: 'NH-16 Bypass near Eluru Rural Toll (50 km Northeast)',
        landmark: 'Eluru Canal Bridge',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Eluru',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        rawText: 'Solo vehicle skidded off the wet road into irrigation ditch 50 km outside Vijayawada near Eluru bypass. Driver has minor cuts, no road blockage.',
        affectedPeople: 1,
        extractedTextKeywords: ['skidded', 'ditch', 'bypass', 'eluru', 'solo'],
        category: 'ROAD_ACCIDENT',
        aiSuggestedCategory: 'ROAD_ACCIDENT',
        aiCategoryConfidence: 91,
        aiSuggestedSeverity: 'MEDIUM',
        aiSeverityConfidence: 85,
        assignedIncidentId: null,
        isFlaggedMisleading: false
    }
];

export const INITIAL_INCIDENTS: UnifiedIncident[] = [
    // 1. INC-1001: VIJAYAWADA, AP, INDIA (🔴 CRITICAL - 5 LINKED REPORTS)
    {
        id: 'INC-1001',
        title: 'Benz Circle & Pandit Nehru Bus Station Multi-Vehicle Collision',
        category: 'ROAD_ACCIDENT',
        severity: 'CRITICAL',
        status: 'RESPONSE_COORDINATED',
        latitude: VJA_LAT + 0.002,
        longitude: VJA_LNG - 0.003,
        locationDescription: 'Benz Circle & MG Road Corridor, Vijayawada',
        landmark: 'Pandit Nehru Bus Station Terminal 2',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Major high-impact collision between commercial box truck, passenger bus, and private vehicle at Benz Circle near bus station entrance. Engine fire, fuel spill, and trapped passengers.',
        createdTime: new Date(Date.now() - 48 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 5 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 48 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Marcus Vance',
        verifiedAt: new Date(Date.now() - 44 * 60000).toISOString(),
        childReportIds: ['REP-1001', 'REP-1002', 'REP-1003', 'REP-1004', 'REP-1005'],
        candidateReportIds: ['REP-1048'],
        victimEstCount: 7,
        affectedPeople: 7,
        hazmatInvolved: false,
        assignedUnitIds: ['ENG-12', 'MED-04', 'POLICE-10'],
        responseTeamAssignments: [
            {
                id: 'RTA-01',
                teamId: 'ENG-12',
                teamName: 'Heavy Rescue Engine 12',
                teamType: 'FIRE_RESCUE',
                incidentId: 'INC-1001',
                status: 'ON_SCENE',
                assignedAt: new Date(Date.now() - 35 * 60000).toISOString(),
                operatorNotes: 'Vehicle extrication required for driver side door.'
            },
            {
                id: 'RTA-02',
                teamId: 'MED-04',
                teamName: 'Vijayawada EMS Unit 04',
                teamType: 'MEDICAL',
                incidentId: 'INC-1001',
                status: 'ON_SCENE',
                assignedAt: new Date(Date.now() - 32 * 60000).toISOString(),
                operatorNotes: 'Triage priority: 3 critical, 4 moderate injuries.'
            },
            {
                id: 'RTA-03',
                teamId: 'POLICE-10',
                teamName: 'Traffic Police Unit 10',
                teamType: 'POLICE',
                incidentId: 'INC-1001',
                status: 'EN_ROUTE',
                assignedAt: new Date(Date.now() - 28 * 60000).toISOString(),
                operatorNotes: 'Perimeter closure on Benz Circle corridor.'
            }
        ],
        notes: [
            {
                id: 'NOTE-1',
                timestamp: new Date(Date.now() - 44 * 60000).toISOString(),
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Human verification completed: Verified 112 caller statements matching Smart City TrafficCam feed.'
            },
            {
                id: 'NOTE-2',
                timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
                authorId: 'SUP-01',
                authorRole: 'SUPERVISOR',
                text: 'Response coordinated: Heavy Rescue Engine 12, EMS Unit 04, and Traffic Police dispatched.'
            }
        ],
        timelineEvents: [
            {
                id: 'EVT-101',
                timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
                type: 'REPORT_RECEIVED',
                description: 'First report received from Kalyan Rao (REP-1001)',
                authorName: 'Operator Marcus Vance',
                reportId: 'REP-1001'
            },
            {
                id: 'EVT-102',
                timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
                type: 'DUPLICATE_DETECTED',
                description: 'Possible duplicate detected: REP-1002 (94% confidence match)',
                reportId: 'REP-1002'
            },
            {
                id: 'EVT-103',
                timestamp: new Date(Date.now() - 41 * 60000).toISOString(),
                type: 'REPORT_ATTACHED',
                description: 'Report REP-1002 attached to unified incident by operator',
                authorName: 'Operator Marcus Vance',
                reportId: 'REP-1002'
            },
            {
                id: 'EVT-104',
                timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
                type: 'REPORT_ATTACHED',
                description: 'Report REP-1003 (TrafficCam Feed) attached to incident',
                reportId: 'REP-1003'
            },
            {
                id: 'EVT-105',
                timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
                type: 'TEAM_COORDINATED',
                description: 'Response teams coordinated: Heavy Rescue Engine 12 and EMS Unit 04',
                authorName: 'Supervisor Sarah Jenkins',
                teamId: 'ENG-12'
            }
        ]
    },

    // 2. INC-1002: VISAKHAPATNAM, AP, INDIA (🟠 HIGH RISK - 4 LINKED REPORTS)
    {
        id: 'INC-1002',
        title: 'RK Beach Road & Coastal Marine Drive Flash Flooding',
        category: 'FLOOD',
        severity: 'HIGH',
        status: 'RESPONSE_COORDINATED',
        latitude: VIZAG_LAT + 0.002,
        longitude: VIZAG_LNG - 0.001,
        locationDescription: 'RK Beach Road Promenade, Visakhapatnam',
        landmark: 'Near INS Kursura Submarine Museum',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Severe coastal surge flooding along RK Beach Road in Visakhapatnam. Drainage overwhelmed, water over 3.5 ft deep with submerged cars.',
        createdTime: new Date(Date.now() - 65 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 10 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 65 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins',
        verifiedAt: new Date(Date.now() - 50 * 60000).toISOString(),
        childReportIds: ['REP-1010', 'REP-1011', 'REP-1012', 'REP-1013'],
        candidateReportIds: ['REP-1049'],
        victimEstCount: 12,
        affectedPeople: 12,
        hazmatInvolved: false,
        assignedUnitIds: ['DISASTER-01'],
        responseTeamAssignments: [
            {
                id: 'RTA-04',
                teamId: 'DISASTER-01',
                teamName: 'AP Coastal Disaster Rescue Boat 1',
                teamType: 'DISASTER_RESPONSE',
                incidentId: 'INC-1002',
                status: 'ON_SCENE',
                assignedAt: new Date(Date.now() - 48 * 60000).toISOString(),
                operatorNotes: 'Rescue boats evacuating hotel basements and stranded motorists.'
            }
        ],
        notes: [
            {
                id: 'NOTE-3',
                timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
                authorId: 'SUP-01',
                authorRole: 'SUPERVISOR',
                text: 'High tide alert: Storm surge confirmed by APSDMA automated tidal sensor.'
            }
        ],
        timelineEvents: [
            {
                id: 'EVT-201',
                timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
                type: 'REPORT_RECEIVED',
                description: 'First report received from Venkat Raman (REP-1010)',
                authorName: 'Operator Marcus Vance',
                reportId: 'REP-1010'
            },
            {
                id: 'EVT-202',
                timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
                type: 'TEAM_COORDINATED',
                description: 'Disaster response team coordinated: Coastal Rescue Boat 1',
                authorName: 'Supervisor Sarah Jenkins',
                teamId: 'DISASTER-01'
            }
        ]
    },

    // 3. INC-1003: VIJAYAWADA NEARBY SEPARATE INCIDENT (🟡 MODERATE RISK)
    {
        id: 'INC-1003',
        title: 'MG Road Flyover Concrete Barrier Collision',
        category: 'ROAD_ACCIDENT',
        severity: 'MEDIUM',
        status: 'IN_PROGRESS',
        latitude: VJA_LAT + 0.007,
        longitude: VJA_LNG + 0.006,
        locationDescription: 'MG Road Flyover North Exit, Vijayawada',
        landmark: 'Opposite D-Address Mall, MG Road',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Vijayawada',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Solo auto-rickshaw barrier strike 800m north of Benz Circle on MG Road. Driver has minor cuts, no fire, lane cleared.',
        createdTime: new Date(Date.now() - 20 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 15 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Marcus Vance',
        verifiedAt: new Date(Date.now() - 18 * 60000).toISOString(),
        childReportIds: ['REP-1020'],
        candidateReportIds: [],
        victimEstCount: 1,
        affectedPeople: 1,
        hazmatInvolved: false,
        assignedUnitIds: ['POLICE-80'],
        notes: [
            {
                id: 'NOTE-4',
                timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Separate event confirmation: Confirmed distinct solo barrier accident, unrelated to Benz Circle pileup.'
            }
        ],
        timelineEvents: [
            {
                id: 'EVT-301',
                timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
                type: 'REPORT_RECEIVED',
                description: 'Solo crash report received from Naveen Kumar (REP-1020)',
                authorName: 'Operator Marcus Vance',
                reportId: 'REP-1020'
            }
        ]
    },

    // 4. INC-1004: LONDON, UNITED KINGDOM (🔴 CRITICAL - STRUCTURE FIRE)
    {
        id: 'INC-1004',
        title: 'Oxford Street & Soho Commercial Structure Fire',
        category: 'FIRE',
        severity: 'CRITICAL',
        status: 'RESPONSE_COORDINATED',
        latitude: LONDON_LAT,
        longitude: LONDON_LNG,
        locationDescription: 'Oxford St & Dean St, Soho, London',
        landmark: 'Near Tottenham Court Road Station',
        country: 'United Kingdom',
        state: 'England',
        city: 'London',
        timeZone: 'GMT (UTC+0)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Major three-alarm commercial structure fire in Soho retail building. Heavy black smoke billowing across Oxford Street corridor.',
        createdTime: new Date(Date.now() - 40 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 12 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 40 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Marcus Vance',
        verifiedAt: new Date(Date.now() - 36 * 60000).toISOString(),
        childReportIds: ['REP-1025', 'REP-1026'],
        candidateReportIds: ['REP-1052'],
        victimEstCount: 2,
        affectedPeople: 2,
        hazmatInvolved: false,
        assignedUnitIds: ['ENG-05'],
        responseTeamAssignments: [
            {
                id: 'RTA-05',
                teamId: 'ENG-05',
                teamName: 'London Fire Brigade Ladder 5',
                teamType: 'FIRE_RESCUE',
                incidentId: 'INC-1004',
                status: 'ON_SCENE',
                assignedAt: new Date(Date.now() - 32 * 60000).toISOString(),
                operatorNotes: 'Aerial ladder set up on Dean Street facade.'
            }
        ],
        notes: [
            {
                id: 'NOTE-5',
                timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'International dispatch coordinated with London Fire Brigade command.'
            }
        ]
    },

    // 5. INC-1005: TOKYO, JAPAN (🟠 HIGH RISK - HIGH-RISE SEISMIC)
    {
        id: 'INC-1005',
        title: 'Shinjuku High-Rise Seismic Emergency & Structural Cracks',
        category: 'BUILDING_EMERGENCY',
        severity: 'HIGH',
        status: 'VERIFIED',
        latitude: TOKYO_LAT,
        longitude: TOKYO_LNG,
        locationDescription: 'Shinjuku Central Business District, Tokyo',
        landmark: 'Tokyo Metropolitan Government Plaza',
        country: 'Japan',
        state: 'Kanto',
        city: 'Tokyo',
        timeZone: 'JST (UTC+9)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Elevator emergency following seismic tremor in Shinjuku commercial tower. Structural inspection underway.',
        createdTime: new Date(Date.now() - 30 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 8 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins',
        verifiedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        childReportIds: ['REP-1030'],
        candidateReportIds: [],
        victimEstCount: 3,
        affectedPeople: 3,
        hazmatInvolved: false,
        assignedUnitIds: ['MED-08'],
        notes: [
            {
                id: 'NOTE-6',
                timestamp: new Date(Date.now() - 24 * 60000).toISOString(),
                authorId: 'SUP-01',
                authorRole: 'SUPERVISOR',
                text: 'Tokyo Disaster Medical Assistance Team (DMAT) coordinated.'
            }
        ]
    },

    // 6. INC-1006: TIRUPATI, AP, INDIA (🟡 MODERATE RISK - APPROXIMATE LOCATION)
    {
        id: 'INC-1006',
        title: 'Tirumala First Ghat Road Landslide Warning',
        category: 'NATURAL_DISASTER',
        severity: 'MEDIUM',
        status: 'UNDER_VERIFICATION',
        latitude: 13.6288,
        longitude: 79.4192,
        locationDescription: 'Tirumala First Ghat Road Mile 12, Tirupati',
        landmark: 'Between Alipiri and Windmill Bend',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Tirupati',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'APPROXIMATE',
        summary: 'Ghat road rockfall caution: Minor loose boulders and debris reported along Ghat Road Mile 12 curve.',
        createdTime: new Date(Date.now() - 25 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 20 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        childReportIds: ['REP-1035'],
        candidateReportIds: [],
        victimEstCount: 0,
        affectedPeople: 0,
        hazmatInvolved: false,
        assignedUnitIds: [],
        notes: [
            {
                id: 'NOTE-7',
                timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Location approximate based on caller narrative. Patrol dispatched to verify exact coordinates.'
            }
        ]
    },

    // 7. INC-1007: GUNTUR, AP, INDIA (RESOLVED SUBSTATION)
    {
        id: 'INC-1007',
        title: 'Arundelpet Substation Transformer Breakdown (Resolved)',
        category: 'POWER_GRID_OUTAGE',
        severity: 'LOW',
        status: 'RESOLVED',
        latitude: 16.3067,
        longitude: 80.4365,
        locationDescription: 'Arundelpet Substation, Guntur',
        landmark: 'Guntur Power Grid Yard 2',
        country: 'India',
        state: 'Andhra Pradesh',
        city: 'Guntur',
        timeZone: 'IST (UTC+5:30)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Electrical transformer incident successfully repaired and tested. Power grid restored.',
        createdTime: new Date(Date.now() - 120 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 30 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 120 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 30 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Marcus Vance',
        verifiedAt: new Date(Date.now() - 110 * 60000).toISOString(),
        childReportIds: ['REP-1040'],
        candidateReportIds: [],
        victimEstCount: 0,
        affectedPeople: 0,
        hazmatInvolved: false,
        assignedUnitIds: [],
        notes: [
            {
                id: 'NOTE-8',
                timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
                authorId: 'OP-104',
                authorRole: 'OPERATOR',
                text: 'Resolved by operator. Power restore confirmed by APCPDCL telemetry.'
            }
        ]
    },

    // 8. INC-1008: SAN FRANCISCO, USA (🟠 HIGH RISK - HAZMAT LEAK)
    {
        id: 'INC-1008',
        title: 'Mission Bay Industrial Hazmat Vapor Leak',
        category: 'HAZMAT_CHEMICAL',
        severity: 'HIGH',
        status: 'VERIFIED',
        latitude: SF_LAT,
        longitude: SF_LNG,
        locationDescription: '16th St & 4th Avenue, Mission Bay, San Francisco',
        landmark: 'Mission Bay Biotech Hub',
        country: 'United States',
        state: 'California',
        city: 'San Francisco',
        timeZone: 'PST (UTC-8)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Chemical solvent vapor release from laboratory rooftop intake. Perimeter containment set up.',
        createdTime: new Date(Date.now() - 15 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 5 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Marcus Vance',
        verifiedAt: new Date(Date.now() - 12 * 60000).toISOString(),
        childReportIds: ['REP-1045'],
        candidateReportIds: [],
        victimEstCount: 2,
        affectedPeople: 2,
        hazmatInvolved: true,
        assignedUnitIds: ['HAZMAT-01'],
        notes: []
    },

    // 9. INC-1009: SYDNEY, AUSTRALIA (🟠 HIGH RISK - BUSHFIRE SPREAD)
    {
        id: 'INC-1009',
        title: 'Blue Mountains Wildfire Smoke Plume Alert',
        category: 'FIRE',
        severity: 'HIGH',
        status: 'RESPONSE_COORDINATED',
        latitude: SYDNEY_LAT,
        longitude: SYDNEY_LNG,
        locationDescription: 'Western Sydney Highway Corridor, Sydney',
        landmark: 'Penrith Valley Ridge',
        country: 'Australia',
        state: 'New South Wales',
        city: 'Sydney',
        timeZone: 'AEST (UTC+10)',
        locationAccuracy: 'EXACT_GPS',
        summary: 'Rapidly spreading brushfire smoke column threatening Western highway corridor with zero visibility.',
        createdTime: new Date(Date.now() - 10 * 60000).toISOString(),
        lastUpdatedTime: new Date(Date.now() - 2 * 60000).toISOString(),
        firstReportedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        lastUpdatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
        primaryOperatorId: 'OP-104',
        verifiedBy: 'Sarah Jenkins',
        verifiedAt: new Date(Date.now() - 8 * 60000).toISOString(),
        childReportIds: ['REP-1046'],
        candidateReportIds: [],
        victimEstCount: 0,
        affectedPeople: 0,
        hazmatInvolved: false,
        assignedUnitIds: [],
        notes: []
    }
];

export const INITIAL_UNITS: ResponseUnit[] = [
    {
        id: 'ENG-12',
        callSign: 'Rescue Engine 12',
        unitType: 'RESCUE',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-1001',
        latitude: VJA_LAT + 0.002,
        longitude: VJA_LNG - 0.003,
        personnelCount: 5,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'MED-04',
        callSign: 'Vijayawada EMS 04',
        unitType: 'MEDICAL',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-1001',
        latitude: VJA_LAT + 0.0025,
        longitude: VJA_LNG - 0.0028,
        personnelCount: 2,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'POLICE-10',
        callSign: 'Traffic Police 10',
        unitType: 'POLICE',
        status: 'EN_ROUTE',
        assignedIncidentId: 'INC-1001',
        latitude: VJA_LAT + 0.001,
        longitude: VJA_LNG - 0.002,
        personnelCount: 2,
        etaMinutes: 2,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'DISASTER-01',
        callSign: 'AP Coastal Rapid Rescue 1',
        unitType: 'DISASTER_RESPONSE',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-1002',
        latitude: VIZAG_LAT + 0.002,
        longitude: VIZAG_LNG - 0.001,
        personnelCount: 6,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'ENG-05',
        callSign: 'London Fire Ladder 5',
        unitType: 'FIRE',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-1004',
        latitude: LONDON_LAT,
        longitude: LONDON_LNG,
        personnelCount: 4,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'HAZMAT-01',
        callSign: 'SF Hazmat Taskforce 1',
        unitType: 'HAZMAT',
        status: 'ON_SCENE',
        assignedIncidentId: 'INC-1008',
        latitude: SF_LAT,
        longitude: SF_LNG,
        personnelCount: 6,
        etaMinutes: 0,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'MED-08',
        callSign: 'Tokyo DMAT Squad 8',
        unitType: 'MEDICAL',
        status: 'EN_ROUTE',
        assignedIncidentId: 'INC-1005',
        latitude: TOKYO_LAT,
        longitude: TOKYO_LNG,
        personnelCount: 3,
        etaMinutes: 3,
        lastUpdated: new Date().toISOString()
    },
    {
        id: 'POLICE-80',
        callSign: 'Vijayawada Patrol 80',
        unitType: 'POLICE',
        status: 'EN_ROUTE',
        assignedIncidentId: 'INC-1003',
        latitude: VJA_LAT + 0.007,
        longitude: VJA_LNG + 0.006,
        personnelCount: 2,
        etaMinutes: 2,
        lastUpdated: new Date().toISOString()
    }
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
    {
        id: 'AUD-9001',
        timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
        userId: 'SYS-INGEST',
        userName: 'Hotline Workstation #401',
        userRole: 'ADMIN',
        actionType: 'REPORT_INGESTED',
        reportId: 'REP-1001',
        summary: 'Incoming phone call ingested from Kalyan Rao regarding Road Accident at Benz Circle Vijayawada.',
        details: { caller: 'Kalyan Rao', location: 'Benz Circle, Vijayawada, AP' }
    },
    {
        id: 'AUD-9002',
        timestamp: new Date(Date.now() - 44 * 60000).toISOString(),
        userId: 'OP-104',
        userName: 'Operator Marcus Vance',
        userRole: 'OPERATOR',
        actionType: 'HUMAN_VERIFIED',
        incidentId: 'INC-1001',
        reportId: 'REP-1001',
        summary: 'Human verification granted for INC-1001 after comparing TrafficCam feed.',
        details: { previousStatus: 'NEW', newStatus: 'VERIFIED' }
    },
    {
        id: 'AUD-9003',
        timestamp: new Date(Date.now() - 41 * 60000).toISOString(),
        userId: 'OP-104',
        userName: 'Operator Marcus Vance',
        userRole: 'OPERATOR',
        actionType: 'REPORTS_MERGED',
        incidentId: 'INC-1001',
        reportId: 'REP-1002',
        summary: 'Duplicate call REP-1002 from Lakshmi Narayana attached to INC-1001 (Match confidence: 94%).',
        details: { confidence: 94 }
    },
    {
        id: 'AUD-9004',
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        userId: 'SUP-01',
        userName: 'Supervisor Sarah Jenkins',
        userRole: 'SUPERVISOR',
        actionType: 'TEAM_COORDINATED',
        incidentId: 'INC-1001',
        unitId: 'ENG-12',
        summary: 'Coordinated Rescue Engine 12 and EMS 04 to INC-1001.',
        details: { units: ['ENG-12', 'MED-04'] }
    }
];
