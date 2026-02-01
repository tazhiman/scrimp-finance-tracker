/**
 * Debug utility to clear rewards cache
 * Import and call this from your app to force a fresh sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearRewardsCache(): Promise<void> {
  try {
    console.log('🗑️  Clearing all rewards cache...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const rewardsKeys = allKeys.filter(key => 
      key.startsWith('@finance_tracker:rewards_') || 
      key.startsWith('@finance_tracker:card_image:')
    );
    
    console.log(`Found ${rewardsKeys.length} cached items to remove`);
    
    if (rewardsKeys.length > 0) {
      await AsyncStorage.multiRemove(rewardsKeys);
      console.log('✅ Cache cleared!');
    } else {
      console.log('No cache found');
    }
    
    console.log('Next app restart will fetch fresh data from GitHub');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export async function inspectCache(): Promise<void> {
  try {
    const rewardsData = await AsyncStorage.getItem('@finance_tracker:rewards_data_cache');
    const rewardsMeta = await AsyncStorage.getItem('@finance_tracker:rewards_data_meta');
    
    console.log('📦 Cache Inspection:');
    console.log('-------------------');
    
    if (rewardsData) {
      const data = JSON.parse(rewardsData);
      console.log('Cached JSON version:', data.version || 'unknown');
      console.log('First card imageUrl:', data.cards?.[0]?.imageUrl || 'null');
      console.log('JSON size:', (rewardsData.length / 1024).toFixed(2), 'KB');
    } else {
      console.log('No JSON cache');
    }
    
    if (rewardsMeta) {
      const meta = JSON.parse(rewardsMeta);
      console.log('Last fetched:', meta.lastFetched);
      console.log('Cached version:', meta.version);
      console.log('Image count:', meta.imageCount);
    } else {
      console.log('No metadata cache');
    }
    
    const allKeys = await AsyncStorage.getAllKeys();
    const imageKeys = allKeys.filter(key => key.startsWith('@finance_tracker:card_image:'));
    console.log('Cached images:', imageKeys.length);
  } catch (error) {
    console.error('Error inspecting cache:', error);
  }
}
