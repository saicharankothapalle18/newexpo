import { LocationAccuracy } from './index';

/**
 * Structured breakdown of address components from geocoding provider
 */
export interface PlaceAddressDetails {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    locality?: string;       // City, town, or village
    district?: string;       // County or administrative district
    state?: string;          // State or province
    postalCode?: string;     // ZIP or PIN code
    country?: string;        // Country name
    countryCode?: string;    // 2-letter ISO code
}

/**
 * Single Source of Truth for a verified place record
 */
export interface PlaceResult {
    placeId: string;                     // Stable provider or internal ID
    name: string;                        // Primary place / landmark / POI name
    formattedAddress: string;            // Full display address
    latitude: number;                    // Exact latitude
    longitude: number;                   // Exact longitude
    addressDetails: PlaceAddressDetails; // Component details
    accuracy: LocationAccuracy;          // EXACT_GPS or APPROXIMATE
    placeType: 'city' | 'street' | 'landmark' | 'building' | 'amenity' | 'junction' | 'administrative';
    boundingBox?: [number, number, number, number]; // [south, west, north, east]
    matchedProperty?: PropertyRecord;    // Matched facility or property if found in local database
}

/**
 * Property / Infrastructure record in local database
 */
export interface PropertyRecord {
    id: string;
    name: string;
    type: 'FIRE_STATION' | 'HOSPITAL' | 'POLICE_STATION' | 'GOVERNMENT' | 'COMMERCIAL' | 'RESIDENTIAL' | 'CRITICAL_INFRASTRUCTURE';
    address: string;
    locality: string;
    district: string;
    state: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
    contactNumber?: string;
    capacity?: number;
    verified: boolean;
}

/**
 * Response structure for location search
 */
export interface LocationSearchResponse {
    query: string;
    totalResults: number;
    isAmbiguous: boolean;               // True if multiple distinct matching locations found
    results: PlaceResult[];
    exactMatch?: PlaceResult;           // Unambiguous high-confidence match if applicable
    errorMessage?: string;
}
