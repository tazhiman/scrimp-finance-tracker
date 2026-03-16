import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { getMinSpendProgress, getAllCards } from '@/utils/cardEngine';
import { loadUserCards, loadCardPreference } from '@/utils/storage';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius } from '@/constants/design';
import { UserCard } from '@/types';
import { abbreviateNumber } from '@/utils/dateHelpers';

interface CreditCardStatsProps {
  onManagePress?: () => void;
}

export function CreditCardStats({ onManagePress }: CreditCardStatsProps) {
  const { theme } = useTheme();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [preferMiles, setPreferMiles] = useState(false);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const cards = await loadUserCards();
    const pref = await loadCardPreference();
    setUserCards(cards);
    setPreferMiles(pref);
    
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

  const minSpendProgress = getMinSpendProgress(userCards);

  if (userCards.length === 0) {
    return (
      <View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Credit Cards</Text>
        <TouchableOpacity
          onPress={onManagePress}
          activeOpacity={0.7}
        >
          <GlassCard style={styles.setupCard} intensity="subtle">
            <View style={styles.setupInner}>
              <View style={styles.setupContent}>
                <View style={[styles.setupIconCircle, { backgroundColor: theme.primary + '18' }]}>
                  <Ionicons name="card-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.setupText}>
                  <Text style={[styles.setupTitle, { color: theme.text }]}>Setup Credit Cards</Text>
                  <Text style={[styles.setupSubtitle, { color: theme.textSecondary }]}>
                    Track your card spending and rewards
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </GlassCard>
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

      {minSpendProgress.length > 0 && (
        <GlassCard style={styles.progressContainer} intensity="subtle">
          <View style={styles.progressInner}>
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
                          }
                          const brandColor = isCustom 
                            ? theme.accent 
                            : (getAllCards().find(c => c.id === progress.cardId)?.brandColor || '#666');
                          return (
                            <View style={[styles.cardVisualSmall, { backgroundColor: brandColor }]}>
                              <Ionicons name="card" size={10} color="#FFF" />
                            </View>
                          );
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
                        ${Number.isFinite(progress.currentSpend) ? (progress.currentSpend >= 10000 ? abbreviateNumber(progress.currentSpend, 1) : progress.currentSpend.toFixed(0)) : '0'}
                      </Text>
                      <Text style={[styles.progressTarget, { color: theme.textSecondary }]}>
                        {progress.minSpend > 0 ? ` / $${progress.minSpend >= 10000 ? abbreviateNumber(progress.minSpend, 1) : progress.minSpend}` : ''}
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
                            ${Number.isFinite(progress.remaining) ? (progress.remaining >= 10000 ? abbreviateNumber(progress.remaining, 1) : progress.remaining.toFixed(0)) : '0'} remaining
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  manageButton: {
    fontSize: 14,
    fontWeight: '600',
  },
  setupCard: {
    marginBottom: Spacing.lg,
  },
  setupInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  setupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flex: 1,
  },
  setupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: Spacing.lg,
  },
  progressInner: {
    padding: Spacing.xl,
  },
  progressItem: {
    paddingVertical: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  cardVisualSmall: {
    width: 36,
    height: 22,
    borderRadius: Radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageSmall: {
    width: 36,
    height: 22,
    borderRadius: Radius.xs,
  },
  progressCardName: {
    fontSize: 14,
    fontWeight: '600',
  },
  metBadge: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customTag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: Spacing.xs,
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
    marginBottom: Spacing.sm,
  },
  progressAmount: {
    fontSize: 17,
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
    marginBottom: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressRemaining: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.lg,
  },
});
