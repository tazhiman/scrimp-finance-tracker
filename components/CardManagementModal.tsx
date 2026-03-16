import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
  TextInput,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/design';
import { getAllCards } from '@/utils/cardEngine';
import { loadUserCards, saveUserCards } from '@/utils/storage';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { UserCard } from '@/types';

interface CardManagementModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CardManagementModal({ visible, onClose }: CardManagementModalProps) {
  const { theme } = useTheme();
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});
  const [showCustomCardForm, setShowCustomCardForm] = useState(false);
  const [customCardName, setCustomCardName] = useState('');
  const [customCardMinSpend, setCustomCardMinSpend] = useState('');
  const availableCards = getAllCards();

  useEffect(() => {
    if (visible) {
      loadCards();
      loadCardImages();
      setShowCustomCardForm(false);
      setCustomCardName('');
      setCustomCardMinSpend('');
    }
  }, [visible]);

  const loadCards = async () => {
    const cards = await loadUserCards();
    setUserCards(cards);
    console.log('Loaded user cards:', cards);
    console.log('Available cards:', availableCards);
  };

  const loadCardImages = async () => {
    const images: Record<string, string | null> = {};
    
    // Load all card images in parallel
    await Promise.all(
      availableCards.map(async (card) => {
        if ((card as any).imageUrl) {
          const cachedImage = await getCachedCardImage(card.id);
          images[card.id] = cachedImage;
        }
      })
    );
    
    setCardImages(images);
  };

  const toggleCard = async (cardId: string, cardName: string) => {
    const existingIndex = userCards.findIndex(c => c.id === cardId);
    let newCards: UserCard[];
    
    if (existingIndex >= 0) {
      // Remove card
      newCards = userCards.filter(c => c.id !== cardId);
    } else {
      // Add card
      newCards = [...userCards, { id: cardId, name: cardName, currentSpend: 0 }];
    }
    
    setUserCards(newCards);
    await saveUserCards(newCards);
  };

  const handleAddCustomCard = async () => {
    if (!customCardName.trim()) {
      Alert.alert('Error', 'Please enter a card name');
      return;
    }

    // Create custom card ID
    const customCardId = `custom-${Date.now()}`;
    const minSpend = customCardMinSpend.trim() ? parseFloat(customCardMinSpend) : 0;

    if (customCardMinSpend.trim() && (isNaN(minSpend) || minSpend < 0)) {
      Alert.alert('Error', 'Please enter a valid minimum spend amount');
      return;
    }

    // Add to user cards with custom flag
    const newCard: UserCard & { isCustom?: boolean; minSpend?: number } = {
      id: customCardId,
      name: customCardName.trim(),
      currentSpend: 0,
      isCustom: true,
      minSpend: minSpend || 0,
    };

    const newCards = [...userCards, newCard];
    setUserCards(newCards);
    await saveUserCards(newCards);

    // Reset form and hide
    setCustomCardName('');
    setCustomCardMinSpend('');
    setShowCustomCardForm(false);

    Alert.alert('Success', 'Custom card added successfully!');
  };

  const isCardSelected = (cardId: string) => {
    return userCards.some(c => c.id === cardId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <Text style={[styles.title, { color: theme.text }]}>Manage Credit Cards</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View style={[styles.disclaimer, { backgroundColor: theme.backgroundSecondary }]}>
            <Ionicons name="information-circle-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
              Select the cards you own. No actual card details needed.
            </Text>
          </View>

          {/* Cards List */}
          <ScrollView
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Display custom cards first */}
            {userCards
              .filter((c: any) => c.isCustom)
              .map((card: any) => {
                const isSelected = isCardSelected(card.id);
                
                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.cardItem,
                      {
                        backgroundColor: isSelected ? theme.primary + '33' : theme.cardBackground || '#2A2A2A',
                        borderColor: isSelected ? theme.primary : theme.cardBorder || '#444',
                      }
                    ]}
                    onPress={() => toggleCard(card.id, card.name)}
                    activeOpacity={0.7}
                    onLongPress={() => {
                      // Long press to delete custom card permanently
                      Alert.alert(
                        'Delete Custom Card',
                        `Remove "${card.name}" permanently? This cannot be undone.`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const newCards = userCards.filter((c: any) => c.id !== card.id);
                              setUserCards(newCards);
                              await saveUserCards(newCards);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <View style={styles.cardContent}>
                      <View style={[
                        styles.cardVisual,
                        { backgroundColor: theme.accent }
                      ]}>
                        <Ionicons name="card" size={16} color="#FFF" />
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.cardName, { color: theme.text }]}>
                            {card.name}
                          </Text>
                          <View style={[styles.customBadge, { backgroundColor: theme.accent }]}>
                            <Text style={styles.customBadgeText}>Custom</Text>
                          </View>
                        </View>
                        <View style={styles.cardMeta}>
                          <Text style={[styles.cardType, { color: theme.textSecondary }]}>
                            Tap to remove • Long press to delete
                          </Text>
                          {card.minSpend > 0 && (
                            <>
                              <Text style={[styles.cardDot, { color: theme.textSecondary }]}>•</Text>
                              <Text style={[styles.cardMinSpend, { color: theme.textSecondary }]}>
                                Min ${card.minSpend}
                              </Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark" size={16} color="#000" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

            {/* Display available cards */}
            {availableCards.length === 0 && userCards.filter((c: any) => c.isCustom).length === 0 && (
              <Text style={{ color: theme.text, padding: 16 }}>No cards available</Text>
            )}
            {availableCards.map((card) => {
              const isSelected = isCardSelected(card.id);
              
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardItem,
                    {
                      backgroundColor: isSelected ? theme.primary + '33' : theme.cardBackground || '#2A2A2A',
                      borderColor: isSelected ? theme.primary : theme.cardBorder || '#444',
                    }
                  ]}
                  onPress={() => {
                    console.log('Card pressed:', card.name);
                    toggleCard(card.id, card.name);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    {cardImages[card.id] ? (
                      <Image 
                        source={{ uri: cardImages[card.id]! }} 
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.cardVisual,
                        { backgroundColor: (card as any).brandColor || '#666' }
                      ]}>
                        <Ionicons name="card" size={16} color="#FFF" />
                      </View>
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={[styles.cardName, { color: theme.text }]}>
                        {card.name}
                      </Text>
                      <View style={styles.cardMeta}>
                        <Text style={[styles.cardIssuer, { color: theme.textSecondary }]}>
                          {card.issuer}
                        </Text>
                        <Text style={[styles.cardDot, { color: theme.textSecondary }]}>•</Text>
                        <Text style={[styles.cardType, { color: theme.textSecondary }]}>
                          {card.rewardType === 'miles' ? '✈️ Miles' : '💰 Cashback'}
                        </Text>
                        {card.minSpend > 0 && (
                          <>
                            <Text style={[styles.cardDot, { color: theme.textSecondary }]}>•</Text>
                            <Text style={[styles.cardMinSpend, { color: theme.textSecondary }]}>
                              Min ${card.minSpend}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Custom Card Section */}
            <View style={[styles.customCardSection, { borderTopColor: theme.cardBorder }]}>
              <Text style={[styles.customCardHint, { color: theme.textSecondary }]}>
                Don't see your card? Add your card below
              </Text>
              
              {!showCustomCardForm ? (
                <TouchableOpacity
                  style={[styles.addCustomCardButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
                  onPress={() => setShowCustomCardForm(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
                  <Text style={[styles.addCustomCardText, { color: theme.primary }]}>
                    Add Custom Card
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.customCardForm, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
                  {/* Info disclaimer */}
                  <View style={[styles.formDisclaimer, { backgroundColor: theme.backgroundSecondary }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.accent} />
                    <Text style={[styles.formDisclaimerText, { color: theme.textSecondary }]}>
                      Custom cards won't receive automatic reward updates.
                    </Text>
                  </View>

                  {/* Card Name Input */}
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>Card Name</Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { 
                          backgroundColor: theme.backgroundSecondary, 
                          borderColor: theme.cardBorder, 
                          color: theme.text 
                        }
                      ]}
                      value={customCardName}
                      onChangeText={setCustomCardName}
                      placeholder="e.g., My Bank Visa"
                      placeholderTextColor={theme.textTertiary}
                      autoFocus
                    />
                  </View>

                  {/* Min Spend Input */}
                  <View style={styles.formField}>
                    <Text style={[styles.formLabel, { color: theme.text }]}>
                      Minimum Spend (Optional)
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        { 
                          backgroundColor: theme.backgroundSecondary, 
                          borderColor: theme.cardBorder, 
                          color: theme.text 
                        }
                      ]}
                      value={customCardMinSpend}
                      onChangeText={setCustomCardMinSpend}
                      placeholder="e.g., 600"
                      placeholderTextColor={theme.textTertiary}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  {/* Form Actions */}
                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={[styles.formButton, styles.formCancelButton, { borderColor: theme.cardBorder }]}
                      onPress={() => {
                        setShowCustomCardForm(false);
                        setCustomCardName('');
                        setCustomCardMinSpend('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.formCancelText, { color: theme.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.formButton, styles.formSaveButton, { backgroundColor: theme.primary }]}
                      onPress={handleAddCustomCard}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.formSaveText}>Add Card</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.selectedCount, { color: theme.textSecondary }]}>
              {userCards.length} card{userCards.length === 1 ? '' : 's'} selected
            </Text>
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 500,
    height: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  scrollView: {
    flex: 1,
    minHeight: 200,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardVisual: {
    width: 52,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardImage: {
    width: 52,
    height: 32,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  cardIssuer: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDot: {
    fontSize: 12,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardMinSpend: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  customCardSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  customCardHint: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  addCustomCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCustomCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customCardForm: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  formDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  formDisclaimerText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 14,
  },
  formField: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  formButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCancelButton: {
    borderWidth: 1,
  },
  formSaveButton: {
    // backgroundColor set via theme
  },
  formCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
