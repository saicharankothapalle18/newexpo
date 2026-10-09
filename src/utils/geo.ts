/**
 * Computes the Haversine spherical distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(2)} km`;
}

/**
 * Adds a small randomized geographic jitter (offset in km) for simulation.
 */
export function addRandomGeoOffset(
    lat: number,
    lng: number,
    maxDistanceKm: number = 1.0
): { latitude: number; longitude: number } {
    const latOffset = (Math.random() - 0.5) * 2 * (maxDistanceKm / 111);
    const cosLat = Math.cos(toRad(lat));
    const lngOffset = (Math.random() - 0.5) * 2 * (maxDistanceKm / (111 * (Math.abs(cosLat) > 0.01 ? cosLat : 1)));
    return {
        latitude: lat + latOffset,
        longitude: lng + lngOffset
    };
}

/**
 * Default Initial Map Location: Main Disaster Dataset (Chennai Disaster Operations Zone)
 * Covers: Velachery MRTS (12.9796, 80.2185), Tambaram Fire (12.9280, 80.1220), Medavakkam (12.9200, 80.1884), Saidapet (13.0213, 80.2231)
 */
export const DEFAULT_MAP_CENTER = {
    lat: 12.9600,
    lng: 80.1800
};

export const DEFAULT_MAP_ZOOM = 12;

export interface WorldwideLocationPreset {
    id: string;
    name: string;
    country: string;
    flag: string;
    lat: number;
    lng: number;
    zoom: number;
}

export const WORLDWIDE_LOCATION_PRESETS: WorldwideLocationPreset[] = [
    {
        id: 'CHENNAI_DATASET',
        name: 'Main Dataset Operations (Chennai)',
        country: 'India',
        flag: '🚨',
        lat: 12.9600,
        lng: 80.1800,
        zoom: 12
    },
    {
        id: 'AP_INDIA',
        name: 'Andhra Pradesh',
        country: 'India',
        flag: '🇮🇳',
        lat: 15.9129,
        lng: 79.7400,
        zoom: 7
    },
    {
        id: 'VIJAYAWADA',
        name: 'Vijayawada, AP',
        country: 'India',
        flag: '🇮🇳',
        lat: 16.5062,
        lng: 80.6480,
        zoom: 13
    },
    {
        id: 'VIZAG',
        name: 'Visakhapatnam, AP',
        country: 'India',
        flag: '🇮🇳',
        lat: 17.6868,
        lng: 83.2185,
        zoom: 13
    },
    {
        id: 'LONDON_UK',
        name: 'London',
        country: 'United Kingdom',
        flag: '🇬🇧',
        lat: 51.5074,
        lng: -0.1278,
        zoom: 12
    },
    {
        id: 'TOKYO_JP',
        name: 'Tokyo',
        country: 'Japan',
        flag: '🇯🇵',
        lat: 35.6762,
        lng: 139.6503,
        zoom: 12
    },
    {
        id: 'SF_USA',
        name: 'San Francisco, CA',
        country: 'United States',
        flag: '🇺🇸',
        lat: 37.7749,
        lng: -122.4194,
        zoom: 12
    },
    {
        id: 'NYC_USA',
        name: 'New York City, NY',
        country: 'United States',
        flag: '🇺🇸',
        lat: 40.7128,
        lng: -74.0060,
        zoom: 12
    },
    {
        id: 'SYDNEY_AU',
        name: 'Sydney',
        country: 'Australia',
        flag: '🇦🇺',
        lat: -33.8688,
        lng: 151.2093,
        zoom: 12
    },
    {
        id: 'VANCOUVER_CA',
        name: 'Vancouver, BC',
        country: 'Canada',
        flag: '🇨🇦',
        lat: 49.2827,
        lng: -123.1207,
        zoom: 12
    },
    {
        id: 'GLOBAL_VIEW',
        name: 'Entire World',
        country: 'Global',
        flag: '🌍',
        lat: 20.0,
        lng: 0.0,
        zoom: 2
    }
];

