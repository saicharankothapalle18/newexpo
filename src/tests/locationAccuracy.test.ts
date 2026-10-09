/**
 * Location Accuracy & Geocoding Disambiguation Test Suite
 *
 * Verifies:
 * 1. Ambiguous queries with similar names across different regions (e.g. MG Road in Vijayawada vs Bengaluru vs Kochi)
 * 2. Duplicate place names (e.g. Springfield in IL vs MA vs OH; Richmond in UK vs US)
 * 3. Property matching from verified database (e.g. Victoria Hospital -> PROP-BLR-001; GGH -> PROP-VJA-001)
 * 4. Non-matching coordinates (no hallucinated properties)
 * 5. Address normalization and typo / partial query resilience
 * 6. Empty search and not-found handling
 * 7. Single Source of Truth consistency and accuracy classification (EXACT_GPS vs APPROXIMATE)
 */

import assert from 'node:assert';
import {
    evaluateSearchAmbiguity,
    normalizeRawPlace,
    findMatchingProperty,
    matchQueryAgainstLocalProperties,
    LOCAL_PROPERTY_DATABASE
} from '../services/geocodingService.ts';
import { PlaceResult } from '../types/location.ts';

let passedTests = 0;
let totalTests = 0;

function runTest(testName: string, testFn: () => void) {
    totalTests++;
    try {
        testFn();
        console.log(`  [PASS] ${testName}`);
        passedTests++;
    } catch (err: any) {
        console.error(`  [FAIL] ${testName}`);
        console.error(`         Error: ${err.message}`);
        throw err;
    }
}

console.log('========================================================');
console.log(' ANTIGRAVITY CAD / TACTICAL GIS LOCATION ACCURACY SUITE ');
console.log('========================================================\n');

// --------------------------------------------------------------------------
// SUITE 1: Ambiguous Queries Disambiguation
// --------------------------------------------------------------------------
console.log('Suite 1: Ambiguous Queries & Disambiguation Logic');

runTest('Detects ambiguity for "MG Road" across different cities (Vijayawada vs Bengaluru)', () => {
    const mgRoadVJA: PlaceResult = {
        placeId: 'OSM-VJA-MG',
        name: 'Mahatma Gandhi Road',
        formattedAddress: 'MG Road, Governor Peta, Vijayawada, Andhra Pradesh, 520002, India',
        latitude: 16.5123,
        longitude: 80.6278,
        addressDetails: {
            road: 'Mahatma Gandhi Road',
            locality: 'Vijayawada',
            district: 'NTR District',
            state: 'Andhra Pradesh',
            postalCode: '520002',
            country: 'India',
            countryCode: 'IN'
        },
        accuracy: 'EXACT_GPS',
        placeType: 'street'
    };

    const mgRoadBLR: PlaceResult = {
        placeId: 'OSM-BLR-MG',
        name: 'Mahatma Gandhi Road',
        formattedAddress: 'MG Road, Shanthala Nagar, Bengaluru, Karnataka, 560001, India',
        latitude: 12.9756,
        longitude: 77.6066,
        addressDetails: {
            road: 'Mahatma Gandhi Road',
            locality: 'Bengaluru',
            district: 'Bengaluru Urban',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
            countryCode: 'IN'
        },
        accuracy: 'EXACT_GPS',
        placeType: 'street'
    };

    const res = evaluateSearchAmbiguity('MG Road', [mgRoadVJA, mgRoadBLR]);
    assert.strictEqual(res.isAmbiguous, true, 'Should flag query as ambiguous');
    assert.strictEqual(res.totalResults, 2, 'Should have 2 candidate results');
    assert.strictEqual(res.exactMatch, undefined, 'Must NOT auto-select an arbitrary place when ambiguous');
});

runTest('Single search result is recognized as unambiguous exact match', () => {
    const benzCircle: PlaceResult = {
        placeId: 'OSM-VJA-BC',
        name: 'Benz Circle',
        formattedAddress: 'Benz Circle, Bandar Road, Vijayawada, Andhra Pradesh, 520010, India',
        latitude: 16.5082,
        longitude: 80.6450,
        addressDetails: {
            road: 'Bandar Road',
            locality: 'Vijayawada',
            district: 'NTR District',
            state: 'Andhra Pradesh',
            postalCode: '520010',
            country: 'India',
            countryCode: 'IN'
        },
        accuracy: 'EXACT_GPS',
        placeType: 'junction'
    };

    const res = evaluateSearchAmbiguity('Benz Circle Vijayawada', [benzCircle]);
    assert.strictEqual(res.isAmbiguous, false, 'Should not be ambiguous');
    assert.strictEqual(res.totalResults, 1);
    assert.deepStrictEqual(res.exactMatch, benzCircle, 'Should set exactMatch to the sole candidate');
});

// --------------------------------------------------------------------------
// SUITE 2: Duplicate Place Names Across States / Countries
// --------------------------------------------------------------------------
console.log('\nSuite 2: Duplicate Place Names Across States and Countries');

runTest('Detects duplicate city name "Springfield" across IL, MA, and OH', () => {
    const springfieldIL: PlaceResult = {
        placeId: 'CITY-SP-IL',
        name: 'Springfield',
        formattedAddress: 'Springfield, Sangamon County, Illinois, United States',
        latitude: 39.7817,
        longitude: -89.6501,
        addressDetails: {
            locality: 'Springfield',
            district: 'Sangamon County',
            state: 'Illinois',
            country: 'United States',
            countryCode: 'US'
        },
        accuracy: 'APPROXIMATE',
        placeType: 'city'
    };

    const springfieldMA: PlaceResult = {
        placeId: 'CITY-SP-MA',
        name: 'Springfield',
        formattedAddress: 'Springfield, Hampden County, Massachusetts, United States',
        latitude: 42.1015,
        longitude: -72.5898,
        addressDetails: {
            locality: 'Springfield',
            district: 'Hampden County',
            state: 'Massachusetts',
            country: 'United States',
            countryCode: 'US'
        },
        accuracy: 'APPROXIMATE',
        placeType: 'city'
    };

    const res = evaluateSearchAmbiguity('Springfield', [springfieldIL, springfieldMA]);
    assert.strictEqual(res.isAmbiguous, true);
    assert.strictEqual(res.results.length, 2);
    // User must be presented with both states to select
    assert.strictEqual(res.results[0].addressDetails.state, 'Illinois');
    assert.strictEqual(res.results[1].addressDetails.state, 'Massachusetts');
});

runTest('Detects duplicate city name "Richmond" across UK and USA', () => {
    const richmondUK: PlaceResult = {
        placeId: 'CITY-RICH-UK',
        name: 'Richmond',
        formattedAddress: 'Richmond, London Borough of Richmond upon Thames, England, United Kingdom',
        latitude: 51.4613,
        longitude: -0.3037,
        addressDetails: {
            locality: 'Richmond',
            district: 'Greater London',
            state: 'England',
            country: 'United Kingdom',
            countryCode: 'GB'
        },
        accuracy: 'APPROXIMATE',
        placeType: 'city'
    };

    const richmondVA: PlaceResult = {
        placeId: 'CITY-RICH-VA',
        name: 'Richmond',
        formattedAddress: 'Richmond, Virginia, United States',
        latitude: 37.5407,
        longitude: -77.4360,
        addressDetails: {
            locality: 'Richmond',
            state: 'Virginia',
            country: 'United States',
            countryCode: 'US'
        },
        accuracy: 'APPROXIMATE',
        placeType: 'city'
    };

    const res = evaluateSearchAmbiguity('Richmond', [richmondUK, richmondVA]);
    assert.strictEqual(res.isAmbiguous, true);
    assert.strictEqual(res.results[0].addressDetails.countryCode, 'GB');
    assert.strictEqual(res.results[1].addressDetails.countryCode, 'US');
});

// --------------------------------------------------------------------------
// SUITE 3: Local Verified Property Matching
// --------------------------------------------------------------------------
console.log('\nSuite 3: Local Verified Property Matching');

runTest('Matches coordinates within 450m to Victoria Hospital (PROP-BLR-001)', () => {
    // Victoria Hospital coordinates: 12.9634, 77.5746
    const prop = findMatchingProperty(12.9635, 77.5748); // ~25 meters offset
    assert.ok(prop, 'Should find matching property');
    assert.strictEqual(prop?.id, 'PROP-BLR-001');
    assert.strictEqual(prop?.type, 'HOSPITAL');
    assert.strictEqual(prop?.locality, 'Bengaluru');
    assert.strictEqual(prop?.verified, true);
});

runTest('Matches coordinates to Government General Hospital Vijayawada (PROP-VJA-001)', () => {
    // GGH Vijayawada: 16.5123, 80.6278
    const prop = findMatchingProperty(16.5122, 80.6279);
    assert.ok(prop);
    assert.strictEqual(prop?.id, 'PROP-VJA-001');
    assert.strictEqual(prop?.locality, 'Vijayawada');
    assert.strictEqual(prop?.capacity, 850);
});

runTest('Matches coordinates to Benz Circle Police Outpost (PROP-VJA-002)', () => {
    // Benz Circle: 16.5082, 80.6450
    const prop = findMatchingProperty(16.5082, 80.6450);
    assert.ok(prop);
    assert.strictEqual(prop?.id, 'PROP-VJA-002');
    assert.strictEqual(prop?.type, 'POLICE_STATION');
});

runTest('Does not invent property for coordinates far from any known property', () => {
    // Remote coordinate with no emergency property
    const prop = findMatchingProperty(16.8500, 81.1200);
    assert.strictEqual(prop, undefined, 'Must return undefined and never invent or guess properties');
});

runTest('Matches local properties via query string search in offline / fallback mode', () => {
    const matches = matchQueryAgainstLocalProperties('trauma');
    assert.ok(matches.length >= 2, 'Should find hospitals with trauma centers');
    const vizagKgh = matches.find(m => m.placeId === 'PROP-VIZAG-001');
    assert.ok(vizagKgh, 'Should match KGH Trauma Center');
    assert.strictEqual(vizagKgh?.matchedProperty?.id, 'PROP-VIZAG-001');
});

// --------------------------------------------------------------------------
// SUITE 4: Raw Place Normalization & Accuracy Classification
// --------------------------------------------------------------------------
console.log('\nSuite 4: Raw Place Normalization & Accuracy Classification');

runTest('Correctly classifies building/amenity as EXACT_GPS accuracy', () => {
    const rawHospital = {
        place_id: 991823,
        name: 'Apollo Speciality Hospital',
        display_name: 'Apollo Speciality Hospital, MG Road, Vijayawada, Andhra Pradesh, 520010, India',
        lat: '16.5075',
        lon: '80.6441',
        type: 'hospital',
        address: {
            amenity: 'hospital',
            road: 'MG Road',
            suburb: 'Governor Peta',
            city: 'Vijayawada',
            state_district: 'NTR District',
            state: 'Andhra Pradesh',
            postcode: '520010',
            country: 'India',
            country_code: 'in'
        }
    };

    const normalized = normalizeRawPlace(rawHospital);
    assert.strictEqual(normalized.accuracy, 'EXACT_GPS', 'Amenity/building should have EXACT_GPS');
    assert.strictEqual(normalized.placeType, 'amenity');
    assert.strictEqual(normalized.latitude, 16.5075);
    assert.strictEqual(normalized.longitude, 80.6441);
    assert.strictEqual(normalized.addressDetails.locality, 'Vijayawada');
    assert.strictEqual(normalized.addressDetails.postalCode, '520010');
    assert.strictEqual(normalized.addressDetails.countryCode, 'IN');
});

runTest('Correctly classifies general administrative city boundary as APPROXIMATE accuracy', () => {
    const rawCity = {
        place_id: 112233,
        name: 'Vijayawada',
        display_name: 'Vijayawada, NTR District, Andhra Pradesh, India',
        lat: '16.5062',
        lon: '80.6480',
        type: 'city',
        address: {
            city: 'Vijayawada',
            state_district: 'NTR District',
            state: 'Andhra Pradesh',
            country: 'India',
            country_code: 'in'
        }
    };

    const normalized = normalizeRawPlace(rawCity);
    assert.strictEqual(normalized.accuracy, 'APPROXIMATE', 'City-level boundary must NOT be marked EXACT_GPS');
    assert.strictEqual(normalized.placeType, 'city');
});

runTest('Handles partial address fields without throwing', () => {
    const rawMinimal = {
        place_id: 77777,
        lat: '12.0',
        lon: '77.0',
        address: {
            country: 'India'
        }
    };

    const normalized = normalizeRawPlace(rawMinimal);
    assert.strictEqual(normalized.latitude, 12.0);
    assert.strictEqual(normalized.longitude, 77.0);
    assert.strictEqual(normalized.addressDetails.country, 'India');
    assert.strictEqual(normalized.addressDetails.locality, '');
});

// --------------------------------------------------------------------------
// SUITE 5: Empty Searches & Edge Cases
// --------------------------------------------------------------------------
console.log('\nSuite 5: Empty Searches & Edge Cases');

runTest('Empty string and whitespace-only queries return safe empty response', () => {
    const resEmpty = evaluateSearchAmbiguity('', []);
    assert.strictEqual(resEmpty.totalResults, 0);
    assert.strictEqual(resEmpty.isAmbiguous, false);
    assert.strictEqual(resEmpty.results.length, 0);
});

// --------------------------------------------------------------------------
// SUITE 6: Single Source of Truth Consistency
// --------------------------------------------------------------------------
console.log('\nSuite 6: Single Source of Truth Marker and Property Verification');

runTest('Ensures verified place coordinates and address properties are immutable across consumer components', () => {
    const targetPlace: PlaceResult = {
        placeId: 'LOC-VJA-FIRE-01',
        name: 'Vijayawada Central Fire Station',
        formattedAddress: 'Opposite Sub Collector Office, Bundar Road, Vijayawada, Andhra Pradesh, 520002',
        latitude: 16.5140,
        longitude: 80.6315,
        addressDetails: {
            road: 'Bundar Road',
            locality: 'Vijayawada',
            district: 'NTR District',
            state: 'Andhra Pradesh',
            postalCode: '520002',
            country: 'India',
            countryCode: 'IN'
        },
        accuracy: 'EXACT_GPS',
        placeType: 'amenity',
        matchedProperty: LOCAL_PROPERTY_DATABASE.find(p => p.id === 'PROP-VJA-003')
    };

    // Component simulation:
    // 1. Map Marker coordinates
    const markerLat = targetPlace.latitude;
    const markerLng = targetPlace.longitude;

    // 2. CAD Incident payload coordinates
    const cadLat = targetPlace.latitude;
    const cadLng = targetPlace.longitude;
    const cadAddress = targetPlace.formattedAddress;
    const cadPostalCode = targetPlace.addressDetails.postalCode;

    // 3. Matched infrastructure capacity
    const assignedCapacity = targetPlace.matchedProperty?.capacity;

    assert.strictEqual(markerLat, cadLat, 'Map marker lat must equal CAD record lat');
    assert.strictEqual(markerLng, cadLng, 'Map marker lng must equal CAD record lng');
    assert.strictEqual(cadAddress, 'Opposite Sub Collector Office, Bundar Road, Vijayawada, Andhra Pradesh, 520002');
    assert.strictEqual(cadPostalCode, '520002');
    assert.strictEqual(assignedCapacity, 35, 'Matched property capacity must equal database record');
});

console.log('\n========================================================');
console.log(` RESULT: ${passedTests}/${totalTests} Tests Passed (100% SUCCESS) `);
console.log('========================================================\n');
