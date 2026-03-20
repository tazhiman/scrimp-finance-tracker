import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Platform,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction, TransactionType, Category, RecurringExpense, RecurrenceFrequency, UserCard, BankAccount } from '@/types';
import { CategorySelector } from './CategorySelector';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { useFinance } from '@/context/FinanceContext';
import { Icon } from '@/components/ui/Icon';
import { loadUserCards } from '@/utils/storage';
import { loadBankAccounts } from '@/utils/onboarding';
import { getAllCards } from '@/utils/cardEngine';
import { getCachedCardImage } from '@/utils/remoteRewardsData';
import { GlassCard } from './ui/GlassCard';
import { BankAvatar } from './ui/BankAvatar';

type SelectedAccount =
  | { kind: 'bank'; id: string }
  | { kind: 'card'; id: string }
  | undefined;

const SCREEN_WIDTH = Dimensions.get('window').width;

const NUM_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'del'],
] as const;

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
  const activeButtonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const [step, setStep] = useState<1 | 2>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [type, setType] = useState<TransactionType>(initialTransaction?.type || 'expense');
  const [amount, setAmount] = useState(initialTransaction?.amount.toString() || '');
  const [category, setCategory] = useState(initialTransaction?.category || '');
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryEmoji, setCustomCategoryEmoji] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [date, setDate] = useState<Date>(
    initialTransaction?.date ? new Date(initialTransaction.date) : new Date()
  );

  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount>(
    initialTransaction?.cardId ? { kind: 'card', id: initialTransaction.cardId }
    : initialTransaction?.accountId ? { kind: 'bank', id: initialTransaction.accountId }
    : undefined
  );
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cardImages, setCardImages] = useState<Record<string, string | null>>({});
  const [showAccountPicker, setShowAccountPicker] = useState(false);

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

  useEffect(() => {
    if (visible) {
      (async () => {
        const [cards, accounts] = await Promise.all([loadUserCards(), loadBankAccounts()]);
        setUserCards(cards);
        setBankAccounts(accounts);
        if (!initialTransaction?.cardId && !initialTransaction?.accountId) {
          if (accounts.length > 0) {
            setSelectedAccount({ kind: 'bank', id: accounts[0].id });
          } else if (cards.length > 0) {
            setSelectedAccount({ kind: 'card', id: cards[0].id });
          }
        }
        const allCards = getAllCards();
        const images: Record<string, string | null> = {};
        await Promise.all(
          cards.map(async (uc) => {
            const cd = allCards.find((c: any) => c.id === uc.id);
            if (cd && (cd as any).imageUrl) {
              images[uc.id] = await getCachedCardImage(uc.id);
            }
          })
        );
        setCardImages(images);
      })();
    }
  }, [visible]);

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
    setSelectedAccount(undefined);
    setStep(1);
    slideAnim.setValue(0);
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setEndDate(d);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const animateToStep = (target: 1 | 2) => {
    setStep(target);
    Animated.spring(slideAnim, {
      toValue: target === 1 ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  const pulseAmount = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.06, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleNumPress = (key: string) => {
    if (key === 'del') {
      setAmount(prev => prev.slice(0, -1));
      pulseAmount();
      return;
    }
    setAmount(prev => {
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev.length === 0 ? '0.' : prev + '.';
      }
      const dotIdx = prev.indexOf('.');
      if (dotIdx !== -1 && prev.length - dotIdx > 2) return prev;
      if (prev === '0' && key !== '.') return key;
      const integerPart = dotIdx !== -1 ? prev.substring(0, dotIdx) : prev;
      if (integerPart.length >= 7) return prev;
      return prev + key;
    });
    pulseAmount();
  };

  const handleNext = () => {
    const n = parseFloat(amount);
    if (!amount || isNaN(n) || n <= 0) {
      Alert.alert('Enter Amount', 'Please enter an amount greater than zero.');
      return;
    }
    animateToStep(2);
  };

  const handleBack = () => {
    animateToStep(1);
  };

  const handleSubmit = () => {
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    let resolvedCategory = category || 'uncategorized';
    if (showCustomInput) {
      if (!customCategoryName || customCategoryName.trim().length === 0) {
        Alert.alert('Error', 'Please enter a category name');
        return;
      }
      if (!customCategoryEmoji || customCategoryEmoji.trim().length === 0) {
        Alert.alert('Error', 'Please select an emoji for the category');
        return;
      }
      resolvedCategory = addCustomCategory({
        name: customCategoryName.trim(),
        icon: customCategoryEmoji.trim(),
        color: theme.primary,
      });
    }

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
      let totalInstallments: number | undefined;
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
        category: resolvedCategory,
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
      category: resolvedCategory,
      description,
      date: date.toISOString().split('T')[0],
      cardId: selectedAccount?.kind === 'card' ? selectedAccount.id : undefined,
      accountId: selectedAccount?.kind === 'bank' ? selectedAccount.id : undefined,
    });
    resetForm();
    onClose();
  };

  const formatDisplay = (val: string): string => {
    if (!val) return '$0.00';
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    if (val.endsWith('.')) return `$${val}`;
    const dotIdx = val.indexOf('.');
    if (dotIdx !== -1) {
      const decimals = val.length - dotIdx - 1;
      if (decimals === 1) return `$${val}`;
    }
    return `$${num.toFixed(2)}`;
  };

  const getAccountLabel = (sel: SelectedAccount): string => {
    if (!sel) return 'No Account';
    if (sel.kind === 'bank') {
      const acct = bankAccounts.find(a => a.id === sel.id);
      return acct ? acct.name : 'No Account';
    }
    const card = userCards.find(c => c.id === sel.id);
    return card ? card.name : 'No Account';
  };

  const getAccountIcon = (sel: SelectedAccount): 'wallet-outline' | 'card-outline' => {
    if (sel?.kind === 'card') return 'card-outline';
    return 'wallet-outline';
  };

  type PickerEntry = { id: string; kind: 'bank' | 'card'; name: string };

  const pickerEntries: PickerEntry[] = [
    ...bankAccounts.map(a => ({ id: a.id, kind: 'bank' as const, name: a.name })),
    ...userCards.map(c => ({ id: c.id, kind: 'card' as const, name: c.name })),
  ];

  const selectAccount = (sel: SelectedAccount) => {
    setSelectedAccount(sel);
    setShowAccountPicker(false);
  };

  const openAccountPicker = () => setShowAccountPicker(true);

  const step1Translate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });
  const step2Translate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* ===== STEP 1: Amount Entry ===== */}
        <Animated.View
          style={[styles.stepContainer, { transform: [{ translateX: step1Translate }] }]}
          pointerEvents={step === 1 ? 'auto' : 'none'}
        >
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerBtn}>
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <View style={styles.headerBtn} />
          </View>

          <View style={styles.step1Body}>
            <View style={[styles.typeSelector, { backgroundColor: theme.backgroundSecondary }]}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && { backgroundColor: theme.secondary }]}
                onPress={() => { setType('expense'); setCategory(''); setShowCustomInput(false); }}
              >
                <Text style={[styles.typeButtonText, { color: type === 'expense' ? activeButtonTextColor : theme.textSecondary }]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && { backgroundColor: theme.primary }]}
                onPress={() => { setType('income'); setCategory(''); setShowCustomInput(false); }}
              >
                <Text style={[styles.typeButtonText, { color: type === 'income' ? activeButtonTextColor : theme.textSecondary }]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.amountArea}>
              <Animated.Text
                style={[
                  styles.amountDisplay,
                  { color: theme.text, transform: [{ scale: scaleAnim }] },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatDisplay(amount)}
              </Animated.Text>

              {(bankAccounts.length > 0 || userCards.length > 0) && (
                <TouchableOpacity
                  style={[styles.cardPill, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
                  onPress={openAccountPicker}
                  activeOpacity={0.7}
                >
                  {selectedAccount?.kind === 'bank' ? (
                    <BankAvatar name={getAccountLabel(selectedAccount)} size={18} />
                  ) : (
                    <Icon name={getAccountIcon(selectedAccount)} size={16} color={theme.textSecondary} />
                  )}
                  <Text style={[styles.cardPillText, { color: theme.text }]} numberOfLines={1}>
                    {getAccountLabel(selectedAccount)}
                  </Text>
                  <Icon name="chevron-down" size={14} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.numpad}>
              {NUM_KEYS.map((row, ri) => (
                <View key={ri} style={styles.numRow}>
                  {row.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[styles.numKey, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => handleNumPress(key)}
                      activeOpacity={0.6}
                    >
                      {key === 'del' ? (
                        <Icon name="backspace-outline" size={24} color={theme.text} />
                      ) : (
                        <Text style={[styles.numKeyText, { color: theme.text }]}>{key}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.step1Bottom}>
              <TouchableOpacity
                style={[styles.nextButton, { backgroundColor: theme.primary }, Shadow.medium]}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={[styles.nextButtonText, { color: activeButtonTextColor }]}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* ===== STEP 2: Details ===== */}
        <Animated.View
          style={[styles.stepContainer, { transform: [{ translateX: step2Translate }] }]}
          pointerEvents={step === 2 ? 'auto' : 'none'}
        >
          <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
              <Icon name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Details</Text>
            <View style={styles.headerBtn} />
          </View>

          <ScrollView
            style={styles.step2Scroll}
            contentContainerStyle={styles.step2Content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
          >
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
              <CategorySelector
                type={type}
                selectedCategory={category}
                onSelect={(c) => setCategory(c.id)}
                customCategoryName={customCategoryName}
                onCustomCategoryNameChange={setCustomCategoryName}
                customCategoryEmoji={customCategoryEmoji}
                onCustomCategoryEmojiChange={setCustomCategoryEmoji}
                showCustomInput={showCustomInput}
                onShowCustomInputChange={setShowCustomInput}
              />
            </View>

            {type === 'expense' && !initialTransaction && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Schedule</Text>
                <View style={[styles.scheduleSelector, { backgroundColor: theme.backgroundSecondary }]}>
                  <TouchableOpacity
                    style={[styles.scheduleButton, scheduleMode === 'one_time' && { backgroundColor: theme.backgroundTertiary }]}
                    onPress={() => setScheduleMode('one_time')}
                  >
                    <Text style={[styles.scheduleButtonText, { color: theme.textSecondary }]}>One-time</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scheduleButton, scheduleMode === 'recurring' && { backgroundColor: theme.primary }]}
                    onPress={() => setScheduleMode('recurring')}
                  >
                    <Text style={[styles.scheduleButtonText, { color: scheduleMode === 'recurring' ? activeButtonTextColor : theme.textSecondary }]}>Recurring</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scheduleButton, scheduleMode === 'installment' && { backgroundColor: theme.primary }]}
                    onPress={() => setScheduleMode('installment')}
                  >
                    <Text style={[styles.scheduleButtonText, { color: scheduleMode === 'installment' ? activeButtonTextColor : theme.textSecondary }]}>Installment</Text>
                  </TouchableOpacity>
                </View>

                {(scheduleMode === 'recurring' || scheduleMode === 'installment') && (
                  <>
                    <View style={styles.fieldSpacer} />
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                      value={planTitle}
                      onChangeText={setPlanTitle}
                      placeholder="e.g. Rent, Car loan"
                      placeholderTextColor={theme.textTertiary}
                    />
                    <View style={styles.fieldSpacer} />
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
                    <View style={[styles.frequencySelector, { backgroundColor: theme.backgroundSecondary }]}>
                      <TouchableOpacity
                        style={[styles.frequencyButton, recurrenceFrequency === 'weekly' && { backgroundColor: theme.primary }]}
                        onPress={() => setRecurrenceFrequency('weekly')}
                      >
                        <Text style={[styles.frequencyButtonText, { color: recurrenceFrequency === 'weekly' ? activeButtonTextColor : theme.textSecondary }]}>Weekly</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.frequencyButton, recurrenceFrequency === 'monthly' && { backgroundColor: theme.primary }]}
                        onPress={() => setRecurrenceFrequency('monthly')}
                      >
                        <Text style={[styles.frequencyButtonText, { color: recurrenceFrequency === 'monthly' ? activeButtonTextColor : theme.textSecondary }]}>Monthly</Text>
                      </TouchableOpacity>
                    </View>

                    {scheduleMode === 'installment' && (
                      <>
                        <View style={styles.fieldSpacer} />
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Number of installments</Text>
                        <TextInput
                          style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
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
                        <TouchableOpacity style={styles.endDateToggle} onPress={() => setEndDateEnabled(v => !v)} activeOpacity={0.7}>
                          <Icon name={endDateEnabled ? 'checkbox' : 'square-outline'} size={20} color={theme.textSecondary} />
                          <Text style={[styles.endDateToggleText, { color: theme.textSecondary }]}>Set an end date (optional)</Text>
                        </TouchableOpacity>
                        {endDateEnabled && (
                          <View style={styles.endDateContainer}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>End Date</Text>
                            {Platform.OS === 'web' ? (
                              <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                <input
                                  type="date"
                                  value={endDate.toISOString().split('T')[0]}
                                  onChange={(e) => setEndDate(new Date(e.target.value))}
                                  style={{ backgroundColor: 'transparent', border: 'none', color: theme.text, fontSize: 16, fontFamily: 'inherit', width: '100%', outline: 'none', cursor: 'pointer' }}
                                />
                              </View>
                            ) : (
                              <View style={[styles.datePickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                                <DateTimePicker value={endDate} mode="date" display="default" onChange={(_, d) => d && setEndDate(d)} minimumDate={date} themeVariant={themeMode === 'dark' ? 'dark' : 'light'} />
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

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Description (Optional)</Text>
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

            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={(e) => setDate(new Date(e.target.value))}
                    max={new Date().toISOString().split('T')[0]}
                    style={{ backgroundColor: 'transparent', border: 'none', color: theme.text, fontSize: 16, fontFamily: 'inherit', width: '100%', outline: 'none', cursor: 'pointer' }}
                  />
                </View>
              ) : (
                <View style={[styles.datePickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <DateTimePicker value={date} mode="date" display="default" onChange={(_, d) => d && setDate(d)} maximumDate={new Date()} themeVariant={themeMode === 'dark' ? 'dark' : 'light'} />
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.primary }, Shadow.medium]}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveButtonText, { color: activeButtonTextColor }]}>
                {initialTransaction ? 'Save Changes' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {showAccountPicker && (
          <Modal transparent animationType="fade" visible onRequestClose={() => setShowAccountPicker(false)}>
            <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setShowAccountPicker(false)}>
              <GlassCard style={styles.dropdownCard} intensity="strong" borderRadius={14}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => selectAccount(undefined)} activeOpacity={0.6}>
                  <Icon name="close-circle-outline" size={20} color={!selectedAccount ? theme.primary : theme.textSecondary} />
                  <Text style={[styles.dropdownItemText, { color: !selectedAccount ? theme.primary : theme.text }]}>No Account</Text>
                  {!selectedAccount && <Icon name="checkmark" size={18} color={theme.primary} />}
                </TouchableOpacity>
                {pickerEntries.map((entry) => {
                  const isSelected = selectedAccount?.kind === entry.kind && selectedAccount?.id === entry.id;
                  return (
                    <React.Fragment key={entry.id}>
                      <View style={[styles.dropdownDivider, { backgroundColor: theme.cardBorder }]} />
                      <TouchableOpacity style={styles.dropdownItem} onPress={() => selectAccount({ kind: entry.kind, id: entry.id })} activeOpacity={0.6}>
                        {entry.kind === 'bank' ? (
                          <BankAvatar name={entry.name} size={22} />
                        ) : (
                          <Icon name="card-outline" size={20} color={isSelected ? theme.primary : theme.textSecondary} />
                        )}
                        <Text style={[styles.dropdownItemText, { color: isSelected ? theme.primary : theme.text }]}>{entry.name}</Text>
                        {isSelected && <Icon name="checkmark" size={18} color={theme.primary} />}
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </GlassCard>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  stepContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 60,
    paddingVertical: Spacing.xs,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },

  step1Body: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  amountArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
  },
  amountDisplay: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -1,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  cardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  cardPillText: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 160,
  },

  numpad: {
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  numRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  numKey: {
    flex: 1,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numKeyText: {
    fontSize: 24,
    fontWeight: '500',
  },

  step1Bottom: {
    paddingVertical: Spacing.xl,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  step2Scroll: {
    flex: 1,
  },
  step2Content: {
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 400 : 350,
  },
  section: {
    marginBottom: Spacing['3xl'],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: Radius.md,
    padding: Spacing.xl,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  scheduleSelector: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  scheduleButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  frequencySelector: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fieldSpacer: {
    marginTop: Spacing.lg,
  },
  endDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  endDateToggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  endDateContainer: {
    marginTop: Spacing.lg,
  },
  webDateContainer: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    minHeight: 52,
    justifyContent: 'center',
  },
  datePickerContainer: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButton: {
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },

  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownCard: {
    width: 260,
    paddingVertical: Spacing.sm,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.xl,
  },
});
