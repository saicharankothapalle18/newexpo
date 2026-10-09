import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import { useEmergency } from '../context/EmergencyContext';
import { UnifiedIncident, RawReport, RiskLevel } from '../types';
import { PlaceResult } from '../types/location';
import { searchPlaces } from '../services/geocodingService';
import {
    computeIncidentRiskZone,
    isIncidentZoneActive,
    getLocationAccuracyLabel,
    RISK_COLORS,
    getIncidentSituation,
    SituationLevel
} from '../utils/riskZone';
import {
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM,
    WORLDWIDE_LOCATION_PRESETS
} from '../utils/geo';
import { RiskSummaryWidget } from './RiskSummaryWidget';
import { ZoneInfoPanel } from './ZoneInfoPanel';
import {
    Layers,
    Compass,
    Globe,
    Search,
    MapPin,
    RotateCcw,
    ZoomIn,
    ZoomOut,
    Eye,
    ShieldAlert,
    Crosshair,
    X,
    CheckCircle2,
    AlertTriangle,
    Building2,
    Loader2,
    Info,
    Radio
} from 'lucide-react';
import { BASEMAP_CONFIGS, BasemapProvider } from '../utils/mapConfigs';

interface InteractiveMapProps {
    onSelectIncident: (incident: UnifiedIncident) => void;
    onSelectReport?: (report: RawReport) => void;
    fullscreen?: boolean;
    focusedIncident?: UnifiedIncident | null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
    onSelectIncident,
    onSelectReport,
    fullscreen = false,
    focusedIncident
}) => {
    const { incidents, reports, units, getCandidateLinksForReport } = useEmergency();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    // Active Basemap Provider (Defaults to Free Google Maps Standard Roadmap)
    const [activeBasemap, setActiveBasemap] = useState<BasemapProvider>('GOOGLE_ROADMAP');
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    // Selected zone for the Zone Information Panel (opened by clicking a risk circle)
    const [selectedZoneIncident, setSelectedZoneIncident] = useState<UnifiedIncident | null>(null);

    // Active risk filter (ALL, RED, ORANGE, YELLOW) - NO GREEN
    const [riskFilter, setRiskFilter] = useState<RiskLevel | 'ALL'>('ALL');

    // Tactical Layer Visibility Toggles
    const [showZones, setShowZones] = useState<boolean>(true);
    const [showReports, setShowReports] = useState<boolean>(true);
    const [showUnits, setShowUnits] = useState<boolean>(true);
    const [showCandidateVectors, setShowCandidateVectors] = useState<boolean>(true);
    const [showGisLayersMenu, setShowGisLayersMenu] = useState<boolean>(false);

    // Worldwide Navigation & Search State (Defaults to Main Dataset: Chennai)
    const [selectedPresetId, setSelectedPresetId] = useState<string>('CHENNAI_DATASET');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

    // Cursor GPS Coordinates
    const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);

    // --- ACCURATE LOCATION SEARCH & SINGLE SOURCE OF TRUTH STATE ---
    const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);
    const [disambiguationOptions, setDisambiguationOptions] = useState<PlaceResult[] | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

    // Dedicated marker reference for selected place (ensures clean removal of stale markers)
    const selectedPlaceMarkerRef = useRef<L.Marker | null>(null);
    const searchDebounceTimerRef = useRef<any>(null);

    // Active incidents with valid coordinates
    const activeIncidents = useMemo(() => incidents.filter(isIncidentZoneActive), [incidents]);

    // Initialize Leaflet Map Instance with Google Maps Basemap
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
            zoom: DEFAULT_MAP_ZOOM,
            zoomControl: false,
            minZoom: 2,
            maxZoom: 20,
            worldCopyJump: true
        });

        // Free Google Maps API standard tile layer
        const config = BASEMAP_CONFIGS['GOOGLE_ROADMAP'];
        const initialTileLayer = L.tileLayer(config.url, {
            subdomains: config.subdomains,
            attribution: config.attribution,
            maxZoom: config.maxZoom,
            noWrap: false
        });
        initialTileLayer.addTo(map);
        tileLayerRef.current = initialTileLayer;

        // Track cursor coordinates
        map.on('mousemove', (e: L.LeafletMouseEvent) => {
            setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        });

        map.on('mouseout', () => {
            setCursorCoords(null);
        });

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;

        setTimeout(() => {
            map.invalidateSize();
            if (activeIncidents.length > 0) {
                const latLngs = activeIncidents.map(i => [i.latitude, i.longitude] as [number, number]);
                map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 13 });
            }
        }, 200);

        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        if (mapContainerRef.current) {
            resizeObserver.observe(mapContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Swap Google Maps / Tactical Tile Layers dynamically
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        const config = BASEMAP_CONFIGS[activeBasemap];
        const newLayer = L.tileLayer(config.url, {
            subdomains: config.subdomains,
            maxZoom: config.maxZoom,
            attribution: config.attribution,
            className: activeBasemap === 'TACTICAL_DARK' ? 'dark-tiles' : undefined,
            noWrap: false
        });
        newLayer.addTo(map);
        tileLayerRef.current = newLayer;
    }, [activeBasemap]);

    // Smoothly fly to focused incident when triggered from external companion console
    useEffect(() => {
        if (!focusedIncident || !mapInstanceRef.current) return;
        mapInstanceRef.current.flyTo(
            [focusedIncident.latitude, focusedIncident.longitude],
            16,
            { duration: 1.2 }
        );
        setSelectedZoneIncident(focusedIncident);
    }, [focusedIncident]);

    // Keep selectedZoneIncident synchronized with incidents state updates
    useEffect(() => {
        if (!selectedZoneIncident) return;
        const fresh = incidents.find(i => i.id === selectedZoneIncident.id);
        if (fresh) {
            if (!isIncidentZoneActive(fresh)) {
                setSelectedZoneIncident(null);
            } else {
                setSelectedZoneIncident(fresh);
            }
        }
    }, [incidents, selectedZoneIncident]);

    // Worldwide Controls Handlers
    const handleReturnToMainDataset = () => {
        if (!mapInstanceRef.current) return;
        setSelectedPresetId('CHENNAI_DATASET');
        setSearchFeedback('Centered on Main Disaster Dataset Zone (Chennai)');
        setTimeout(() => setSearchFeedback(null), 3000);
        if (activeIncidents.length > 0) {
            const latLngs = activeIncidents.map(i => [i.latitude, i.longitude] as [number, number]);
            mapInstanceRef.current.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], maxZoom: 13 });
        } else {
            mapInstanceRef.current.flyTo(
                [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng],
                DEFAULT_MAP_ZOOM,
                { duration: 1.2 }
            );
        }
    };

    const handleViewAllActiveIncidents = () => {
        if (!mapInstanceRef.current) return;
        if (activeIncidents.length === 0) {
            setSearchFeedback('No active incidents to focus.');
            setTimeout(() => setSearchFeedback(null), 3000);
            return;
        }

        const latLngs = activeIncidents.map(i => [i.latitude, i.longitude] as [number, number]);
        const bounds = L.latLngBounds(latLngs);
        setSearchFeedback(`Framing ${activeIncidents.length} active worldwide incidents`);
        setTimeout(() => setSearchFeedback(null), 3000);
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    };

    const handleSelectPreset = (presetId: string) => {
        const preset = WORLDWIDE_LOCATION_PRESETS.find(p => p.id === presetId);
        if (!preset || !mapInstanceRef.current) return;
        setSelectedPresetId(presetId);
        setSearchFeedback(`Navigated to ${preset.name}, ${preset.country}`);
        setTimeout(() => setSearchFeedback(null), 3000);
        mapInstanceRef.current.flyTo([preset.lat, preset.lng], preset.zoom, { duration: 1.2 });
    };

    // --- ACCURATE LOCATION SELECTION AS SINGLE SOURCE OF TRUTH ---
    const handleSelectPlace = useCallback((place: PlaceResult) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // 1. Set Place as Single Source of Truth
        setSelectedPlace(place);
        setSearchQuery(place.name);
        setIsSuggestionsOpen(false);
        setDisambiguationOptions(null);

        // 2. Remove stale selection marker if it exists
        if (selectedPlaceMarkerRef.current) {
            selectedPlaceMarkerRef.current.remove();
            selectedPlaceMarkerRef.current = null;
        }

        // 3. Pan and zoom map to exact selected place coordinates
        const zoomLevel = place.placeType === 'city' ? 12 : 16;
        map.flyTo([place.latitude, place.longitude], zoomLevel, { duration: 1.2 });

        // 4. Create custom tactical target marker for selected place
        const customPinHtml = `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(14, 165, 233, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 28px; height: 28px; border-radius: 50%; background: #0284c7; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.6);">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
            </div>
        `;

        const placeIcon = L.divIcon({
            html: customPinHtml,
            className: 'selected-place-pin',
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });

        const newMarker = L.marker([place.latitude, place.longitude], { icon: placeIcon });

        // 5. Construct comprehensive popup displaying verified place properties
        const popupContent = document.createElement('div');
        popupContent.style.cssText = 'font-family: sans-serif; font-size: 11px; max-width: 270px; line-height: 1.4; color: #1e293b;';
        popupContent.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
                <strong style="font-size: 13px; color: #0284c7;">${place.name}</strong>
                <span style="font-size: 9px; font-weight: bold; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${place.placeType}</span>
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">${place.formattedAddress}</div>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-size: 10px; font-family: monospace;">
                <div><strong>GPS:</strong> ${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}</div>
                ${place.addressDetails.locality ? `<div><strong>Locality:</strong> ${place.addressDetails.locality}</div>` : ''}
                ${place.addressDetails.district ? `<div><strong>District:</strong> ${place.addressDetails.district}</div>` : ''}
                ${place.addressDetails.state ? `<div><strong>State:</strong> ${place.addressDetails.state}</div>` : ''}
                ${place.addressDetails.postalCode ? `<div><strong>Postal Code:</strong> ${place.addressDetails.postalCode}</div>` : ''}
                ${place.addressDetails.country ? `<div><strong>Country:</strong> ${place.addressDetails.country}</div>` : ''}
                <div><strong>Place ID:</strong> ${place.placeId}</div>
                <div><strong>Accuracy:</strong> <span style="color: #0284c7; font-weight: bold;">${place.accuracy}</span></div>
            </div>
            ${place.matchedProperty ? `
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 6px; font-size: 10px; color: #065f46; margin-bottom: 6px;">
                    <div style="font-weight: bold;">✓ Matched Facility: ${place.matchedProperty.name}</div>
                    <div>Type: ${place.matchedProperty.type}</div>
                    ${place.matchedProperty.contactNumber ? `<div>Phone: ${place.matchedProperty.contactNumber}</div>` : ''}
                </div>
            ` : ''}
        `;

        newMarker.bindPopup(popupContent);
        newMarker.addTo(map);
        newMarker.openPopup();
        selectedPlaceMarkerRef.current = newMarker;

        setSearchFeedback(`Selected: ${place.name} (${place.addressDetails.locality || place.addressDetails.state || place.addressDetails.country || ''})`);
        setTimeout(() => setSearchFeedback(null), 4000);
    }, []);

    // Clear selected place marker
    const handleClearSelectedPlace = () => {
        if (selectedPlaceMarkerRef.current) {
            selectedPlaceMarkerRef.current.remove();
            selectedPlaceMarkerRef.current = null;
        }
        setSelectedPlace(null);
        setSearchQuery('');
        setSuggestions([]);
        setIsSuggestionsOpen(false);
        setDisambiguationOptions(null);
    };

    // Live search input change with debounce
    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (searchDebounceTimerRef.current) {
            clearTimeout(searchDebounceTimerRef.current);
        }

        if (val.trim().length < 2) {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            return;
        }

        searchDebounceTimerRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const searchRes = await searchPlaces(val);
                setSuggestions(searchRes.results);
                setIsSuggestionsOpen(searchRes.results.length > 0);
            } catch {
                setSuggestions([]);
            } finally {
                setIsSearching(false);
            }
        }, 320);
    };

    // Form submission: check for exact match or trigger disambiguation
    const handleSearchSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (!trimmed) return;

        // Check if query directly matches incident ID
        const matchedInc = incidents.find(i => i.id.toLowerCase() === trimmed.toLowerCase());
        if (matchedInc && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([matchedInc.latitude, matchedInc.longitude], 15, { duration: 1.2 });
            setSearchFeedback(`Found Incident ${matchedInc.id} in ${matchedInc.city || matchedInc.country || 'CAD'}`);
            setTimeout(() => setSearchFeedback(null), 3000);
            return;
        }

        // Check coordinates format (lat, lng)
        const coordParts = trimmed.split(/[\s,]+/).filter(Boolean);
        if (coordParts.length === 2) {
            const lat = parseFloat(coordParts[0]);
            const lng = parseFloat(coordParts[1]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                handleSelectPlace({
                    placeId: `COORD-${lat.toFixed(4)}-${lng.toFixed(4)}`,
                    name: `GPS Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                    formattedAddress: `Coordinates: Latitude ${lat.toFixed(5)}, Longitude ${lng.toFixed(5)}`,
                    latitude: lat,
                    longitude: lng,
                    addressDetails: { road: 'Direct GPS Point' },
                    accuracy: 'EXACT_GPS',
                    placeType: 'landmark'
                });
                return;
            }
        }

        // Search places via geocoding service
        setIsSearching(true);
        try {
            const res = await searchPlaces(trimmed);
            if (res.results.length === 0) {
                setSearchFeedback(res.errorMessage || `No verified locations found matching "${trimmed}".`);
                setTimeout(() => setSearchFeedback(null), 4000);
                return;
            }

            if (res.isAmbiguous && res.results.length > 1) {
                // Ambiguous query: Ask user to choose the correct result!
                setDisambiguationOptions(res.results);
                setIsSuggestionsOpen(false);
            } else if (res.exactMatch) {
                // Unambiguous: Select exact match
                handleSelectPlace(res.exactMatch);
            } else {
                handleSelectPlace(res.results[0]);
            }
        } catch (err: any) {
            setSearchFeedback(`Search failed: ${err?.message || 'Check network connection'}`);
            setTimeout(() => setSearchFeedback(null), 3500);
        } finally {
            setIsSearching(false);
        }
    };

    // Render Tactical Map Overlays (Markers, Circular Risk Zones, Vectors, Units)
    useEffect(() => {
        const map = mapInstanceRef.current;
        const layerGroup = layerGroupRef.current;
        if (!map || !layerGroup) return;

        layerGroup.clearLayers();

        // 1. RENDER INCIDENTS & CIRCULAR RISK ZONES (Worldwide, strictly RED, ORANGE, YELLOW)
        incidents.forEach(inc => {
            const isActive = isIncidentZoneActive(inc);
            const zone = computeIncidentRiskZone(inc);

            if (riskFilter !== 'ALL' && zone.riskLevel !== riskFilter) {
                return;
            }

            const isApproximate = inc.locationAccuracy === 'APPROXIMATE' || inc.locationAccuracy === 'TEXT_DERIVED';
            const color = zone.color;

            // DRAW CIRCULAR RISK ZONE ONLY FOR ACTIVE INCIDENTS (NO GREEN)
            if (isActive && showZones) {
                const circle = L.circle([inc.latitude, inc.longitude], {
                    radius: zone.radiusMeters,
                    color: color,
                    fillColor: color,
                    fillOpacity: zone.riskLevel === 'RED' ? 0.22 : 0.16,
                    weight: zone.riskLevel === 'RED' ? 2.5 : 1.5,
                    dashArray: isApproximate ? '6, 6' : undefined
                });

                circle.on('click', () => {
                    setSelectedZoneIncident(inc);
                });

                circle.addTo(layerGroup);
            }

            // INCIDENT MARKER ICON - Clean glowing center beacon (no text/exclamation symbol)
            const iconHtml = `
                <div style="
                    background-color: ${color};
                    border: 2px solid #ffffff;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    box-shadow: 0 0 10px ${color};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    ${isApproximate ? 'border-style: dashed;' : ''}
                ">
                    <div style="
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                        background-color: #ffffff;
                        box-shadow: 0 0 4px #ffffff;
                    "></div>
                </div>
            `;

            const icon = L.divIcon({
                html: iconHtml,
                className: 'tactical-zone-pin',
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });

            const marker = L.marker([inc.latitude, inc.longitude], { icon });

            const situation = getIncidentSituation(inc);

            const popupNode = document.createElement('div');
            popupNode.style.cssText = 'font-family: sans-serif; font-size: 11px; max-width: 250px; line-height: 1.4;';
            popupNode.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 5px;">
                    <span style="font-weight: 800; font-size: 10px; font-family: monospace; padding: 2px 6px; border-radius: 4px; background: ${situation.colorHex}22; color: ${situation.colorHex}; border: 1px solid ${situation.colorHex}66;">
                        ${situation.emoji} ${situation.label.toUpperCase()}
                    </span>
                    <span style="font-family: monospace; font-size: 10px; color: #64748b; font-weight: bold;">
                        ${inc.id}
                    </span>
                </div>
                <div style="font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 3px; line-height: 1.25;">
                    ${inc.title}
                </div>
                <div style="color: #475569; font-size: 10px; margin-bottom: 3px;">
                    📍 <strong>Location:</strong> ${inc.locationDescription}
                </div>
                <div style="color: #0284c7; font-size: 10px; margin-bottom: 3px;">
                    🌍 <strong>Area:</strong> ${[inc.city, inc.state, inc.country].filter(Boolean).join(', ') || 'Andhra Pradesh'}
                </div>
                <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>GPS: <strong>${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}</strong></span>
                    <span>Reports: <strong>${inc.childReportIds.length}</strong></span>
                </div>
            `;

            const detailsBtn = document.createElement('button');
            detailsBtn.innerText = 'Open Full Incident Dossier';
            detailsBtn.style.cssText = `
                margin-top: 6px;
                width: 100%;
                padding: 6px 10px;
                background: ${color};
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 2px 8px ${color}44;
            `;
            detailsBtn.onclick = () => onSelectIncident(inc);
            popupNode.appendChild(detailsBtn);

            marker.bindPopup(popupNode);
            marker.addTo(layerGroup);
        });

        // 2. RENDER RAW REPORTS PINS & VECTORS
        if (showReports) {
            reports.forEach(rep => {
                const repIconHtml = `
                    <div style="
                        background-color: #38bdf8;
                        border: 1.5px solid #0f172a;
                        width: 14px;
                        height: 14px;
                        border-radius: 3px;
                        box-shadow: 0 0 6px #38bdf8;
                    "></div>
                `;

                const repIcon = L.divIcon({
                    html: repIconHtml,
                    className: 'tactical-report-pin',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                });

                const repMarker = L.marker([rep.latitude, rep.longitude], { icon: repIcon });

                const repPopup = document.createElement('div');
                repPopup.style.cssText = 'font-family: sans-serif; font-size: 11px; max-width: 220px;';
                repPopup.innerHTML = `
                    <div style="font-weight: bold; color: #0284c7;">Report: ${rep.id}</div>
                    <div style="color: #64748b; font-size: 10px;">${rep.sourceName}</div>
                    <div style="margin-top: 4px; color: #334155;">${rep.locationName}</div>
                `;

                if (onSelectReport) {
                    const btn = document.createElement('button');
                    btn.innerText = 'Inspect & Triage Report';
                    btn.style.cssText = `
                        margin-top: 6px;
                        width: 100%;
                        padding: 4px 8px;
                        background: #0284c7;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        font-size: 10px;
                        font-weight: 600;
                        cursor: pointer;
                    `;
                    btn.onclick = () => onSelectReport(rep);
                    repPopup.appendChild(btn);
                }

                repMarker.bindPopup(repPopup);
                repMarker.addTo(layerGroup);
            });
        }

        // 3. RENDER RESPONSE UNITS
        if (showUnits) {
            units.forEach(unit => {
                const unitColor =
                    unit.unitType === 'FIRE' ? '#f97316' :
                    unit.unitType === 'MEDICAL' ? '#ec4899' :
                    unit.unitType === 'HAZMAT' ? '#a855f7' : '#3b82f6';

                // UNIT MARKER ICON - Clean Tactical Vehicle Indicator (No letters F, R, M, P, H)
                const unitHtml = `
                    <div style="
                        background-color: #0f172a;
                        border: 2px solid ${unitColor};
                        width: 22px;
                        height: 22px;
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 0 8px ${unitColor};
                    ">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="${unitColor}" stroke="${unitColor}" stroke-width="1.5">
                            <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                        </svg>
                    </div>
                `;

                const unitIcon = L.divIcon({
                    html: unitHtml,
                    className: 'tactical-unit-pin',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                });

                const uMarker = L.marker([unit.latitude, unit.longitude], { icon: unitIcon });
                uMarker.bindPopup(`
                    <div style="font-family: sans-serif; font-size: 11px;">
                        <div style="font-size: 12px; font-weight: bold; color: ${unitColor};">${unit.callSign}</div>
                        <div style="color: #94a3b8; margin-top: 2px;">Status: <strong>${unit.status}</strong></div>
                        ${unit.assignedIncidentId ? `<div style="color: #38bdf8; font-size: 10px; font-family: monospace; margin-top: 2px;">Assigned to ${unit.assignedIncidentId}</div>` : ''}
                    </div>
                `);
                uMarker.addTo(layerGroup);
            });
        }

    }, [
        incidents,
        reports,
        units,
        riskFilter,
        showZones,
        showReports,
        showUnits,
        showCandidateVectors,
        onSelectIncident,
        onSelectReport,
        getCandidateLinksForReport
    ]);

    return (
        <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-sky-400/30 glass-panel select-none shadow-[0_4px_25px_rgba(56,189,248,0.18)]">
            {/* Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0"></div>

            {/* Top Tactical Navigation & Control Toolbar */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
                
                {/* Left Section: Risk Summary & Quick All Active Button */}
                <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                    <RiskSummaryWidget
                        incidents={incidents}
                        selectedRiskFilter={riskFilter}
                        onSelectRiskFilter={setRiskFilter}
                        compact={true}
                    />

                    {/* "View All Active Incidents" Quick Button */}
                    <button
                        type="button"
                        onClick={handleViewAllActiveIncidents}
                        title="Fit map bounds to all active incidents worldwide"
                        className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-50/95 hover:bg-sky-100 text-sky-800 border border-sky-400/40 text-xs font-mono font-semibold shadow-[0_2px_12px_rgba(56,189,248,0.15)] transition-all"
                    >
                        <Globe className="w-3.5 h-3.5 text-sky-600" />
                        <span>All Active ({activeIncidents.length})</span>
                    </button>
                </div>

                {/* Right Section: Small Search Bar to Search Location by Name */}
                <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="relative flex items-center bg-white/95 backdrop-blur-md border border-sky-400/40 rounded-lg shadow-sm hover:border-sky-500/60 transition-all">
                        {/* Location Search Input */}
                        <form onSubmit={handleSearchSubmit} className="flex items-center">
                            <div className="relative flex items-center">
                                <Search className="w-3.5 h-3.5 text-sky-600 absolute left-2.5 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                    onFocus={() => suggestions.length > 0 && setIsSuggestionsOpen(true)}
                                    placeholder="Search location by name..."
                                    className="pl-8 pr-6 py-1.5 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-36 sm:w-48 md:w-56 font-sans"
                                />
                                {isSearching ? (
                                    <Loader2 className="w-3.5 h-3.5 text-sky-500 animate-spin absolute right-2 pointer-events-none" />
                                ) : searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={handleClearSelectedPlace}
                                        className="absolute right-2 text-slate-400 hover:text-slate-600"
                                        title="Clear search"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                ) : null}
                            </div>
                            <button
                                type="submit"
                                className="px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-mono border-l border-sky-200 transition-colors font-bold rounded-r-lg"
                                title="Search location by name"
                            >
                                Find
                            </button>
                        </form>

                        {/* Interactive Autocomplete Suggestions Dropdown */}
                        {isSuggestionsOpen && suggestions.length > 0 && (
                            <div className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 bg-white/98 backdrop-blur-md border border-sky-400/30 rounded-xl shadow-[0_10px_35px_rgba(56,189,248,0.25)] z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                                <div className="p-2 bg-sky-50/80 text-[10px] font-mono font-bold text-sky-800 flex items-center justify-between border-b border-sky-200">
                                    <span>SUGGESTED PLACES ({suggestions.length})</span>
                                    <span>Select exact match</span>
                                </div>
                                {suggestions.map((place, idx) => (
                                    <div
                                        key={place.placeId + idx}
                                        onClick={() => handleSelectPlace(place)}
                                        className="p-2 hover:bg-sky-50/70 cursor-pointer transition-colors space-y-0.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                <span>{place.name}</span>
                                            </span>
                                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                                {place.placeType}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 line-clamp-1">
                                            {place.formattedAddress}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                                            {place.addressDetails.locality && (
                                                <span className="text-slate-600 font-semibold">{place.addressDetails.locality}</span>
                                            )}
                                            {place.addressDetails.state && (
                                                <span>• {place.addressDetails.state}</span>
                                            )}
                                            {place.addressDetails.country && (
                                                <span>• {place.addressDetails.country}</span>
                                            )}
                                            {place.matchedProperty && (
                                                <span className="text-emerald-600 font-bold ml-auto flex items-center gap-0.5">
                                                    <Building2 className="w-3 h-3" />
                                                    Facility
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Vertical Tactical Navigation Dock (Right Side) */}
            <div className="absolute top-16 right-3 z-20 flex flex-col items-center bg-white/95 backdrop-blur-md border border-sky-400/30 rounded-xl p-1 shadow-[0_4px_20px_rgba(56,189,248,0.20)] pointer-events-auto divide-y divide-sky-100">
                {/* Zoom In & Out */}
                <div className="flex flex-col items-center gap-0.5 pb-1">
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomIn()}
                        className="p-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg transition-colors"
                        title="Zoom In (+)"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => mapInstanceRef.current?.zoomOut()}
                        className="p-2 hover:bg-sky-50 text-slate-700 hover:text-sky-700 rounded-lg transition-colors"
                        title="Zoom Out (-)"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Recenter Main Disaster Dataset & Fit All Incidents */}
                <div className="flex flex-col items-center gap-0.5 py-1">
                    <button
                        type="button"
                        onClick={handleReturnToMainDataset}
                        className="p-2 hover:bg-sky-50 text-slate-800 rounded-lg transition-colors text-xs font-bold"
                        title="Return to Main Disaster Dataset Zone (Chennai 🚨)"
                    >
                        🚨
                    </button>
                    <button
                        type="button"
                        onClick={handleViewAllActiveIncidents}
                        className="p-2 hover:bg-sky-50 text-sky-700 hover:text-sky-900 rounded-lg transition-colors relative"
                        title="Fit map bounds to all active incidents"
                    >
                        <Globe className="w-4 h-4" />
                        {activeIncidents.length > 0 && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                        )}
                    </button>
                </div>

                {/* Tactical GIS Layers Toggle Button & Flyout Menu */}
                <div className="pt-1 flex flex-col items-center relative">
                    <button
                        type="button"
                        onClick={() => setShowGisLayersMenu(!showGisLayersMenu)}
                        className={`p-2 rounded-lg transition-colors ${
                            showGisLayersMenu
                                ? 'bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                                : 'hover:bg-sky-50 text-slate-700 hover:text-sky-700'
                        }`}
                        title="Toggle Tactical GIS Layers"
                    >
                        <Layers className="w-4 h-4" />
                    </button>

                    {/* Floating GIS Layers Flyout Menu (Appears directly left of the dock) */}
                    {showGisLayersMenu && (
                        <div className="absolute right-12 top-0 w-60 bg-white/98 backdrop-blur-md border border-sky-400/30 p-3 rounded-xl text-xs space-y-2.5 shadow-[0_10px_35px_rgba(56,189,248,0.25)] z-40 font-sans">
                            <div className="flex items-center justify-between font-mono font-bold text-slate-800 border-b border-sky-200 pb-1.5">
                                <span className="flex items-center gap-1.5 text-sky-700">
                                    <Layers className="w-3.5 h-3.5" />
                                    GIS Layers
                                </span>
                                <span className="text-[10px] text-slate-500">v2.4 Global</span>
                            </div>

                            <div className="space-y-1.5 text-[11px] text-slate-700">
                                <label className="flex items-center gap-2 cursor-pointer hover:text-sky-900">
                                    <input
                                        type="checkbox"
                                        checked={showZones}
                                        onChange={(e) => setShowZones(e.target.checked)}
                                        className="rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    />
                                    <span>Risk-Zone Circles</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer hover:text-sky-900">
                                    <input
                                        type="checkbox"
                                        checked={showReports}
                                        onChange={(e) => setShowReports(e.target.checked)}
                                        className="rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    />
                                    <span>Raw Reports Pin</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer hover:text-sky-900">
                                    <input
                                        type="checkbox"
                                        checked={showCandidateVectors}
                                        onChange={(e) => setShowCandidateVectors(e.target.checked)}
                                        className="rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    />
                                    <span>Correlation Vectors</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer hover:text-sky-900">
                                    <input
                                        type="checkbox"
                                        checked={showUnits}
                                        onChange={(e) => setShowUnits(e.target.checked)}
                                        className="rounded border-sky-300 text-sky-600 focus:ring-sky-400"
                                    />
                                    <span>Response Units</span>
                                </label>
                            </div>

                            {/* Strictly RED, ORANGE, YELLOW - Zero Green */}
                            <div className="pt-2 border-t border-sky-200 space-y-1 text-[10px] font-mono">
                                <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500"></span>
                                    <span>🔴 Red Zone (Critical)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-orange-600 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500"></span>
                                    <span>🟠 Orange Zone (High)</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-sm shadow-yellow-500"></span>
                                    <span>🟡 Yellow Zone (Moderate)</span>
                                </div>
                            </div>

                            {/* Google Maps & Free GIS Basemap Engine Selector */}
                            <div className="pt-2 border-t border-sky-200 space-y-1.5">
                                <div className="text-[10px] font-mono font-bold text-sky-800 flex items-center justify-between">
                                    <span>BASEMAP ENGINE</span>
                                    <span className="text-[9px] px-1 rounded bg-sky-100 text-sky-700 font-bold">Google Maps Free API</span>
                                </div>
                                <div className="space-y-1">
                                    {(Object.keys(BASEMAP_CONFIGS) as BasemapProvider[]).map(key => {
                                        const b = BASEMAP_CONFIGS[key];
                                        const isSelected = activeBasemap === key;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setActiveBasemap(key)}
                                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                                    isSelected
                                                        ? 'bg-sky-500 text-white font-bold shadow-sm'
                                                        : 'hover:bg-sky-50 text-slate-700'
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <span>{b.icon}</span>
                                                    <span>{b.label}</span>
                                                </span>
                                                {isSelected && <span className="text-[10px]">✓</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quick Region Jump Presets */}
                            <div className="pt-2 border-t border-sky-200 space-y-1">
                                <div className="text-[10px] font-mono font-bold text-sky-800 flex items-center justify-between">
                                    <span>QUICK REGION JUMP</span>
                                </div>
                                <select
                                    value={selectedPresetId}
                                    onChange={(e) => handleSelectPreset(e.target.value)}
                                    className="w-full bg-white border border-sky-200 text-slate-800 text-[11px] font-mono rounded px-2 py-1 focus:outline-none cursor-pointer"
                                    title="Quick switch to worldwide region presets"
                                >
                                    {WORLDWIDE_LOCATION_PRESETS.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.flag} {p.name} ({p.country})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom-Right Google Maps Engine Real-Time Live Status Watermark */}
            <div className="absolute bottom-3 right-3 z-10 hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur border border-sky-400/30 px-2.5 py-1 rounded-lg font-mono text-[10px] text-slate-700 shadow-sm pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-sky-800">{BASEMAP_CONFIGS[activeBasemap].label}</span>
                <span className="text-slate-400">• Free Tier • Real-Time Stream</span>
            </div>

            {/* Selected Place Active Banner HUD (Single Source of Truth Indicator) */}
            {selectedPlace && (
                <div className="absolute top-16 left-3 z-20 bg-white/98 backdrop-blur-md border border-sky-400/40 rounded-xl p-2.5 sm:p-3 shadow-[0_8px_30px_rgba(56,189,248,0.25)] flex items-center justify-between gap-3 text-xs w-[calc(100%-5rem)] sm:w-auto sm:max-w-md animate-in fade-in slide-in-from-top-2 pointer-events-auto">
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-sky-100 rounded-lg text-sky-700 shrink-0 mt-0.5">
                            <Crosshair className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{selectedPlace.name}</span>
                                <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-mono text-[9px] font-bold">
                                    {selectedPlace.accuracy}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{selectedPlace.formattedAddress}</p>
                            <div className="font-mono text-[10px] text-slate-600">
                                <span>GPS: <strong>{selectedPlace.latitude.toFixed(5)}</strong>, <strong>{selectedPlace.longitude.toFixed(5)}</strong></span>
                                {selectedPlace.addressDetails.locality && (
                                    <span className="text-sky-700"> • {selectedPlace.addressDetails.locality}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClearSelectedPlace}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                        title="Remove selected location pin"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Ambiguous Location Disambiguation Modal */}
            {disambiguationOptions && disambiguationOptions.length > 0 && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-sky-400/40 space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-sky-200">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-300">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Select Exact Intended Location</h3>
                                <p className="text-xs text-slate-500">
                                    Multiple places match <code className="font-bold text-slate-800">"{searchQuery}"</code>. Please choose the correct area:
                                </p>
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto space-y-2.5">
                            {disambiguationOptions.map((opt, i) => (
                                <div
                                    key={opt.placeId + i}
                                    onClick={() => handleSelectPlace(opt)}
                                    className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/60 cursor-pointer transition-all space-y-1 shadow-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-sky-600" />
                                            <span>{opt.name}</span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                                            {opt.placeType}
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                                        {opt.formattedAddress}
                                    </p>

                                    <div className="pl-6 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                                        {opt.addressDetails.locality && (
                                            <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                                                Locality: {opt.addressDetails.locality}
                                            </span>
                                        )}
                                        {opt.addressDetails.district && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                District: {opt.addressDetails.district}
                                            </span>
                                        )}
                                        {opt.addressDetails.state && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                State: {opt.addressDetails.state}
                                            </span>
                                        )}
                                        {opt.addressDetails.postalCode && (
                                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                PIN: {opt.addressDetails.postalCode}
                                            </span>
                                        )}
                                        {opt.addressDetails.country && (
                                            <span>Country: {opt.addressDetails.country}</span>
                                        )}
                                        {opt.matchedProperty && (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold ml-auto flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {opt.matchedProperty.type}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setDisambiguationOptions(null)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                            >
                                Cancel Search
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification/Feedback Banner */}
            {searchFeedback && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur border border-sky-400/40 text-sky-800 px-3.5 py-1.5 rounded-lg text-xs font-mono shadow-[0_4px_20px_rgba(56,189,248,0.25)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{searchFeedback}</span>
                </div>
            )}

            {/* Bottom-Left Real-Time Cursor Coordinates HUD */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-white/90 backdrop-blur border border-sky-400/30 px-3 py-1.5 rounded-lg font-mono text-[11px] text-slate-700 shadow-[0_2px_15px_rgba(56,189,248,0.18)]">
                <Compass className="w-3.5 h-3.5 text-sky-600" />
                {cursorCoords ? (
                    <span>
                        GPS: <strong className="text-slate-900">{cursorCoords.lat.toFixed(5)}</strong>, <strong className="text-slate-900">{cursorCoords.lng.toFixed(5)}</strong>
                    </span>
                ) : (
                    <span>Hover map to track worldwide GPS coords</span>
                )}
            </div>

            {/* Empty State Tactical Indicator */}
            {incidents.length === 0 && reports.length === 0 && !selectedPlace && (
                <div className="absolute top-16 left-3 z-10 bg-white/95 backdrop-blur-md border border-sky-400/30 px-3 py-2 rounded-xl text-xs shadow-md space-y-0.5 pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                        <span>Tactical GIS Grid Ready</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                        0 Active Emergency Zones • Use search above to locate any address, landmark, or city.
                    </p>
                </div>
            )}

            {/* Slide-in Zone Information Panel (when a risk circle is clicked) */}
            {selectedZoneIncident && (
                <ZoneInfoPanel
                    incident={selectedZoneIncident}
                    onClose={() => setSelectedZoneIncident(null)}
                    onOpenFullDetails={(inc) => {
                        setSelectedZoneIncident(null);
                        onSelectIncident(inc);
                    }}
                />
            )}
        </div>
    );
};
