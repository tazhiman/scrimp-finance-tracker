import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMinSpendProgress, getAllCards } from '@/utils/cardEngine';
import { loadUserCards, loadCardPreference } from '@/utils/storage';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { useTheme } from '@/context/ThemeContext';
import { UserCard } from '@/types';

interface CreditCardStatsProps {
  onManagePress?: () => void;
}

/**
 * CreditCardStats - Shows credit card spending progress and stats
 */
export function CreditCardStats({ onManagePress }: CreditCardStatsProps) {
  const { theme } = useTheme();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [preferMiles, setPreferMiles] = useState(false);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});

  // Load user cards and preferences
  useEffect(() => {
    loadUserData();
  }, []);

  // Add focus listener to reload data when returning to dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      loadUserData();
    }, 2000); // Refresh every 2 seconds when on dashboard

    return () => clearInterval(interval);
  }, []);

  const loadUserData = async () => {
    const cards = await loadUserCards();
    const pref = await loadCardPreference();
    setUserCards(cards);
    setPreferMiles(pref);
    
    // Only load images if we don't have them yet or cards changed
    if (Object.keys(cardImages).length === 0 || cards.length !== userCards.length) {
      const allCards = getAllCards();
      const images: Record<string, string | null> = {};
      
      await Promise.all(
        cards.map(async (userCard) => {
          const cardData = allCards.find(c => c.id === userCard.id);
          if (cardData && (cardData as any).imageUrl) {
            const cachedImage = await getCachedCardImage(userCard.id);
            images[userCard.id] = cachedImage;
          }
        })
      );
      
      setCardImages(images);
    }
  };

  // Get min spend progress for user's cards
  const minSpendProgress = getMinSpendProgress(userCards);

  // Don't show if no cards configured
  if (userCards.length === 0) {
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Credit Cards</Text>
        <TouchableOpacity
          style={[styles.setupCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
          onPress={onManagePress}
          activeOpacity={0.7}
        >
          <View style={styles.setupContent}>
            <Ionicons name="card-outline" size={32} color={theme.primary} />
            <View style={styles.setupText}>
              <Text style={[styles.setupTitle, { color: theme.text }]}>Setup Credit Cards</Text>
              <Text style={[styles.setupSubtitle, { color: theme.textSecondary }]}>
                Track your card spending and rewards
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Credit Cards</Text>
        <TouchableOpacity onPress={onManagePress} activeOpacity={0.7}>
          <Text style={[styles.manageButton, { color: theme.primary }]}>Manage</Text>
        </TouchableOpacity>
      </View>

      {/* Min Spend Progress Cards */}
      {minSpendProgress.length > 0 && (
        <View style={[styles.progressContainer, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {minSpendProgress.map((progress, index) => {
            if (!progress) return null;
            
            return (
              <View key={progress.cardId}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />}
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={styles.cardNameRow}>
                      {(() => {
                        const userCard = userCards.find(c => c.id === progress.cardId) as any;
                        const isCustom = userCard?.isCustom;
                        
                        if (!isCustom && cardImages[progress.cardId]) {
                          return (
                            <Image 
                              source={{ uri: cardImages[progress.cardId]! }} 
                              style={styles.cardImageSmall}
                              resizeMode="cover"
                            />
                          );
                        } else {
                          const brandColor = isCustom 
                            ? theme.accent 
                            : (getAllCards().find(c => c.id === progress.cardId)?.brandColor || '#666');
                          
                          return (
                            <View style={[styles.cardVisualSmall, { backgroundColor: brandColor }]}>
                              <Ionicons name="card" size={10} color="#FFF" />
                            </View>
                          );
                        }
                      })()}
                      <Text style={[styles.progressCardName, { color: theme.text }]} numberOfLines={1}>
                        {progress.cardName}
                      </Text>
                      {(() => {
                        const userCard = userCards.find(c => c.id === progress.cardId) as any;
                        if (userCard?.isCustom) {
                          return (
                            <View style={[styles.customTag, { backgroundColor: theme.accent }]}>
                              <Text style={styles.customTagText}>Custom</Text>
                            </View>
                          );
                        }
                        return null;
                      })()}
                    </View>
                    {(() => {
                      const userCard = userCards.find(c => c.id === progress.cardId) as any;
                      const isCustomWithNoMinSpend = userCard?.isCustom && (userCard?.minSpend || 0) === 0;
                      
                      // Only show checkmark if:
                      // 1. Min spend is met, AND
                      // 2. It's not a custom card with no minimum spend
                      if (progress.metMinSpend && !isCustomWithNoMinSpend) {
                        return (
                          <View style={[styles.metBadge, { backgroundColor: theme.primary }]}>
                            <Ionicons name="checkmark" size={10} color="#000" />
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>
                  
                  <View style={styles.progressAmounts}>
                    <Text style={[styles.progressAmount, { color: theme.text }]}>
                      ${progress.currentSpend.toFixed(0)}
                    </Text>
                    <Text style={[styles.progressTarget, { color: theme.textSecondary }]}>
                      {progress.minSpend > 0 ? ` / $${progress.minSpend}` : ''}
                    </Text>
                  </View>

                  {progress.minSpend > 0 && (
                    <>
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
                          ${progress.remaining.toFixed(0)} remaining
                        </Text>
                      )}
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  manageButton: {
    fontSize: 13,
    fontWeight: '600',
  },
  setupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  setupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  setupText: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  setupSubtitle: {
    fontSize: 12,
  },
  progressContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  progressItem: {
    paddingVertical: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardVisualSmall: {
    width: 36,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageSmall: {
    width: 36,
    height: 22,
    borderRadius: 4,
  },
  progressCardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  metBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  customTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  progressAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressTarget: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRemaining: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
});
