import bundledRewardsData from '@/data/rewardsData.json';
import { getRewardsData } from './remoteRewardsData';

export interface UserCard {
  id: string;
  name: string;
  currentSpend?: number; // Current month spend on this card
}

// Module-level variable to store loaded rewards data
let loadedRewardsData: any = bundledRewardsData;
let isDataLoaded = false;

/**
 * Load rewards data (tries remote, cache, then bundled)
 * Call this on app initialization
 */
export async function loadRewardsData(): Promise<void> {
  try {
    loadedRewardsData = await getRewardsData();
    isDataLoaded = true;
    console.log('Rewards data loaded successfully');
  } catch (error) {
    console.error('Error loading rewards data:', error);
    loadedRewardsData = bundledRewardsData;
  }
}

/**
 * Get the currently loaded rewards data
 */
function getLoadedData(): any {
  return loadedRewardsData;
}

export interface CardRecommendation {
  cardId: string;
  cardName: string;
  rewardRate: number;
  rewardUnit: string;
  rewardType: 'cashback' | 'miles';
  conditions: string;
  minSpend: number;
  meetsMinSpend: boolean;
}

/**
 * Get the best card for a given merchant/category
 * @param merchantName - Name of the merchant
 * @param category - Optional category override
 * @param userCards - Array of user's cards
 * @param preferMiles - Toggle between miles vs cashback preference
 * @returns Best card recommendation or null if no match
 */
export function getBestCard(
  merchantName: string,
  category?: string,
  userCards?: UserCard[],
  preferMiles: boolean = false
): CardRecommendation | null {
  const rewardsData = getLoadedData();
  
  // Find merchant in mapping
  const merchantMapping = rewardsData.merchantMccMapping.find(
    (m: any) =>
      m.merchantName.toLowerCase() === merchantName.toLowerCase() ||
      m.aliases.some((alias: string) => alias.toLowerCase() === merchantName.toLowerCase())
  );

  if (!merchantMapping && !category) {
    return null;
  }

  const merchantCategory = category || merchantMapping?.category || '';
  const mcc = merchantMapping?.mcc || '';

  // Filter cards based on reward type preference
  let eligibleCards = rewardsData.cards.filter((card: any) => {
    // If user has specific cards, only consider those
    if (userCards && userCards.length > 0) {
      if (!userCards.some((uc) => uc.id === card.id)) {
        return false;
      }
    }

    // Filter by reward type preference
    if (preferMiles && card.rewardType !== 'miles') {
      return false;
    }
    if (!preferMiles && card.rewardType !== 'cashback') {
      return false;
    }

    return true;
  });

  // Score each card
  const scoredCards = eligibleCards.map((card: any) => {
    let bestReward = 0;
    let bestRewardConditions = '';

    // Check if card supports this MCC or category
    card.rewards.forEach((reward: any) => {
      const categoryMatch =
        reward.category === merchantCategory ||
        reward.category === 'online' ||
        reward.category === 'contactless' ||
        reward.category === 'general';

      const mccMatch = card.mccCodes.includes(mcc);

      if (categoryMatch || mccMatch || reward.category === 'general') {
        if (reward.rate > bestReward) {
          bestReward = reward.rate;
          bestRewardConditions = reward.conditions;
        }
      }
    });

    // Check if user meets min spend
    const userCard = userCards?.find((uc) => uc.id === card.id);
    const currentSpend = userCard?.currentSpend || 0;
    const meetsMinSpend = currentSpend >= card.minSpend || card.minSpend === 0;

    return {
      cardId: card.id,
      cardName: card.name,
      rewardRate: bestReward,
      rewardUnit: card.rewardType === 'miles' ? 'mpd' : '%',
      rewardType: card.rewardType,
      conditions: bestRewardConditions,
      minSpend: card.minSpend,
      meetsMinSpend,
      score: bestReward * (meetsMinSpend ? 1 : 0.5), // Penalize if min spend not met
    };
  });

  // Sort by score and return best
  scoredCards.sort((a: any, b: any) => b.score - a.score);

  if (scoredCards.length === 0) {
    return null;
  }

  const best = scoredCards[0];
  return {
    cardId: best.cardId,
    cardName: best.cardName,
    rewardRate: best.rewardRate,
    rewardUnit: best.rewardUnit,
    rewardType: best.rewardType as 'cashback' | 'miles',
    conditions: best.conditions,
    minSpend: best.minSpend,
    meetsMinSpend: best.meetsMinSpend,
  };
}

/**
 * Get merchant info from merchant name
 */
export function getMerchantInfo(merchantName: string) {
  const rewardsData = getLoadedData();
  
  const merchantMapping = rewardsData.merchantMccMapping.find(
    (m: any) =>
      m.merchantName.toLowerCase() === merchantName.toLowerCase() ||
      m.aliases.some((alias: string) => alias.toLowerCase() === merchantName.toLowerCase())
  );

  return merchantMapping || null;
}

/**
 * Calculate min spend progress for all cards
 */
export function getMinSpendProgress(userCards: UserCard[]) {
  const rewardsData = getLoadedData();
  
  return userCards.map((card: any) => {
    // Handle custom cards
    if (card.isCustom) {
      const currentSpend = card.currentSpend || 0;
      const minSpend = card.minSpend || 0;
      const progress = minSpend > 0 ? Math.min((currentSpend / minSpend) * 100, 100) : 100;
      const remaining = Math.max(minSpend - currentSpend, 0);

      return {
        cardId: card.id,
        cardName: card.name,
        currentSpend,
        minSpend,
        progress,
        remaining,
        metMinSpend: currentSpend >= minSpend || minSpend === 0,
      };
    }

    // Handle standard cards
    const cardData = rewardsData.cards.find((c: any) => c.id === card.id);
    if (!cardData) {
      return null;
    }

    const currentSpend = card.currentSpend || 0;
    const minSpend = cardData.minSpend;
    const progress = minSpend > 0 ? Math.min((currentSpend / minSpend) * 100, 100) : 100;
    const remaining = Math.max(minSpend - currentSpend, 0);

    return {
      cardId: card.id,
      cardName: cardData.name,
      currentSpend,
      minSpend,
      progress,
      remaining,
      metMinSpend: currentSpend >= minSpend || minSpend === 0,
    };
  }).filter(Boolean);
}

/**
 * Get all available cards (for user setup)
 */
export function getAllCards() {
  const rewardsData = getLoadedData();
  
  return rewardsData.cards.map((card: any) => ({
    id: card.id,
    name: card.name,
    issuer: card.issuer,
    rewardType: card.rewardType,
    minSpend: card.minSpend,
    imageUrl: card.imageUrl || null,
    brandColor: card.brandColor || '#666',
  }));
}
