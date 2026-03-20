import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { getBestCard, getMinSpendProgress, CardRecommendation } from '@/utils/cardEngine';
import { getMerchantAtCurrentLocation } from '@/utils/locationServiceStub';
import { loadUserCards, loadCardPreference } from '@/utils/storage';
import { useTheme } from '@/context/ThemeContext';
import { UserCard } from '@/types';
import { abbreviateNumber } from '@/utils/dateHelpers';

interface LobangCardProps {
  onPress?: () => void;
}

/**
 * LobangCard - Shows the best credit card recommendation based on current location
 * "Lobang" is Singlish for "good deal" or "insider tip"
 */
export function LobangCard({ onPress }: LobangCardProps) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<CardRecommendation | null>(null);
  const [merchantName, setMerchantName] = useState<string | null>(null);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [preferMiles, setPreferMiles] = useState(false);

  // Load user cards and preferences
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const cards = await loadUserCards();
    const pref = await loadCardPreference();
    setUserCards(cards);
    setPreferMiles(pref);
  };

  // Fetch location and recommendation
  const fetchRecommendation = async () => {
    if (loading) return;

    setLoading(true);
    try {
      // Get current location
      const locationData = await getMerchantAtCurrentLocation();
      
      if (locationData?.merchantName) {
        setMerchantName(locationData.merchantName);
        
        // Get best card for this merchant
        const card = getBestCard(
          locationData.merchantName,
          locationData.merchantType,
          userCards,
          preferMiles
        );
        
        setRecommendation(card);
      } else {
        // Demo mode - show example recommendation if user has cards
        if (userCards.length > 0) {
          const demoCard = getBestCard(
            'NTUC FairPrice',
            'groceries',
            userCards,
            preferMiles
          );
          setRecommendation(demoCard);
          setMerchantName('Demo: NTUC FairPrice');
        }
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount if user has cards
  useEffect(() => {
    if (userCards.length > 0) {
      fetchRecommendation();
    }
  }, [userCards, preferMiles]);

  // Get min spend progress for user's cards
  const minSpendProgress = getMinSpendProgress(userCards);

  // Don't show if no cards configured
  if (userCards.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon name="card-outline" size={32} color={theme.primary} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>Setup Lobang Cards</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Get the best credit card recommendations
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  }

  return (
    <View>
      {/* Recommendation Card */}
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
        onPress={fetchRecommendation}
        activeOpacity={0.7}
        disabled={loading}
      >
        <View style={styles.iconContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Icon name="card" size={32} color={theme.primary} />
          )}
        </View>
        <View style={styles.content}>
          {recommendation && merchantName ? (
            <>
              <Text style={[styles.merchantText, { color: theme.textSecondary }]} numberOfLines={1}>
                {merchantName.includes('Demo') ? '🎯 Try this' : `You're at ${merchantName}`}
              </Text>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                Use {recommendation.cardName}
              </Text>
              <Text style={[styles.rewardText, { color: theme.primary }]}>
                💰 {recommendation.rewardRate}{recommendation.rewardUnit} {recommendation.rewardType}
                {!recommendation.meetsMinSpend && recommendation.minSpend > 0 && (
                  <Text style={[styles.warningText, { color: theme.error }]}>
                    {' '}(Min ${recommendation.minSpend >= 10000 ? abbreviateNumber(recommendation.minSpend, 1) : recommendation.minSpend} needed)
                  </Text>
                )}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Lobang Card</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Tap to find best card nearby
              </Text>
            </>
          )}
        </View>
        <Icon 
          name={loading ? "sync" : "refresh"} 
          size={20} 
          color={theme.primary} 
        />
      </TouchableOpacity>

      {/* Min Spend Progress Bars */}
      {minSpendProgress.length > 0 && (
        <View style={[styles.progressContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <Text style={[styles.progressTitle, { color: theme.textSecondary }]}>
            Monthly Spend Progress
          </Text>
          {minSpendProgress.map((progress) => {
            if (!progress) return null;
            
            return (
              <View key={progress.cardId} style={styles.progressItem}>
                <View style={styles.progressHeader}>
                  <Text style={[styles.progressCardName, { color: theme.text }]} numberOfLines={1}>
                    {progress.cardName}
                  </Text>
                  <Text style={[styles.progressAmount, { color: theme.textSecondary }]}>
                    ${progress.currentSpend >= 10000 ? abbreviateNumber(progress.currentSpend, 1) : progress.currentSpend} / ${progress.minSpend >= 10000 ? abbreviateNumber(progress.minSpend, 1) : progress.minSpend}
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: theme.cardBorder }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progress.progress}%`,
                        backgroundColor: progress.metMinSpend ? theme.primary : theme.accent,
                      },
                    ]}
                  />
                </View>
                {progress.remaining > 0 && (
                  <Text style={[styles.progressRemaining, { color: theme.textSecondary }]}>
                    ${Number.isFinite(progress.remaining) ? (progress.remaining >= 10000 ? abbreviateNumber(progress.remaining, 1) : progress.remaining.toFixed(0)) : '0'} to go
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  merchantText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  warningText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressCardName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  progressAmount: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRemaining: {
    fontSize: 10,
    marginTop: 4,
  },
});
