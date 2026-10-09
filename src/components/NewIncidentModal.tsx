import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import {
    IncidentCategory,
    SeverityLevel,
    LocationAccuracy,
    RawReport,
    UnifiedIncident,
    IncidentMatch,
    getCategoryDisplayLabel
} from '../types';
import {
    PlusCircle,
    X,
    PhoneCall,
    MapPin,
    AlertTriangle,
    FileText,
    Users,
    Activity,
    Compass,
    Sparkles,
    CheckCircle2,
    ShieldAlert,
    HelpCircle,
    Globe,
    Loader2,
    Building2
} from 'lucide-react';
import { PossibleDuplicateModal } from './PossibleDuplicateModal';
import { PlaceResult } from '../types/location';
import { searchPlaces } from '../services/geocodingService';

interface NewIncidentModalProps {
    onClose: () => void;
    onSelectIncident?: (incident: UnifiedIncident) => void;
    onInspectReport?: (report: RawReport) => void;
}

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
    onClose,
    onSelectIncident,
    onInspectReport
}) => {
    const {
        ingestNewReport,
        matchReportAgainstIncidents,
        attachReportToIncident,
        createIncidentFromReport,
        incidents
    } = useEmergency();

    // Auto-generated fields
    const [reportId] = useState<string>(() => `REP-${Math.floor(1050 + Math.random() * 8900)}`);
    const [receivedTime] = useState<string>(() => new Date().toISOString());

    // Operator input fields - Defaulted to Andhra Pradesh, India 🇮🇳
    const [callerName, setCallerName] = useState<string>('Kalyan Chakravarthy');
    const [callerPhone, setCallerPhone] = useState<string>('+91 98491 55220');
    const [category, setCategory] = useState<IncidentCategory>('ROAD_ACCIDENT');
    const [country, setCountry] = useState<string>('India');
    const [state, setState] = useState<string>('Andhra Pradesh');
    const [city, setCity] = useState<string>('Vijayawada');
    const [timeZone, setTimeZone] = useState<string>('IST (UTC+5:30)');
    const [locationAddress, setLocationAddress] = useState<string>('Benz Circle, Bandar Road');
    const [landmark, setLandmark] = useState<string>('Near Benz Circle Flyover Pillar 24');
    const [latitude, setLatitude] = useState<number>(16.5082);
    const [longitude, setLongitude] = useState<number>(80.6450);
    const [locationAccuracy, setLocationAccuracy] = useState<LocationAccuracy>('EXACT_GPS');
    const [situationDescription, setSituationDescription] = useState<string>(
        'Two passenger vehicles collided with a commercial delivery van on Benz Circle flyover descent. Fuel leaking, road blocked.'
    );
    const [affectedPeople, setAffectedPeople] = useState<number>(4);
    const [severity, setSeverity] = useState<SeverityLevel>('CRITICAL');
    const [additionalNotes, setAdditionalNotes] = useState<string>('Caller sounds anxious, bystander administering first aid at scene.');

    // Workflow state: 'FORM' | 'POSSIBLE_DUPLICATE' | 'NO_MATCH_CONFIRM'
    const [workflowStep, setWorkflowStep] = useState<'FORM' | 'POSSIBLE_DUPLICATE' | 'NO_MATCH_CONFIRM'>('FORM');
    const [submittedReport, setSubmittedReport] = useState<RawReport | null>(null);
    const [detectedMatches, setDetectedMatches] = useState<IncidentMatch[]>([]);

    // Places Autocomplete & Single Source of Truth State
    const [placeSuggestions, setPlaceSuggestions] = useState<PlaceResult[]>([]);
    const [isSearchingPlaces, setIsSearchingPlaces] = useState<boolean>(false);
    const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState<boolean>(false);
    const [verifiedPlace, setVerifiedPlace] = useState<PlaceResult | null>(null);
    const placeDebounceTimer = React.useRef<any>(null);

    const handleLocationAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocationAddress(val);
        setVerifiedPlace(null);

        if (placeDebounceTimer.current) {
            clearTimeout(placeDebounceTimer.current);
        }

        if (val.trim().length < 2) {
            setPlaceSuggestions([]);
            setIsPlaceDropdownOpen(false);
            return;
        }

        placeDebounceTimer.current = setTimeout(async () => {
            setIsSearchingPlaces(true);
            try {
                const res = await searchPlaces(val);
                setPlaceSuggestions(res.results);
                setIsPlaceDropdownOpen(res.results.length > 0);
            } catch {
                setPlaceSuggestions([]);
            } finally {
                setIsSearchingPlaces(false);
            }
        }, 320);
    };

    const handleSelectPlaceSuggestion = (place: PlaceResult) => {
        setVerifiedPlace(place);
        setLocationAddress(place.name || place.formattedAddress);
        setLatitude(place.latitude);
        setLongitude(place.longitude);
        setLocationAccuracy(place.accuracy);

        if (place.addressDetails.locality) {
            setCity(place.addressDetails.locality);
        }
        if (place.addressDetails.state) {
            setState(place.addressDetails.state);
        }
        if (place.addressDetails.country) {
            setCountry(place.addressDetails.country);
        }
        if (place.addressDetails.road || place.addressDetails.neighbourhood) {
            setLandmark(`${place.addressDetails.road || ''} ${place.addressDetails.neighbourhood ? `(${place.addressDetails.neighbourhood})` : ''}`.trim());
        }

        setPlaceSuggestions([]);
        setIsPlaceDropdownOpen(false);
    };

    // Worldwide scenario quick test presets
    const loadPreset = (presetType: 'AP_VIJAYAWADA_DUP' | 'AP_VIZAG_DUP' | 'UK_LONDON_DUP' | 'JP_TOKYO_DUP' | 'US_SF_HAZMAT' | 'AU_SYDNEY_SOLO') => {
        if (presetType === 'AP_VIJAYAWADA_DUP') {
            setCategory('ROAD_ACCIDENT');
            setCountry('India');
            setState('Andhra Pradesh');
            setCity('Vijayawada');
            setTimeZone('IST (UTC+5:30)');
            setLocationAddress('Benz Circle Flyover Descent, MG Road');
            setLandmark('Opposite Jyothi Mahal Junction');
            setLatitude(16.5085);
            setLongitude(80.6452);
            setLocationAccuracy('EXACT_GPS');
            setCallerName('Kalyan Chakravarthy');
            setCallerPhone('+91 98491 55220');
            setSituationDescription('Major crash on Benz Circle flyover. Overturned truck blocking traffic, multiple passengers injured.');
            setAffectedPeople(4);
            setSeverity('CRITICAL');
            setAdditionalNotes('Matches active Vijayawada incident INC-1001 (~92% similarity).');
        } else if (presetType === 'AP_VIZAG_DUP') {
            setCategory('FLOOD');
            setCountry('India');
            setState('Andhra Pradesh');
            setCity('Visakhapatnam');
            setTimeZone('IST (UTC+5:30)');
            setLocationAddress('RK Beach Road Promenade, Near Submarine Museum');
            setLandmark('RK Beach Pillar 12');
            setLatitude(17.7120);
            setLongitude(83.3245);
            setLocationAccuracy('EXACT_GPS');
            setCallerName('Lakshmi Prasanna');
            setCallerPhone('+91 94401 22899');
            setSituationDescription('Severe surge flooding spilling over RK Beach road. Storm drains submerged, wave intrusion.');
            setAffectedPeople(15);
            setSeverity('HIGH');
            setAdditionalNotes('Matches active Vizag coastal flood INC-1002 (~88% similarity).');
        } else if (presetType === 'UK_LONDON_DUP') {
            setCategory('FIRE');
            setCountry('United Kingdom');
            setState('England');
            setCity('London');
            setTimeZone('GMT (UTC+0:00)');
            setLocationAddress('Oxford Street & Regent St Junction, West End');
            setLandmark('Near Oxford Circus Underground Station');
            setLatitude(51.5158);
            setLongitude(-0.1415);
            setLocationAccuracy('EXACT_GPS');
            setCallerName('Oliver Smith');
            setCallerPhone('+44 20 7946 0912');
            setSituationDescription('Heavy smoke billowing from second-floor retail store window on Oxford St. Evacuation in progress.');
            setAffectedPeople(12);
            setSeverity('CRITICAL');
            setAdditionalNotes('Matches active London incident INC-1004 (~89% similarity).');
        } else if (presetType === 'JP_TOKYO_DUP') {
            setCategory('EARTHQUAKE_SEISMIC');
            setCountry('Japan');
            setState('Kanto');
            setCity('Tokyo');
            setTimeZone('JST (UTC+9:00)');
            setLocationAddress('Shibuya Crossing, Dogenzaka 2-chome');
            setLandmark('Near Hachiko Memorial Statue');
            setLatitude(35.6598);
            setLongitude(139.7008);
            setLocationAccuracy('EXACT_GPS');
            setCallerName('Kenji Tanaka');
            setCallerPhone('+81 3 5555 0143');
            setSituationDescription('Strong seismic tremor felt at Shibuya crossing. Pedestrian stampede, shattered glass on sidewalk.');
            setAffectedPeople(25);
            setSeverity('HIGH');
            setAdditionalNotes('Matches active Tokyo seismic incident INC-1005 (~85% similarity).');
        } else if (presetType === 'US_SF_HAZMAT') {
            setCategory('HAZMAT_CHEMICAL');
            setCountry('United States');
            setState('California');
            setCity('San Francisco');
            setTimeZone('PST (UTC-8:00)');
            setLocationAddress('4th Street & Mission Bay Blvd');
            setLandmark('Mission Bay Bio-research corridor');
            setLatitude(37.7712);
            setLongitude(-122.3920);
            setLocationAccuracy('EXACT_GPS');
            setCallerName('Sarah Jenkins');
            setCallerPhone('+1 415 555 0198');
            setSituationDescription('Yellow vapor cloud emanating from storage facility pipe valve. Pungent chemical odor.');
            setAffectedPeople(8);
            setSeverity('CRITICAL');
            setAdditionalNotes('Matches active SF Hazmat incident INC-1008 (~91% similarity).');
        } else if (presetType === 'AU_SYDNEY_SOLO') {
            setCategory('NATURAL_DISASTER');
            setCountry('Australia');
            setState('New South Wales');
            setCity('Sydney');
            setTimeZone('AEST (UTC+10:00)');
            setLocationAddress('Blue Mountains Escarpment, Katoomba');
            setLandmark('Near Three Sisters lookout point');
            setLatitude(-33.7295);
            setLongitude(150.3116);
            setLocationAccuracy('APPROXIMATE');
            setCallerName('Liam Patterson');
            setCallerPhone('+61 2 9876 5432');
            setSituationDescription('Dense bushfire smoke spotted across Katoomba valley ridge line. Rapidly moving upslope.');
            setAffectedPeople(0);
            setSeverity('HIGH');
            setAdditionalNotes('Solo incident in Australia - 0% active match, will spawn new unified incident.');
        }
    };

    // Form submission triggers duplicate matching engine
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Ingest raw report into system store
        const newReport = ingestNewReport({
            sourceType: 'PHONE_CALL',
            sourceName: 'Helpline CAD Operator Console',
            reporterName: callerName,
            contactNumber: callerPhone,
            category,
            country,
            state,
            city,
            timeZone,
            locationName: locationAddress,
            landmark,
            latitude: Number(latitude),
            longitude: Number(longitude),
            locationAccuracy,
            rawText: situationDescription,
            affectedPeople: Number(affectedPeople) || 0,
            aiSuggestedSeverity: severity,
            notes: additionalNotes.trim() ? [additionalNotes.trim()] : []
        });

        setSubmittedReport(newReport);

        // 2. Perform duplicate incident detection against active incidents using Haversine math
        const matches = matchReportAgainstIncidents({
            id: newReport.id,
            category: newReport.category,
            locationName: newReport.locationName,
            landmark: newReport.landmark,
            latitude: newReport.latitude,
            longitude: newReport.longitude,
            timestamp: newReport.timestamp,
            rawText: newReport.rawText,
            affectedPeople: newReport.affectedPeople
        });

        // Check if top match has confidence >= 40%
        if (matches.length > 0 && matches[0].matchConfidence >= 40) {
            setDetectedMatches(matches);
            setWorkflowStep('POSSIBLE_DUPLICATE');
        } else {
            setDetectedMatches(matches);
            setWorkflowStep('NO_MATCH_CONFIRM');
        }
    };

    // Operator Action A: Attach to existing incident
    const handleAttach = (repId: string, incidentId: string, notes?: string) => {
        attachReportToIncident(repId, incidentId, notes);
        const target = incidents.find(i => i.id === incidentId);
        if (target && onSelectIncident) {
            onSelectIncident(target);
        }
        onClose();
    };

    // Operator Action B: Create new independent incident
    const handleCreateNew = (repId: string) => {
        const newInc = createIncidentFromReport(repId);
        if (onSelectIncident) {
            onSelectIncident(newInc);
        }
        onClose();
    };

    // Operator Action C: Review details
    const handleReviewDetails = (rep: RawReport, inc: UnifiedIncident) => {
        if (onInspectReport) {
            onInspectReport(rep);
        } else if (onSelectIncident) {
            onSelectIncident(inc);
        }
        onClose();
    };

    // If duplicate candidate detected, render PossibleDuplicateModal
    if (workflowStep === 'POSSIBLE_DUPLICATE' && submittedReport && detectedMatches.length > 0) {
        const topIncident = incidents.find(i => i.id === detectedMatches[0].incidentId) || incidents[0];
        return (
            <PossibleDuplicateModal
                report={submittedReport}
                match={detectedMatches[0]}
                targetIncident={topIncident}
                allMatches={detectedMatches}
                allActiveIncidents={incidents}
                onAttach={handleAttach}
                onCreateNewIncident={handleCreateNew}
                onReviewDetails={handleReviewDetails}
                onClose={onClose}
            />
        );
    }

    // If no duplicate matches found, show clear confirmation
    if (workflowStep === 'NO_MATCH_CONFIRM' && submittedReport) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm select-none">
                <div className="bg-white border border-sky-400/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.30)] p-6 space-y-4">
                    <div className="flex items-center gap-3 text-sky-700">
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Duplicate Analysis Complete</h3>
                            <p className="text-xs text-slate-500">No active incidents matched this call above 40% similarity.</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-sky-50/40 border border-sky-400/30 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500 font-mono">
                            <span>Report ID:</span>
                            <span className="text-slate-900 font-bold">{submittedReport.id}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Region:</span>
                            <span className="text-sky-700 font-mono font-semibold">🌍 {submittedReport.city ? `${submittedReport.city}, ` : ''}{submittedReport.country || 'India'}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Location:</span>
                            <span className="text-slate-800 font-medium">{submittedReport.locationName}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-mono">
                            <span>GPS:</span>
                            <span className="text-slate-700">{submittedReport.latitude.toFixed(4)}, {submittedReport.longitude.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-mono">
                            <span>Category:</span>
                            <span className="text-sky-700 font-bold">{submittedReport.category}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 font-mono">
                            <span>Suggested Severity:</span>
                            <span className="text-amber-700 font-bold">{submittedReport.aiSuggestedSeverity}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setWorkflowStep('FORM')}
                            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                        >
                            Back to Form
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCreateNew(submittedReport.id)}
                            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition-all"
                        >
                            <PlusCircle className="w-4 h-4" />
                            Create New Unified Incident
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default: Initial Form View
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm select-none overflow-y-auto">
            <div className="bg-white border border-sky-400/30 rounded-2xl w-full max-w-3xl overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.30)] flex flex-col my-auto">
                
                {/* Header Banner */}
                <div className="p-4 sm:p-5 bg-sky-50/70 border-b border-sky-400/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-sky-100/80 border border-sky-400/30 text-sky-700 shadow-sm">
                            <PhoneCall className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900 tracking-wide">
                                    New Incoming Emergency Report
                                </h2>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-400/30 font-semibold">
                                    {reportId}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                                Global Worldwide Intake • Default: Andhra Pradesh 🇮🇳 • Automated Haversine Duplicate Analysis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-sky-100/60 transition-colors"
                        title="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Quick Worldwide Scenario Presets Strip */}
                <div className="px-5 py-2.5 bg-sky-50/30 border-b border-sky-400/20 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                    <span className="text-slate-600 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                        Worldwide Test Presets:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => loadPreset('AP_VIJAYAWADA_DUP')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="Vijayawada, AP accident (Duplicate match for INC-1001)"
                        >
                            🇮🇳 Vijayawada Dup
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset('AP_VIZAG_DUP')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="Visakhapatnam, AP coastal flood (Duplicate match for INC-1002)"
                        >
                            🇮🇳 Vizag Flood Dup
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset('UK_LONDON_DUP')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="London, UK retail fire (Duplicate match for INC-1004)"
                        >
                            🇬🇧 London Fire Dup
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset('JP_TOKYO_DUP')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="Tokyo, Japan seismic tremor (Duplicate match for INC-1005)"
                        >
                            🇯🇵 Tokyo Seismic
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset('US_SF_HAZMAT')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="San Francisco, USA Hazmat (Duplicate match for INC-1008)"
                        >
                            🇺🇸 SF Hazmat
                        </button>
                        <button
                            type="button"
                            onClick={() => loadPreset('AU_SYDNEY_SOLO')}
                            className="px-2 py-0.5 rounded bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-sky-400/30 text-[10px] font-medium shadow-sm transition-colors"
                            title="Sydney, Australia solo wildfire (0% match, new incident)"
                        >
                            🇦🇺 Sydney Solo
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs max-h-[calc(85vh-150px)] overflow-y-auto">
                    
                    {/* Row 1: Caller Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Caller Name:
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Ramesh Naidu"
                                value={callerName}
                                onChange={e => setCallerName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Caller Phone Number:
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. +91 98491 55220"
                                value={callerPhone}
                                onChange={e => setCallerPhone(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-mono shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Row 2: Worldwide Region (Country, State/Province, City, Timezone) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-sky-50/40 border border-sky-400/30">
                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                🌍 Country:
                            </label>
                            <input
                                type="text"
                                placeholder="India, USA, UK, Japan..."
                                value={country}
                                onChange={e => setCountry(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                State / Province:
                            </label>
                            <input
                                type="text"
                                placeholder="Andhra Pradesh, England..."
                                value={state}
                                onChange={e => setState(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                City / Municipality:
                            </label>
                            <input
                                type="text"
                                placeholder="Vijayawada, London..."
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Time Zone:
                            </label>
                            <input
                                type="text"
                                placeholder="IST, GMT, JST, EST..."
                                value={timeZone}
                                onChange={e => setTimeZone(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-mono text-[11px] shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Row 3: Incident Type & Severity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Incident Type:
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value as IncidentCategory)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-medium shadow-sm"
                            >
                                <option value="ROAD_ACCIDENT">Road Accident</option>
                                <option value="FIRE">Fire / Structural</option>
                                <option value="FLOOD">Flood</option>
                                <option value="HEAVY_RAIN">Heavy Rain</option>
                                <option value="BUILDING_EMERGENCY">Building Emergency</option>
                                <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
                                <option value="MISSING_PERSON">Missing Person</option>
                                <option value="NATURAL_DISASTER">Natural Disaster</option>
                                <option value="EARTHQUAKE_SEISMIC">Earthquake / Seismic</option>
                                <option value="HAZMAT_CHEMICAL">Hazmat / Chemical</option>
                                <option value="OTHER">Other Emergency</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Severity (Strictly 3 Levels - ZERO GREEN):
                            </label>
                            <select
                                value={severity}
                                onChange={e => setSeverity(e.target.value as SeverityLevel)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-bold shadow-sm"
                            >
                                <option value="CRITICAL">🔴 Critical / Severe (Red Zone)</option>
                                <option value="HIGH">🟠 High Risk (Orange Zone)</option>
                                <option value="MEDIUM">🟡 Moderate Risk (Yellow Zone)</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Location / Address & Landmark with Places Autocomplete */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="relative">
                            <label className="text-slate-700 font-semibold flex items-center justify-between mb-1">
                                <span>Location / Street Address (Places Autocomplete):</span>
                                {isSearchingPlaces && (
                                    <span className="text-[10px] text-sky-600 font-mono flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                                    </span>
                                )}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Type real place, street, junction or city..."
                                value={locationAddress}
                                onChange={handleLocationAddressChange}
                                onFocus={() => placeSuggestions.length > 0 && setIsPlaceDropdownOpen(true)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm text-xs"
                            />

                            {/* Autocomplete Dropdown */}
                            {isPlaceDropdownOpen && placeSuggestions.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-sky-400/30 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                                    <div className="p-2 bg-sky-50 text-[10px] font-mono font-bold text-sky-800">
                                        SELECT VERIFIED PLACE ({placeSuggestions.length})
                                    </div>
                                    {placeSuggestions.map((p, idx) => (
                                        <div
                                            key={p.placeId + idx}
                                            onClick={() => handleSelectPlaceSuggestion(p)}
                                            className="p-2.5 hover:bg-sky-50 cursor-pointer transition-colors space-y-0.5"
                                        >
                                            <div className="flex items-center justify-between font-bold text-slate-900">
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                    <span>{p.name}</span>
                                                </span>
                                                <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                                                    {p.placeType}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">{p.formattedAddress}</p>
                                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                                                {p.addressDetails.locality && <span>{p.addressDetails.locality}</span>}
                                                {p.addressDetails.state && <span>• {p.addressDetails.state}</span>}
                                                {p.matchedProperty && (
                                                    <span className="text-emerald-600 font-bold ml-auto flex items-center gap-0.5">
                                                        <Building2 className="w-3 h-3" /> Facility Match
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Verified Place Status Badge */}
                            {verifiedPlace && (
                                <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>GPS Lock: <strong>{verifiedPlace.latitude.toFixed(4)}, {verifiedPlace.longitude.toFixed(4)}</strong></span>
                                    </div>
                                    <span className="font-bold text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                        {verifiedPlace.accuracy}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Landmark / Identifiable Point:
                            </label>
                            <input
                                type="text"
                                placeholder="Nearby identifiable point or junction"
                                value={landmark}
                                onChange={e => setLandmark(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm text-xs"
                            />
                        </div>
                    </div>

                    {/* Row 5: GPS Coordinates & Accuracy */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Latitude:
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                required
                                value={latitude}
                                onChange={e => setLatitude(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-mono shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Longitude:
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                required
                                value={longitude}
                                onChange={e => setLongitude(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-mono shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Location Accuracy:
                            </label>
                            <select
                                value={locationAccuracy}
                                onChange={e => setLocationAccuracy(e.target.value as LocationAccuracy)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                            >
                                <option value="EXACT_GPS">Exact GPS</option>
                                <option value="APPROXIMATE">Approximate Location</option>
                                <option value="UNKNOWN">Unknown / Text Derived</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 6: Situation Description & Number of Affected People */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-3">
                            <label className="text-slate-700 font-semibold block mb-1">
                                Situation Description:
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="Describe the scene as narrated by caller..."
                                value={situationDescription}
                                onChange={e => setSituationDescription(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 leading-relaxed shadow-sm"
                            ></textarea>
                        </div>

                        <div>
                            <label className="text-slate-700 font-semibold block mb-1">
                                Affected / Injured People:
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={affectedPeople}
                                onChange={e => setAffectedPeople(parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 font-mono shadow-sm"
                            />
                            <div className="text-[10px] text-slate-500 mt-1">
                                Estimated casualty count
                            </div>
                        </div>
                    </div>

                    {/* Row 7: Additional Operator Notes */}
                    <div>
                        <label className="text-slate-700 font-semibold block mb-1">
                            Additional Operator Intake Notes:
                        </label>
                        <input
                            type="text"
                            placeholder="Caller demeanor, roadway obstructions, hazards, triage notes..."
                            value={additionalNotes}
                            onChange={e => setAdditionalNotes(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white border border-sky-400/30 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-500 shadow-sm"
                        />
                    </div>

                    {/* Information Note */}
                    <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-400/30 text-[11px] text-slate-600 flex items-start gap-2 shadow-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <strong className="text-slate-800">Intake Protocol:</strong> Submitting will record the call and automatically analyze spatial (Haversine km), category, and temporal similarity against active incidents. It does NOT automatically dispatch emergency units.
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-sky-400/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all"
                        >
                            <Activity className="w-4 h-4" />
                            Submit & Analyze Duplicates
                        </button>
                    </div>

                </form>

            </div>
        </div>
    );
};
