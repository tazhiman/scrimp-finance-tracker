import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';

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
 * Request location permissions
 */
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
  }

  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Scrimp needs access to your location to recommend the best card for nearby merchants.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  return false;
}

/**
 * Get current location coordinates
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
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
 * Fetch merchant data from Google Places API (stub for now)
 * In production, you'll need to:
 * 1. Get a Google Places API key
 * 2. Enable Places API in Google Cloud Console
 * 3. Store API key in environment variables
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

  // Stub implementation - in production, call Google Places API
  const locationData: LocationData = {
    latitude,
    longitude,
    merchantName: undefined, // Would be populated from API
    merchantType: undefined, // Would be populated from API
    timestamp: Date.now(),
  };

  // Example of how you would call Google Places API:
  /*
  try {
    const GOOGLE_PLACES_API_KEY = 'YOUR_API_KEY';
    const radius = 50; // 50 meters
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const place = data.results[0];
      locationData.merchantName = place.name;
      locationData.merchantType = place.types[0];
    }
  } catch (error) {
    console.error('Error fetching from Google Places:', error);
  }
  */

  // Cache the result
  await cacheLocationData(locationData);

  return locationData;
}

/**
 * Main function to get merchant info based on current location
 */
export async function getMerchantAtCurrentLocation(): Promise<LocationData | null> {
  try {
    const coords = await getCurrentLocation();
    if (!coords) {
      return null;
    }

    const merchantData = await fetchMerchantFromLocation(coords.latitude, coords.longitude);
    return merchantData;
  } catch (error) {
    console.error('Error getting merchant at location:', error);
    return null;
  }
}

/**
 * Clear location cache (for testing/settings)
 */
export async function clearLocationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing location cache:', error);
  }
}
