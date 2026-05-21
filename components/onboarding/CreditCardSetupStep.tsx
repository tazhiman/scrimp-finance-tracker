import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { getAllCards } from '@/utils/cardEngine';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { UserCard } from '@/types';

const { width } = Dimensions.get('window');

interface SelectedCardData {
  id: string;
  name: string;
  currentSpend: number;
  brandColor?: string;
}

const buildInitialSelection = (initialCards?: UserCard[]): Map<string, SelectedCardData> => {
  const map = new Map<string, SelectedCardData>();
  if (!initialCards?.length) return map;
  for (const card of initialCards) {
    map.set(card.id, {
      id: card.id,
      name: card.name,
      currentSpend: card.currentSpend,
    });
  }
  return map;
};

interface CreditCardSetupStepProps {
  initialCards?: UserCard[];
  onNext: (cards: UserCard[]) => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function CreditCardSetupStep({ initialCards, onNext, onSkip, onBack }: CreditCardSetupStepProps) {
  const { theme, themeMode } = useTheme();
  const [availableCards, setAvailableCards] = useState<any[]>([]);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});
  const [selectedCards, setSelectedCards] = useState<Map<string, SelectedCardData>>(() =>
    buildInitialSelection(initialCards)
  );
  const [editingSpend, setEditingSpend] = useState<string | null>(null);

  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  useEffect(() => {
    const cards = getAllCards();
    setAvailableCards(cards);
    loadImages(cards);
    if (initialCards?.length) {
      setSelectedCards(prev => {
        const next = new Map(prev);
        for (const card of initialCards) {
          const catalog = cards.find((c: { id: string }) => c.id === card.id);
          next.set(card.id, {
            id: card.id,
            name: card.name,
            currentSpend: card.currentSpend,
            brandColor: catalog?.brandColor,
          });
        }
        return next;
      });
    }
  }, []);

  const loadImages = async (cards: any[]) => {
    const images: Record<string, string | null> = {};
    await Promise.all(
      cards.map(async (card: any) => {
        if (card.imageUrl) {
          const cached = await getCachedCardImage(card.id);
          images[card.id] = cached;
        }
      })
    );
    setCardImages(images);
  };

  const toggleCard = (card: any) => {
    setSelectedCards(prev => {
      const next = new Map(prev);
      if (next.has(card.id)) {
        next.delete(card.id);
        if (editingSpend === card.id) setEditingSpend(null);
      } else {
        next.set(card.id, {
          id: card.id,
          name: card.name,
          currentSpend: 0,
          brandColor: card.brandColor,
        });
      }
      return next;
    });
  };

  const updateSpend = (cardId: string, value: string) => {
    setSelectedCards(prev => {
      const next = new Map(prev);
      const existing = next.get(cardId);
      if (existing) {
        next.set(cardId, { ...existing, currentSpend: parseFloat(value) || 0 });
      }
      return next;
    });
  };

  const handleNext = () => {
    const cards: UserCard[] = Array.from(selectedCards.values()).map(c => ({
      id: c.id,
      name: c.name,
      currentSpend: c.currentSpend,
    }));
    onNext(cards);
  };

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, { color: theme.primary }]}>Skip for Now</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>Select Your Cards</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose the credit cards you use. Tap a card to enter your current monthly spend.
        </Text>

        {availableCards.map(card => {
          const isSelected = selectedCards.has(card.id);
          const imageUrl = cardImages[card.id];
          const brandColor = card.brandColor || '#666';
          const cardData = selectedCards.get(card.id);

          return (
            <View key={card.id}>
              <TouchableOpacity
                style={[
                  styles.cardRow,
                  {
                    backgroundColor: isSelected ? theme.primary + '10' : theme.cardBackground,
                    borderColor: isSelected ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => toggleCard(card)}
                activeOpacity={0.7}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImagePlaceholder, { backgroundColor: brandColor }]}>
                    <Icon name="card" size={16} color="#FFF" />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{card.name}</Text>
                  {card.issuer && (
                    <Text style={[styles.cardIssuer, { color: theme.textSecondary }]} numberOfLines={1}>
                      {card.issuer}
                    </Text>
                  )}
                </View>
                <Icon
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={isSelected ? theme.primary : theme.textTertiary}
                />
              </TouchableOpacity>

              {isSelected && (
                <View style={[styles.spendRow, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                  <Text style={[styles.spendLabel, { color: theme.textSecondary }]}>Current month spend</Text>
                  <View style={[styles.spendInput, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.spendCurrency, { color: theme.textSecondary }]}>$</Text>
                    <TextInput
                      style={[styles.spendValue, { color: theme.text }]}
                      value={cardData?.currentSpend ? String(cardData.currentSpend) : ''}
                      onChangeText={(v) => updateSpend(card.id, v)}
                      placeholder="0.00"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>
            {selectedCards.size > 0 ? 'Continue' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 2,
    gap: 12,
  },
  cardImage: {
    width: 48,
    height: 30,
    borderRadius: 6,
  },
  cardImagePlaceholder: {
    width: 48,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardIssuer: {
    fontSize: 12,
    marginTop: 1,
  },
  spendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderTopWidth: 0,
    marginTop: -2,
  },
  spendLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  spendInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 100,
  },
  spendCurrency: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 2,
  },
  spendValue: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
