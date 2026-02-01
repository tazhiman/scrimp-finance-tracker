/**
 * Clear the rewards data cache
 * This will force a fresh sync from GitHub on next app launch
 * 
 * Run: node scripts/clearCache.js
 */

const AsyncStorage = require('@react-native-async-storage/async-storage').default;

async function clearCache() {
  try {
    console.log('Clearing rewards data cache...\n');
    
    const allKeys = await AsyncStorage.getAllKeys();
    
    const rewardKeys = allKeys.filter(key => 
      key.startsWith('@finance_tracker:rewards_data') || 
      key.startsWith('@finance_tracker:card_image:')
    );
    
    if (rewardKeys.length === 0) {
      console.log('No cache found.');
      return;
    }
    
    console.log(`Found ${rewardKeys.length} cached items:`);
    rewardKeys.forEach(key => console.log(`  - ${key}`));
    
    console.log('\nDeleting...');
    await AsyncStorage.multiRemove(rewardKeys);
    
    console.log('✓ Cache cleared successfully!');
    console.log('\nNext app launch will fetch fresh data from GitHub.');
    
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

clearCache();
