/**
 * Stub implementation of location service
 * Replace this with the full implementation once react-native-geolocation-service is installed
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_CACHE_KEY = '@finance_tracker:location_cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LocationData {
  latitude: number;
  longitude: number;
  merchantName?: string;
  merchantType?: string;
  timestamp: number;
}

interface CachedLocation {
  key: string;
  data: LocationData;
}

/**
 * Stub: Get current location - returns null for now
 * Install react-native-geolocation-service and uncomment locationService.ts to enable
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  console.log('Location service not yet configured. Install react-native-geolocation-service to enable.');
  return null;
}

/**
 * Generate cache key from coordinates (rounded to ~100m precision)
 */
function generateLocationKey(latitude: number, longitude: number): string {
  const lat = Math.round(latitude * 1000) / 1000;
  const lng = Math.round(longitude * 1000) / 1000;
  return `${lat},${lng}`;
}

/**
 * Load location cache from storage
 */
async function loadLocationCache(): Promise<CachedLocation[]> {
  try {
    const data = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
    if (!data) return [];

    const cache: CachedLocation[] = JSON.parse(data);
    const now = Date.now();

    // Filter out expired entries
    return cache.filter((item) => now - item.data.timestamp < CACHE_EXPIRY_MS);
  } catch (error) {
    console.error('Error loading location cache:', error);
    return [];
  }
}

/**
 * Save location cache to storage
 */
async function saveLocationCache(cache: CachedLocation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving location cache:', error);
  }
}

/**
 * Get cached location data
 */
async function getCachedLocation(
  latitude: number,
  longitude: number
): Promise<LocationData | null> {
  const cache = await loadLocationCache();
  const key = generateLocationKey(latitude, longitude);
  const cached = cache.find((item) => item.key === key);
  return cached ? cached.data : null;
}

/**
 * Cache location data
 */
async function cacheLocationData(data: LocationData): Promise<void> {
  const cache = await loadLocationCache();
  const key = generateLocationKey(data.latitude, data.longitude);

  // Remove existing entry for this location
  const filtered = cache.filter((item) => item.key !== key);

  // Add new entry
  filtered.push({ key, data });

  // Keep only last 50 entries
  if (filtered.length > 50) {
    filtered.shift();
  }

  await saveLocationCache(filtered);
}

/**
 * Stub: Fetch merchant data from location
 */
export async function fetchMerchantFromLocation(
  latitude: number,
  longitude: number
): Promise<LocationData> {
  // Check cache first
  const cached = await getCachedLocation(latitude, longitude);
  if (cached) {
    console.log('Using cached location data');
    return cached;
  }

  const locationData: LocationData = {
    latitude,
    longitude,
    merchantName: undefined,
    merchantType: undefined,
    timestamp: Date.now(),
  };

  await cacheLocationData(locationData);
  return locationData;
}

/**
 * Stub: Get merchant at current location
 */
export async function getMerchantAtCurrentLocation(): Promise<LocationData | null> {
  console.log('Location service stub - install react-native-geolocation-service to enable');
  return null;
}

/**
 * Clear location cache
 */
export async function clearLocationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
}
