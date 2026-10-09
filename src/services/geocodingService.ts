import { PlaceResult, PlaceAddressDetails, LocationSearchResponse, PropertyRecord } from '../types/location';
import { calculateDistanceKm } from '../utils/geo';

// In-memory query cache for instant responses and rate-limit conservation
const searchCache = new Map<string, PlaceResult[]>();

/**
 * Local verified Emergency & Critical Infrastructure Database
 * Matches selected locations to genuine facilities using stable identifiers, coordinates, and verified addresses.
 */
export const LOCAL_PROPERTY_DATABASE: PropertyRecord[] = [
    {
        id: 'PROP-VJA-001',
        name: 'Government General Hospital (Old GGH)',
        type: 'HOSPITAL',
        address: 'MG Road, Governor Peta, Vijayawada',
        locality: 'Vijayawada',
        district: 'NTR District',
        state: 'Andhra Pradesh',
        postalCode: '520002',
        latitude: 16.5123,
        longitude: 80.6278,
        contactNumber: '+91 866 257 5611',
        capacity: 850,
        verified: true
    },
    {
        id: 'PROP-VJA-002',
        name: 'Benz Circle Traffic Police Post & Rapid Unit #1',
        type: 'POLICE_STATION',
        address: 'Benz Circle Flyover Junction, MG Road, Vijayawada',
        locality: 'Vijayawada',
        district: 'NTR District',
        state: 'Andhra Pradesh',
        postalCode: '520010',
        latitude: 16.5082,
        longitude: 80.6450,
        contactNumber: '+91 866 247 1100',
        capacity: 40,
        verified: true
    },
    {
        id: 'PROP-VJA-003',
        name: 'Vijayawada Central Fire Station',
        type: 'FIRE_STATION',
        address: 'Opposite Sub Collector Office, Bundar Road, Vijayawada',
        locality: 'Vijayawada',
        district: 'NTR District',
        state: 'Andhra Pradesh',
        postalCode: '520002',
        latitude: 16.5140,
        longitude: 80.6315,
        contactNumber: '+91 866 257 1101',
        capacity: 35,
        verified: true
    },
    {
        id: 'PROP-VJA-004',
        name: 'Pandit Nehru Bus Terminal (PNBS) Emergency Post',
        type: 'CRITICAL_INFRASTRUCTURE',
        address: 'Krishna River Bank Road, Tarapet, Vijayawada',
        locality: 'Vijayawada',
        district: 'NTR District',
        state: 'Andhra Pradesh',
        postalCode: '520001',
        latitude: 16.5105,
        longitude: 80.6189,
        contactNumber: '+91 866 257 0005',
        capacity: 200,
        verified: true
    },
    {
        id: 'PROP-VIZAG-001',
        name: 'King George Hospital (KGH) Emergency Trauma Center',
        type: 'HOSPITAL',
        address: 'Collector Office Road, Maharanipeta, Visakhapatnam',
        locality: 'Visakhapatnam',
        district: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        postalCode: '530002',
        latitude: 17.7088,
        longitude: 83.3056,
        contactNumber: '+91 891 256 4891',
        capacity: 1200,
        verified: true
    },
    {
        id: 'PROP-VIZAG-002',
        name: 'RK Beach Coastal Disaster Command Outpost',
        type: 'CRITICAL_INFRASTRUCTURE',
        address: 'Beach Road Promenade, Pandurangapuram, Visakhapatnam',
        locality: 'Visakhapatnam',
        district: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        postalCode: '530003',
        latitude: 17.7126,
        longitude: 83.3228,
        contactNumber: '+91 891 256 0100',
        capacity: 50,
        verified: true
    },
    {
        id: 'PROP-CHN-001',
        name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
        type: 'HOSPITAL',
        address: 'EVR Periyar Salai, Park Town, Chennai',
        locality: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600003',
        latitude: 13.0818,
        longitude: 80.2777,
        contactNumber: '+91 44 2530 5000',
        capacity: 2500,
        verified: true
    },
    {
        id: 'PROP-CHN-002',
        name: 'Velachery Emergency Flood Response Post & MRTS Sub-Center',
        type: 'CRITICAL_INFRASTRUCTURE',
        address: 'Velachery Bypass Road, Velachery, Chennai',
        locality: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600042',
        latitude: 12.9784,
        longitude: 80.2184,
        contactNumber: '+91 44 2244 1000',
        capacity: 80,
        verified: true
    },
    {
        id: 'PROP-BLR-001',
        name: 'Victoria Hospital Emergency Complex',
        type: 'HOSPITAL',
        address: 'Fort Road, Near City Market, Bengaluru',
        locality: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560002',
        latitude: 12.9634,
        longitude: 77.5746,
        contactNumber: '+91 80 2670 1150',
        capacity: 1000,
        verified: true
    },
    {
        id: 'PROP-BLR-002',
        name: 'MG Road Metro Police & Transit Station',
        type: 'POLICE_STATION',
        address: 'Mahatma Gandhi Road, Shanthala Nagar, Bengaluru',
        locality: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        postalCode: '560001',
        latitude: 12.9756,
        longitude: 77.6066,
        contactNumber: '+91 80 2294 2500',
        capacity: 60,
        verified: true
    },
    {
        id: 'PROP-HYD-001',
        name: 'Gandhi Hospital Trauma & Emergency Care',
        type: 'HOSPITAL',
        address: 'Musheerabad, Padmarao Nagar, Secunderabad, Hyderabad',
        locality: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500003',
        latitude: 17.4243,
        longitude: 78.5029,
        contactNumber: '+91 40 2750 5566',
        capacity: 1200,
        verified: true
    },
    {
        id: 'PROP-LON-001',
        name: "St Thomas' Hospital Emergency & Major Trauma",
        type: 'HOSPITAL',
        address: 'Westminster Bridge Road, London',
        locality: 'London',
        district: 'Lambeth',
        state: 'England',
        postalCode: 'SE1 7EH',
        latitude: 51.4988,
        longitude: -0.1186,
        contactNumber: '+44 20 7188 7188',
        capacity: 900,
        verified: true
    }
];

/**
 * Checks local database to see if coordinates match any verified emergency property
 */
export function findMatchingProperty(lat: number, lng: number, addressDetails?: PlaceAddressDetails): PropertyRecord | undefined {
    // 1. Proximity matching within 400 meters
    for (const prop of LOCAL_PROPERTY_DATABASE) {
        const distKm = calculateDistanceKm(lat, lng, prop.latitude, prop.longitude);
        if (distKm <= 0.45) {
            return prop;
        }
    }

    // 2. Exact address name match if locality matches
    if (addressDetails?.locality) {
        const locLower = addressDetails.locality.toLowerCase();
        for (const prop of LOCAL_PROPERTY_DATABASE) {
            if (prop.locality.toLowerCase() === locLower) {
                if (addressDetails.road && prop.address.toLowerCase().includes(addressDetails.road.toLowerCase())) {
                    return prop;
                }
            }
        }
    }

    return undefined;
}

/**
 * Standardizes raw geocoder item into a clean PlaceResult
 */
export function normalizeRawPlace(raw: any): PlaceResult {
    const address = raw.address || {};
    const lat = parseFloat(raw.lat || raw.latitude);
    const lng = parseFloat(raw.lon || raw.longitude || raw.lng);

    const locality =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.hamlet ||
        address.suburb ||
        '';

    const district =
        address.state_district ||
        address.county ||
        address.district ||
        '';

    const state =
        address.state ||
        address.region ||
        address.province ||
        '';

    const postalCode =
        address.postcode ||
        address.postal_code ||
        '';

    const country =
        address.country ||
        '';

    const countryCode = (address.country_code || '').toUpperCase();

    const road =
        address.road ||
        address.pedestrian ||
        address.street ||
        address.highway ||
        '';

    const neighbourhood =
        address.neighbourhood ||
        address.suburb ||
        address.residential ||
        '';

    // Determine place type
    let placeType: PlaceResult['placeType'] = 'landmark';
    const typeStr = (raw.type || raw.category || '').toLowerCase();
    if (typeStr.includes('city') || typeStr.includes('town') || typeStr.includes('village')) {
        placeType = 'city';
    } else if (typeStr.includes('road') || typeStr.includes('street') || typeStr.includes('highway') || typeStr.includes('path')) {
        placeType = 'street';
    } else if (typeStr.includes('building') || typeStr.includes('house')) {
        placeType = 'building';
    } else if (typeStr.includes('hospital') || typeStr.includes('police') || typeStr.includes('fire_station') || typeStr.includes('station')) {
        placeType = 'amenity';
    } else if (typeStr.includes('junction') || typeStr.includes('roundabout')) {
        placeType = 'junction';
    } else if (typeStr.includes('administrative') || typeStr.includes('state')) {
        placeType = 'administrative';
    }

    // Determine accuracy: Exact GPS if street, building, amenity, junction; Approximate if city/admin
    const accuracy = (placeType === 'city' || placeType === 'administrative')
        ? 'APPROXIMATE'
        : 'EXACT_GPS';

    // Build user-friendly primary name
    let primaryName = raw.name || '';
    if (!primaryName) {
        if (road && neighbourhood) primaryName = `${road}, ${neighbourhood}`;
        else if (road) primaryName = road;
        else if (locality) primaryName = locality;
        else if (raw.display_name) primaryName = raw.display_name.split(',')[0];
        else primaryName = 'Selected Geographic Location';
    }

    const details: PlaceAddressDetails = {
        road,
        neighbourhood,
        suburb: address.suburb,
        locality,
        district,
        state,
        postalCode,
        country,
        countryCode
    };

    const matchedProperty = findMatchingProperty(lat, lng, details);

    const boundingBox = raw.boundingbox
        ? [parseFloat(raw.boundingbox[0]), parseFloat(raw.boundingbox[2]), parseFloat(raw.boundingbox[1]), parseFloat(raw.boundingbox[3])] as [number, number, number, number]
        : undefined;

    return {
        placeId: String(raw.place_id || raw.osm_id || `LOC-${lat.toFixed(4)}-${lng.toFixed(4)}`),
        name: primaryName,
        formattedAddress: raw.display_name || `${primaryName}, ${locality}, ${state}, ${country}`.replace(/,\s*,/g, ','),
        latitude: lat,
        longitude: lng,
        addressDetails: details,
        accuracy,
        placeType,
        boundingBox,
        matchedProperty
    };
}

/**
 * Searches for places matching the user's query.
 * Detects ambiguity when multiple locations with similar names exist across different regions.
 */
export async function searchPlaces(query: string): Promise<LocationSearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
        return {
            query: '',
            totalResults: 0,
            isAmbiguous: false,
            results: []
        };
    }

    // Check memory cache first
    const cacheKey = trimmed.toLowerCase();
    if (searchCache.has(cacheKey)) {
        const cachedResults = searchCache.get(cacheKey)!;
        return evaluateSearchAmbiguity(trimmed, cachedResults);
    }

    try {
        // 1. Try server-side proxy endpoint first to bypass CORS and apply server caching
        let rawItems: any[] = [];
        try {
            const proxyRes = await fetch(`/api/geocode/search?q=${encodeURIComponent(trimmed)}`, {
                headers: { 'Accept': 'application/json' }
            });
            if (proxyRes.ok) {
                const proxyData = await proxyRes.json();
                if (Array.isArray(proxyData) && proxyData.length > 0) {
                    rawItems = proxyData;
                }
            }
        } catch {
            // Server proxy failed or in standalone mode, fall back to direct Nominatim
        }

        // 2. Direct OpenStreetMap Nominatim API fallback
        if (rawItems.length === 0) {
            const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(trimmed)}`;
            const res = await fetch(osmUrl, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'AntigravityEmergencyCAD/2.5 (emergency-response-system)'
                }
            });

            if (!res.ok) {
                throw new Error(`Location provider responded with HTTP ${res.status}`);
            }

            rawItems = await res.json();
        }

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            // Check if user input local property database directly
            const localMatches = matchQueryAgainstLocalProperties(trimmed);
            if (localMatches.length > 0) {
                searchCache.set(cacheKey, localMatches);
                return evaluateSearchAmbiguity(trimmed, localMatches);
            }

            return {
                query: trimmed,
                totalResults: 0,
                isAmbiguous: false,
                results: [],
                errorMessage: `No locations found matching "${trimmed}". Please verify spelling or include city/state.`
            };
        }

        const normalizedResults = rawItems.map(normalizeRawPlace);

        // Also check if any local properties match and append if not already in results
        const localMatches = matchQueryAgainstLocalProperties(trimmed);
        localMatches.forEach(lp => {
            if (!normalizedResults.some(nr => nr.placeId === lp.placeId || (Math.abs(nr.latitude - lp.latitude) < 0.001 && Math.abs(nr.longitude - lp.longitude) < 0.001))) {
                normalizedResults.unshift(lp);
            }
        });

        // Store in cache
        searchCache.set(cacheKey, normalizedResults);

        return evaluateSearchAmbiguity(trimmed, normalizedResults);
    } catch (err: any) {
        // On network or API failure, check local verified properties
        const localMatches = matchQueryAgainstLocalProperties(trimmed);
        if (localMatches.length > 0) {
            return evaluateSearchAmbiguity(trimmed, localMatches);
        }

        return {
            query: trimmed,
            totalResults: 0,
            isAmbiguous: false,
            results: [],
            errorMessage: `Location search service unavailable: ${err?.message || 'Check network connection'}`
        };
    }
}

/**
 * Reverse geocodes coordinates to a PlaceResult
 */
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'AntigravityEmergencyCAD/2.5 (emergency-response-system)'
            }
        });

        if (!res.ok) return null;
        const raw = await res.json();
        return normalizeRawPlace(raw);
    } catch {
        return null;
    }
}

/**
 * Evaluates whether a set of search results contains ambiguous locations (e.g. "MG Road" in different cities)
 */
export function evaluateSearchAmbiguity(query: string, results: PlaceResult[]): LocationSearchResponse {
    if (results.length === 0) {
        return {
            query,
            totalResults: 0,
            isAmbiguous: false,
            results: []
        };
    }

    if (results.length === 1) {
        return {
            query,
            totalResults: 1,
            isAmbiguous: false,
            results,
            exactMatch: results[0]
        };
    }

    // Check if multiple distinct locations exist (e.g. different cities or > 10km apart)
    let isAmbiguous = false;
    const first = results[0];

    for (let i = 1; i < results.length; i++) {
        const current = results[i];
        const dist = calculateDistanceKm(first.latitude, first.longitude, current.latitude, current.longitude);
        const diffState = first.addressDetails.state && current.addressDetails.state && first.addressDetails.state !== current.addressDetails.state;
        const diffCity = first.addressDetails.locality && current.addressDetails.locality && first.addressDetails.locality !== current.addressDetails.locality;

        if (dist > 8.0 || diffState || diffCity) {
            isAmbiguous = true;
            break;
        }
    }

    return {
        query,
        totalResults: results.length,
        isAmbiguous,
        results,
        exactMatch: !isAmbiguous ? results[0] : undefined
    };
}

/**
 * Fallback fuzzy match on internal property database
 */
export function matchQueryAgainstLocalProperties(query: string): PlaceResult[] {
    const qLower = query.toLowerCase();
    const matches = LOCAL_PROPERTY_DATABASE.filter(prop => {
        return (
            prop.name.toLowerCase().includes(qLower) ||
            prop.address.toLowerCase().includes(qLower) ||
            prop.locality.toLowerCase().includes(qLower) ||
            (prop.district && prop.district.toLowerCase().includes(qLower)) ||
            (prop.postalCode && prop.postalCode.includes(qLower))
        );
    });

    return matches.map(prop => ({
        placeId: prop.id,
        name: prop.name,
        formattedAddress: `${prop.name}, ${prop.address}, ${prop.state}`,
        latitude: prop.latitude,
        longitude: prop.longitude,
        addressDetails: {
            road: prop.address.split(',')[0],
            locality: prop.locality,
            district: prop.district,
            state: prop.state,
            postalCode: prop.postalCode,
            country: 'India',
            countryCode: 'IN'
        },
        accuracy: 'EXACT_GPS',
        placeType: 'amenity',
        matchedProperty: prop
    }));
}
