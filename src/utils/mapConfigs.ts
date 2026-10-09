export type BasemapProvider = 'GOOGLE_ROADMAP' | 'GOOGLE_TRAFFIC' | 'GOOGLE_HYBRID' | 'GOOGLE_TERRAIN' | 'TACTICAL_DARK';

/**
 * Free Google Maps API Tile Providers & Tactical Basemaps
 * Standard Google Maps tile servers without required API keys
 */
export const BASEMAP_CONFIGS: Record<BasemapProvider, { label: string; icon: string; url: string; subdomains: string[]; maxZoom: number; attribution: string }> = {
    GOOGLE_ROADMAP: {
        label: 'Google Maps Standard',
        icon: '🗺️',
        url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps'
    },
    GOOGLE_TRAFFIC: {
        label: 'Google Real-Time Traffic',
        icon: '🚦',
        url: 'https://mt{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Traffic'
    },
    GOOGLE_HYBRID: {
        label: 'Google Satellite Hybrid',
        icon: '🛰️',
        url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Imagery'
    },
    GOOGLE_TERRAIN: {
        label: 'Google Physical Terrain',
        icon: '⛰️',
        url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Terrain'
    },
    TACTICAL_DARK: {
        label: 'Tactical High-Contrast Dark',
        icon: '🌙',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
    }
};
