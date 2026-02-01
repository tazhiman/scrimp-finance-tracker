/**
 * Debug script to check cached images
 * 
 * Run this to see what images are cached:
 * npx ts-node scripts/checkImageCache.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

async function checkCache() {
  try {
    console.log('Checking cached images...\n');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const imageKeys = allKeys.filter(key => key.startsWith('@finance_tracker:card_image:'));
    
    console.log(`Found ${imageKeys.length} cached images:\n`);
    
    for (const key of imageKeys) {
      const cardId = key.replace('@finance_tracker:card_image:', '');
      const imageData = await AsyncStorage.getItem(key);
      
      if (imageData) {
        const sizeKB = (imageData.length / 1024).toFixed(2);
        const isDataUrl = imageData.startsWith('data:image');
        console.log(`✓ ${cardId}: ${sizeKB} KB ${isDataUrl ? '(valid data URL)' : '(WARNING: not a data URL)'}`);
      }
    }
    
    if (imageKeys.length === 0) {
      console.log('No images cached yet.');
      console.log('\nPossible reasons:');
      console.log('1. Remote sync not configured (check config/remoteConfig.ts)');
      console.log('2. Images haven\'t been uploaded to GitHub yet');
      console.log('3. Sync hasn\'t run yet (happens on app start if cache stale)');
    }
    
  } catch (error) {
    console.error('Error checking cache:', error);
  }
}

checkCache();
