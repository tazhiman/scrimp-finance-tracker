import AsyncStorage from '@react-native-async-storage/async-storage';
import bundledRewardsData from '@/data/rewardsData.json';
import { ENV } from '@/config/env';
import { REMOTE_CONFIG } from '@/config/remoteConfig';
import { fromByteArray } from 'base64-js';

const CACHE_KEYS = {
  REWARDS_DATA: '@finance_tracker:rewards_data_cache',
  REWARDS_META: '@finance_tracker:rewards_data_meta',
  CARD_IMAGE_PREFIX: '@finance_tracker:card_image:',
};

interface RewardsDataMeta {
  lastFetched: string;
  version: string;
  imageCount: number;
}

interface GitHubConfig {
  token: string;
  repoName: string; // format: "username/repo"
}

/**
 * Get GitHub configuration from app config
 */
function getGitHubConfig(): GitHubConfig | null {
  if (!REMOTE_CONFIG.ENABLED || !REMOTE_CONFIG.GITHUB_TOKEN || !REMOTE_CONFIG.GITHUB_REPO) {
    return null;
  }
  
  return {
    token: REMOTE_CONFIG.GITHUB_TOKEN,
    repoName: REMOTE_CONFIG.GITHUB_REPO,
  };
}

/**
 * Check if cache should be refreshed
 */
export async function shouldRefreshCache(): Promise<boolean> {
  try {
    const metaStr = await AsyncStorage.getItem(CACHE_KEYS.REWARDS_META);
    if (!metaStr) {
      return true; // No cache exists
    }
    
    const meta: RewardsDataMeta = JSON.parse(metaStr);
    const lastFetched = new Date(meta.lastFetched).getTime();
    const now = Date.now();
    
    const ttl = REMOTE_CONFIG.CACHE_TTL_MS || (24 * 60 * 60 * 1000);
    return (now - lastFetched) > ttl;
  } catch (error) {
    console.error('Error checking cache freshness:', error);
    return true; // Refresh on error
  }
}

/**
 * Get cached rewards data
 */
export async function getCachedRewardsData(): Promise<any | null> {
  try {
    const dataStr = await AsyncStorage.getItem(CACHE_KEYS.REWARDS_DATA);
    if (!dataStr) {
      return null;
    }
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('Error loading cached rewards data:', error);
    return null;
  }
}

/**
 * Save rewards data to cache
 */
async function saveRewardsDataToCache(data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.REWARDS_DATA, JSON.stringify(data));
    
    const meta: RewardsDataMeta = {
      lastFetched: new Date().toISOString(),
      version: data.version || '1.0.0',
      imageCount: data.cards?.filter((c: any) => c.imageUrl).length || 0,
    };
    
    await AsyncStorage.setItem(CACHE_KEYS.REWARDS_META, JSON.stringify(meta));
    console.log('Rewards data cached successfully');
  } catch (error) {
    console.error('Error saving rewards data to cache:', error);
    throw error;
  }
}

/**
 * Get cached card image
 */
export async function getCachedCardImage(cardId: string): Promise<string | null> {
  try {
    const imageData = await AsyncStorage.getItem(`${CACHE_KEYS.CARD_IMAGE_PREFIX}${cardId}`);
    return imageData;
  } catch (error) {
    console.error(`Error loading cached image for ${cardId}:`, error);
    return null;
  }
}

/**
 * Save card image to cache
 */
async function saveCardImageToCache(cardId: string, imageData: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${CACHE_KEYS.CARD_IMAGE_PREFIX}${cardId}`, imageData);
    console.log(`✓ Saved image for ${cardId} (${imageData.length} chars)`);
  } catch (error) {
    console.error(`Error saving image for ${cardId}:`, error);
    // Don't throw - image caching is not critical
  }
}

/**
 * Clear all card images from cache
 */
async function clearCardImagesCache(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const imageKeys = allKeys.filter(key => key.startsWith(CACHE_KEYS.CARD_IMAGE_PREFIX));
    if (imageKeys.length > 0) {
      await AsyncStorage.multiRemove(imageKeys);
      console.log(`Cleared ${imageKeys.length} cached images`);
    }
  } catch (error) {
    console.error('Error clearing image cache:', error);
  }
}

/**
 * Fetch rewards data from GitHub
 */
async function fetchRemoteRewardsData(config: GitHubConfig): Promise<any> {
  const url = `https://raw.githubusercontent.com/${config.repoName}/main/rewardsData.json`;
  
  console.log('Fetching rewards data from:', url);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${config.token}`,
      'Accept': 'application/vnd.github.v3.raw',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch rewards data: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log('Rewards data fetched successfully');
  return data;
}

/**
 * Convert array buffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return fromByteArray(bytes);
}

/**
 * Fetch and cache a single card image
 */
async function fetchCardImage(imageUrl: string, cardId: string, config: GitHubConfig): Promise<void> {
  try {
    // Construct full URL if relative path
    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `https://raw.githubusercontent.com/${config.repoName}/main/${imageUrl}`;
    
    console.log(`Fetching image for ${cardId}:`, fullUrl);
    
    const response = await fetch(fullUrl, {
      headers: {
        'Authorization': `token ${config.token}`,
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch image for ${cardId}: ${response.status}`);
      return;
    }
    
    // Convert to base64 (React Native compatible)
    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    
    // Determine content type from URL
    const contentType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    await saveCardImageToCache(cardId, dataUrl);
    console.log(`Image cached for ${cardId}`);
  } catch (error) {
    console.error(`Error fetching image for ${cardId}:`, error);
    // Don't throw - image failures shouldn't block app
  }
}

/**
 * Fetch all card images in parallel
 */
async function fetchAllCardImages(data: any, config: GitHubConfig): Promise<void> {
  const cards = data.cards || [];
  const cardsWithImages = cards.filter((card: any) => card.imageUrl);
  
  if (cardsWithImages.length === 0) {
    console.log('No card images to fetch');
    return;
  }
  
  console.log(`Fetching ${cardsWithImages.length} card images...`);
  
  // Fetch all images in parallel
  const fetchPromises = cardsWithImages.map((card: any) =>
    fetchCardImage(card.imageUrl, card.id, config)
  );
  
  await Promise.all(fetchPromises);
  console.log('All card images processed');
}

/**
 * Test GitHub connection
 */
export async function testGitHubConnection(token: string, repoName: string): Promise<{ success: boolean; message: string }> {
  try {
    const url = `https://api.github.com/repos/${repoName}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: 'Invalid token' };
      } else if (response.status === 404) {
        return { success: false, message: 'Repository not found or no access' };
      }
      return { success: false, message: `Error: ${response.status}` };
    }
    
    return { success: true, message: 'Connection successful!' };
  } catch (error) {
    return { success: false, message: `Connection failed: ${error}` };
  }
}

/**
 * Sync rewards data from GitHub
 */
export async function syncRewardsData(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Get GitHub config
    const config = getGitHubConfig();
    if (!config) {
      return {
        success: false,
        message: 'Remote data not configured.',
      };
    }
    
    // Fetch JSON data
    const data = await fetchRemoteRewardsData(config);
    
    // Clear old image cache
    await clearCardImagesCache();
    
    // Save JSON to cache
    await saveRewardsDataToCache(data);
    
    // Fetch and cache images (wait for completion)
    console.log('Starting image downloads...');
    await fetchAllCardImages(data, config);
    console.log('Image downloads complete!');
    
    return {
      success: true,
      message: 'Sync successful!',
      data,
    };
  } catch (error) {
    console.error('Error syncing rewards data:', error);
    return {
      success: false,
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<string | null> {
  try {
    const metaStr = await AsyncStorage.getItem(CACHE_KEYS.REWARDS_META);
    if (!metaStr) {
      return null;
    }
    
    const meta: RewardsDataMeta = JSON.parse(metaStr);
    return meta.lastFetched;
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

/**
 * Main entry point: Get rewards data (tries remote, cache, then bundled)
 */
export async function getRewardsData(): Promise<any> {
  try {
    // Check if remote sync is enabled
    const config = getGitHubConfig();
    
    if (!config) {
      if (ENV.isProduction) {
        return bundledRewardsData;
      }
      const cached = await getCachedRewardsData();
      if (cached) {
        console.log('Using cached rewards data');
        return cached;
      }
      console.log('Using bundled rewards data');
      return bundledRewardsData;
    }
    
    // Check if we should refresh
    const shouldRefresh = await shouldRefreshCache();
    
    if (shouldRefresh) {
      console.log('Cache stale or missing, attempting sync...');
      const syncResult = await syncRewardsData();
      
      if (syncResult.success && syncResult.data) {
        return syncResult.data;
      }
      
      console.log('Sync failed, trying cached data...');
    }
    
    // Try cached data
    const cached = await getCachedRewardsData();
    if (cached) {
      console.log('Using cached rewards data');
      return cached;
    }
    
    // Fall back to bundled data
    console.log('Using bundled rewards data');
    return bundledRewardsData;
  } catch (error) {
    console.error('Error getting rewards data:', error);
    return bundledRewardsData;
  }
}

/**
 * Force refresh rewards data
 */
export async function forceRefresh(): Promise<{ success: boolean; message: string }> {
  console.log('Force refreshing rewards data...');
  
  // Clear cache first to ensure fresh download
  await clearCardImagesCache();
  const allKeys = await AsyncStorage.getAllKeys();
  const rewardsKeys = allKeys.filter(key => 
    key === CACHE_KEYS.REWARDS_DATA || 
    key === CACHE_KEYS.REWARDS_META
  );
  if (rewardsKeys.length > 0) {
    await AsyncStorage.multiRemove(rewardsKeys);
  }
  
  return await syncRewardsData();
}

/**
 * Clear all cached data (for debugging)
 */
export async function clearAllCache(): Promise<void> {
  await clearCardImagesCache();
  await AsyncStorage.removeItem(CACHE_KEYS.REWARDS_DATA);
  await AsyncStorage.removeItem(CACHE_KEYS.REWARDS_META);
  console.log('All cache cleared');
}
