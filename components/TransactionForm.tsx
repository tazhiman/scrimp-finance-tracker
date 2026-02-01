import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction, TransactionType, Category, RecurringExpense, RecurrenceFrequency, UserCard } from '@/types';
import { CategorySelector } from './CategorySelector';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/utils/dateHelpers';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import { Ionicons } from '@expo/vector-icons';
import { loadUserCards } from '@/utils/storage';
import { getAllCards } from '@/utils/cardEngine';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { CardManagementModal } from './CardManagementModal';

interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onSubmitRecurring?: (recurring: Omit<RecurringExpense, 'id'>) => void;
  initialTransaction?: Transaction;
}

type ScheduleMode = 'one_time' | 'recurring' | 'installment';

export const TransactionForm: React.FC<TransactionFormProps> = ({
  visible,
  onClose,
  onSubmit,
  onSubmitRecurring,
  initialTransaction,
}) => {
  const { theme, themeMode } = useTheme();
  const { addCustomCategory } = useFinance();
  
  // In dark mode, use black text on the light colored buttons for better contrast
  const activeButtonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || 'expense'
  );
  const [amount, setAmount] = useState(
    initialTransaction?.amount.toString() || ''
  );
  const [category, setCategory] = useState(
    initialTransaction?.category || ''
  );
  const [description, setDescription] = useState(
    initialTransaction?.description || ''
  );
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryEmoji, setCustomCategoryEmoji] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [date, setDate] = useState<Date>(
    initialTransaction?.date ? new Date(initialTransaction.date) : new Date()
  );
  
  // Credit card state
  const [selectedCard, setSelectedCard] = useState<string | undefined>(initialTransaction?.cardId);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('one_time');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly');
  const [planTitle, setPlanTitle] = useState('');
  const [installments, setInstallments] = useState('');
  const [endDateEnabled, setEndDateEnabled] = useState(false);
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Load user cards on mount
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const cards = await loadUserCards();
    setUserCards(cards);
    
    // Load card images
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
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setCustomCategoryName('');
    setCustomCategoryEmoji('');
    setShowCustomInput(false);
    setDate(new Date());
    setScheduleMode('one_time');
    setRecurrenceFrequency('monthly');
    setPlanTitle('');
    setInstallments('');
    setEndDateEnabled(false);
    setSelectedCard(undefined);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setEndDate(d);
  };

  const handleSubmit = () => {
    console.log('=== SUBMIT HANDLER START ===');
    console.log('showCustomInput:', showCustomInput);
    console.log('customCategoryName:', customCategoryName);
    console.log('customCategoryEmoji:', customCategoryEmoji);
    console.log('category:', category);
    
    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      console.log('FAILED: Amount validation');
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!category) {
      console.log('FAILED: Category validation');
      Alert.alert('Error', 'Please select a category');
      return;
    }

    // If custom category input is shown, validate and save it
    if (showCustomInput) {
      console.log('=== CUSTOM CATEGORY VALIDATION ===');
      console.log('Custom category validation:', {
        name: customCategoryName,
        nameLength: customCategoryName?.length,
        emoji: customCategoryEmoji,
        emojiLength: customCategoryEmoji?.length,
        showCustomInput
      });
      
      if (!customCategoryName || customCategoryName.trim().length === 0) {
        console.log('FAILED: Name validation');
        Alert.alert('Error', 'Please enter a category name');
        return;
      }
      
      if (!customCategoryEmoji || customCategoryEmoji.trim().length === 0) {
        console.log('FAILED: Emoji validation - empty');
        Alert.alert('Error', 'Please enter an emoji for the category');
        return;
      }
      
      console.log('Using emoji:', customCategoryEmoji);

      console.log('=== SAVING CUSTOM CATEGORY ===');
      // Save the custom category
      const newCategory: Omit<Category, 'id'> = {
        name: customCategoryName.trim(),
        icon: customCategoryEmoji.trim(),
        color: theme.primary,
      };
      console.log('New category:', newCategory);
      addCustomCategory(newCategory);
      console.log('Custom category saved!');
    }
    
    console.log('=== PROCEEDING TO SAVE TRANSACTION ===');

    // Recurring / Installment (expenses only, and not supported for editing one-off transactions)
    if (type === 'expense' && !initialTransaction && scheduleMode !== 'one_time') {
      if (!onSubmitRecurring) {
        Alert.alert('Error', 'Recurring expenses are not available here.');
        return;
      }

      const title = (planTitle || description || 'Recurring Expense').trim();
      if (!title) {
        Alert.alert('Error', 'Please enter a name for this recurring expense');
        return;
      }

      let totalInstallments: number | undefined = undefined;
      if (scheduleMode === 'installment') {
        const n = parseInt(installments, 10);
        if (!installments || isNaN(n) || n < 1) {
          Alert.alert('Error', 'Please enter a valid number of installments');
          return;
        }
        totalInstallments = n;
      }

      if (endDateEnabled && endDate && endDate.getTime() < date.getTime()) {
        Alert.alert('Error', 'End date must be after the start date');
        return;
      }

      onSubmitRecurring({
        kind: scheduleMode === 'recurring' ? 'recurring' : 'installment',
        title,
        amount: amountNum,
        category,
        startDate: date.toISOString().split('T')[0],
        frequency: recurrenceFrequency,
        endDate: endDateEnabled ? endDate.toISOString().split('T')[0] : undefined,
        totalInstallments,
        createdAt: new Date().toISOString(),
      });

      resetForm();
      onClose();
      return;
    }

    onSubmit({
      type,
      amount: amountNum,
      category,
      description,
      date: date.toISOString().split('T')[0],
      cardId: selectedCard,
    });

    resetForm();
    onClose();
  };

  const handleCardModalClose = async () => {
    setShowCardModal(false);
    await loadCards();
  };

  const getSelectedCardInfo = () => {
    if (!selectedCard) return null;
    const card = userCards.find(c => c.id === selectedCard);
    if (!card) return null;
    
    const allCards = getAllCards();
    const cardData = allCards.find(c => c.id === selectedCard);
    
    return {
      ...card,
      brandColor: (cardData as any)?.brandColor || '#666',
      imageUrl: cardImages[selectedCard],
    };
  };

  const handleCategorySelect = (selectedCategory: Category) => {
    setCategory(selectedCategory.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>
            {initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </Text>
          <TouchableOpacity onPress={handleSubmit} style={styles.saveButton}>
            <Text style={[styles.saveText, { color: theme.primary }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Type Selector */}
          <View style={[styles.typeSelector, { backgroundColor: theme.backgroundSecondary }]}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'expense' && { backgroundColor: theme.secondary },
              ]}
              onPress={() => {
                setType('expense');
                setCategory('');
                setShowCustomInput(false);
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === 'expense' ? activeButtonTextColor : theme.textSecondary },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'income' && { backgroundColor: theme.primary },
              ]}
              onPress={() => {
                setType('income');
                setCategory('');
                setShowCustomInput(false);
              }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: type === 'income' ? activeButtonTextColor : theme.textSecondary },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Schedule (Expenses only) */}
          {type === 'expense' && !initialTransaction && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Schedule</Text>
              <View style={[styles.scheduleSelector, { backgroundColor: theme.backgroundSecondary }]}>
                <TouchableOpacity
                  style={[
                    styles.scheduleButton,
                    scheduleMode === 'one_time' && { backgroundColor: theme.backgroundTertiary },
                  ]}
                  onPress={() => setScheduleMode('one_time')}
                >
                  <Text style={[styles.scheduleButtonText, { color: theme.textSecondary }]}>One-time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.scheduleButton,
                    scheduleMode === 'recurring' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setScheduleMode('recurring')}
                >
                  <Text
                    style={[
                      styles.scheduleButtonText,
                      { color: scheduleMode === 'recurring' ? activeButtonTextColor : theme.textSecondary },
                    ]}
                  >
                    Recurring
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.scheduleButton,
                    scheduleMode === 'installment' && { backgroundColor: theme.primary },
                  ]}
                  onPress={() => setScheduleMode('installment')}
                >
                  <Text
                    style={[
                      styles.scheduleButtonText,
                      { color: scheduleMode === 'installment' ? activeButtonTextColor : theme.textSecondary },
                    ]}
                  >
                    Installment
                  </Text>
                </TouchableOpacity>
              </View>
              {(scheduleMode === 'recurring' || scheduleMode === 'installment') && (
                <>
                  <View style={styles.fieldSpacer} />
                  <Text style={[styles.label, { color: theme.text }]}>Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                    ]}
                    value={planTitle}
                    onChangeText={setPlanTitle}
                    placeholder="e.g. Rent, Car loan"
                    placeholderTextColor={theme.textTertiary}
                  />

                  <View style={styles.fieldSpacer} />
                  <Text style={[styles.label, { color: theme.text }]}>Frequency</Text>
                  <View style={[styles.frequencySelector, { backgroundColor: theme.backgroundSecondary }]}>
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        recurrenceFrequency === 'weekly' && { backgroundColor: theme.primary },
                      ]}
                      onPress={() => setRecurrenceFrequency('weekly')}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          { color: recurrenceFrequency === 'weekly' ? activeButtonTextColor : theme.textSecondary },
                        ]}
                      >
                        Weekly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.frequencyButton,
                        recurrenceFrequency === 'monthly' && { backgroundColor: theme.primary },
                      ]}
                      onPress={() => setRecurrenceFrequency('monthly')}
                    >
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          { color: recurrenceFrequency === 'monthly' ? activeButtonTextColor : theme.textSecondary },
                        ]}
                      >
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {scheduleMode === 'installment' && (
                    <>
                      <View style={styles.fieldSpacer} />
                      <Text style={[styles.label, { color: theme.text }]}>Number of installments</Text>
                      <TextInput
                        style={[
                          styles.input,
                          { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                        ]}
                        value={installments}
                        onChangeText={setInstallments}
                        placeholder="e.g. 12"
                        placeholderTextColor={theme.textTertiary}
                        keyboardType="number-pad"
                      />
                    </>
                  )}

                  {scheduleMode === 'recurring' && (
                    <>
                      <View style={styles.fieldSpacer} />
                      <TouchableOpacity
                        style={styles.endDateToggle}
                        onPress={() => setEndDateEnabled((v) => !v)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={endDateEnabled ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={theme.textSecondary}
                        />
                        <Text style={[styles.endDateToggleText, { color: theme.textSecondary }]}>
                          Set an end date (optional)
                        </Text>
                      </TouchableOpacity>

                      {endDateEnabled && (
                        <View style={styles.endDateContainer}>
                          <Text style={[styles.label, { color: theme.text }]}>End Date</Text>
                          {Platform.OS === 'web' ? (
                            <View
                              style={[
                                styles.webDateContainer,
                                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                              ]}
                            >
                              <input
                                type="date"
                                value={endDate.toISOString().split('T')[0]}
                                onChange={(e) => setEndDate(new Date(e.target.value))}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  color: theme.text,
                                  fontSize: 16,
                                  fontFamily: 'inherit',
                                  width: '100%',
                                  outline: 'none',
                                  cursor: 'pointer',
                                }}
                              />
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.datePickerContainer,
                                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                              ]}
                            >
                              <DateTimePicker
                                value={endDate}
                                mode="date"
                                display="default"
                                onChange={handleEndDateChange}
                                minimumDate={date}
                                maximumDate={undefined}
                                themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}
            </View>
          )}

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Amount</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Category</Text>
            <CategorySelector
              type={type}
              selectedCategory={category}
              onSelect={handleCategorySelect}
              customCategoryName={customCategoryName}
              onCustomCategoryNameChange={setCustomCategoryName}
              customCategoryEmoji={customCategoryEmoji}
              onCustomCategoryEmojiChange={setCustomCategoryEmoji}
              showCustomInput={showCustomInput}
              onShowCustomInputChange={setShowCustomInput}
            />
          </View>

          {/* Credit Card Selector (Expenses only) */}
          {type === 'expense' && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Credit Card (Optional)</Text>
              
              {userCards.length === 0 ? (
                <TouchableOpacity
                  style={[styles.addCardButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  onPress={() => setShowCardModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
                  <Text style={[styles.addCardText, { color: theme.primary }]}>Add a Card</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.cardSelectionContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardScrollContent}
                  >
                    {/* None option */}
                    <TouchableOpacity
                      style={[
                        styles.cardOption,
                        { 
                          backgroundColor: theme.cardBackground, 
                          borderColor: selectedCard === undefined ? theme.primary : theme.cardBorder,
                          borderWidth: selectedCard === undefined ? 2 : 1,
                        }
                      ]}
                      onPress={() => setSelectedCard(undefined)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.cardVisualPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                        <Ionicons name="close" size={16} color={theme.textSecondary} />
                      </View>
                      <Text style={[styles.cardOptionText, { color: theme.textSecondary }]}>None</Text>
                    </TouchableOpacity>

                    {/* User's cards */}
                    {userCards.map((card: any) => {
                      const cardInfo = getSelectedCardInfo();
                      const isSelected = selectedCard === card.id;
                      const allCards = getAllCards();
                      const cardData = allCards.find(c => c.id === card.id);
                      const brandColor = card.isCustom ? theme.accent : ((cardData as any)?.brandColor || '#666');
                      const imageUrl = card.isCustom ? null : cardImages[card.id];

                      return (
                        <TouchableOpacity
                          key={card.id}
                          style={[
                            styles.cardOption,
                            { 
                              backgroundColor: theme.cardBackground, 
                              borderColor: isSelected ? theme.primary : theme.cardBorder,
                              borderWidth: isSelected ? 2 : 1,
                            }
                          ]}
                          onPress={() => setSelectedCard(card.id)}
                          activeOpacity={0.7}
                        >
                          {imageUrl ? (
                            <Image 
                              source={{ uri: imageUrl }} 
                              style={styles.cardVisual}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={[styles.cardVisualPlaceholder, { backgroundColor: brandColor }]}>
                              <Ionicons name="card" size={12} color="#FFF" />
                            </View>
                          )}
                          <Text 
                            style={[styles.cardOptionText, { color: theme.text }]} 
                            numberOfLines={1}
                          >
                            {card.name.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Add card button */}
                    <TouchableOpacity
                      style={[
                        styles.cardOption,
                        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderStyle: 'dashed' }
                      ]}
                      onPress={() => setShowCardModal(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.cardVisualPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                        <Ionicons name="add" size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.cardOptionText, { color: theme.primary }]}>Add</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a note..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Date Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Date</Text>
            {Platform.OS === 'web' ? (
              <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <input
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: theme.text,
                    fontSize: 16,
                    fontFamily: 'inherit',
                    width: '100%',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </View>
            ) : (
              <View style={[styles.datePickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <DateTimePicker
              value={date}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
            />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Card Management Modal */}
      <CardManagementModal
        visible={showCardModal}
        onClose={handleCardModalClose}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 400 : 350,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  scheduleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  frequencySelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  endDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  endDateToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldSpacer: {
    marginTop: 12,
  },
  endDateContainer: {
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  webDateContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  datePickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cardSelectionContainer: {
    marginTop: 4,
  },
  cardScrollContent: {
    gap: 12,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  cardOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
  },
  cardVisual: {
    width: 44,
    height: 28,
    borderRadius: 6,
    marginBottom: 6,
  },
  cardVisualPlaceholder: {
    width: 44,
    height: 28,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardOptionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

