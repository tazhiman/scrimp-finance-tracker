import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { BankAvatar } from '@/components/ui/BankAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { CategorySelector } from '@/components/CategorySelector';
import { Spacing, Radius } from '@/constants/design';
import { Transaction, TransactionType, BankAccount, UserCard } from '@/types';
import { loadBankAccounts } from '@/utils/onboarding';
import { loadUserCards } from '@/utils/storage';
import {
  getRecurringIdFromGeneratedTransactionId,
  isGeneratedRecurringTransactionId,
} from '@/utils/recurring';
import {
  formatCurrency,
  buildTransactionDateTime,
  formatDetailTransactionDate,
  formatDetailTransactionTime,
} from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';

type SelectedAccount =
  | { kind: 'bank'; id: string }
  | { kind: 'card'; id: string }
  | undefined;

function accountFromTransaction(tx: Transaction | null): SelectedAccount {
  if (!tx) return undefined;
  if (tx.cardId) return { kind: 'card', id: tx.cardId };
  if (tx.accountId) return { kind: 'bank', id: tx.accountId };
  return undefined;
}

function resolveAccountLabel(
  tx: Transaction,
  banks: BankAccount[],
  cards: UserCard[]
): string {
  if (tx.cardId) {
    const c = cards.find((x) => x.id === tx.cardId);
    return c?.name ?? 'Card (removed)';
  }
  if (tx.accountId) {
    const a = banks.find((x) => x.id === tx.accountId);
    return a?.name ?? 'Account (removed)';
  }
  return '—';
}

function labelForSelection(sel: SelectedAccount, banks: BankAccount[], cards: UserCard[]): string {
  if (!sel) return 'No account';
  if (sel.kind === 'bank') {
    const a = banks.find((x) => x.id === sel.id);
    return a?.name ?? 'Account';
  }
  const c = cards.find((x) => x.id === sel.id);
  return c?.name ?? 'Card';
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const shouldStartInEdit = params.edit === 'true';

  const { theme, themeMode } = useTheme();
  const {
    transactions,
    recurringExpenses,
    updateTransaction,
    deleteTransaction,
    deleteRecurringExpense,
    customCategories,
  } = useFinance();

  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const baseTransaction = useMemo(() => {
    return transactions.find(t => t.id === id) ?? null;
  }, [id, transactions]);

  const generatedTransaction = useMemo((): Transaction | null => {
    if (baseTransaction) return null;
    if (!isGeneratedRecurringTransactionId(id)) return null;
    const recurringId = getRecurringIdFromGeneratedTransactionId(id);
    if (!recurringId) return null;
    const rule = recurringExpenses.find(r => r.id === recurringId);
    if (!rule) return null;

    const dateStr = id.split('_').slice(-1)[0];
    const installmentLabel =
      rule.kind === 'installment' ? ' (Installment)' : ' (Recurring)';

    return {
      id,
      type: 'expense',
      amount: rule.amount,
      category: rule.category,
      date: dateStr,
      createdAt: rule.createdAt,
      description: `${rule.title}${installmentLabel}`,
    };
  }, [baseTransaction, id, recurringExpenses]);

  const transaction = baseTransaction ?? generatedTransaction;
  const isGenerated = transaction ? isGeneratedRecurringTransactionId(transaction.id) : false;

  const [isEditing, setIsEditing] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '');
  const [category, setCategory] = useState(transaction?.category ?? '');
  const [merchant, setMerchant] = useState(transaction?.merchant ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState<Date>(() =>
    transaction ? buildTransactionDateTime(transaction) : new Date()
  );

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount>(() =>
    accountFromTransaction(transaction ?? null)
  );
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [accounts, cards] = await Promise.all([loadBankAccounts(), loadUserCards()]);
        setBankAccounts(accounts);
        setUserCards(cards);
      })();
    }, [])
  );

  const accountDisplayLabel = useMemo(() => {
    if (!transaction) return '—';
    return resolveAccountLabel(transaction, bankAccounts, userCards);
  }, [transaction, bankAccounts, userCards]);

  const hasAccountsOrCards = bankAccounts.length > 0 || userCards.length > 0;

  const startEdit = () => {
    if (!transaction) return;
    if (isGenerated) {
      Alert.alert(
        'Recurring expense',
        'This is a generated occurrence from a recurring/installment plan. Editing individual occurrences is not supported yet.'
      );
      return;
    }
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setMerchant(transaction.merchant ?? '');
    setDescription(transaction.description ?? '');
    setDate(buildTransactionDateTime(transaction));
    setSelectedAccount(accountFromTransaction(transaction));
    setIsEditing(true);
  };

  useEffect(() => {
    if (shouldStartInEdit && transaction && !isGenerated) {
      // Start editing automatically when navigated from swipe action.
      startEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartInEdit, transaction?.id]);

  useEffect(() => {
    if (!transaction || isEditing) return;
    setMerchant(transaction.merchant ?? '');
    setDescription(transaction.description ?? '');
    setSelectedAccount(accountFromTransaction(transaction));
    setDate(buildTransactionDateTime(transaction));
  }, [
    transaction?.id,
    transaction?.merchant,
    transaction?.description,
    transaction?.accountId,
    transaction?.cardId,
    transaction?.date,
    transaction?.time,
    transaction?.createdAt,
    isEditing,
  ]);

  const cancelEdit = () => {
    if (transaction) {
      setSelectedAccount(accountFromTransaction(transaction));
      setDate(buildTransactionDateTime(transaction));
    }
    setIsEditing(false);
  };

  const applyEdit = () => {
    if (!transaction) return;
    const amountNum = parseFloat(amount);
    if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const y = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    updateTransaction(transaction.id, {
      type,
      amount: amountNum,
      category,
      merchant: merchant.trim() || undefined,
      description,
      date: `${y}-${mo}-${day}`,
      time: `${hh}:${min}`,
      cardId: selectedAccount?.kind === 'card' ? selectedAccount.id : undefined,
      accountId: selectedAccount?.kind === 'bank' ? selectedAccount.id : undefined,
    });
    setIsEditing(false);
  };

  const confirmDelete = () => {
    if (!transaction) return;

    if (isGenerated) {
      const recurringId = getRecurringIdFromGeneratedTransactionId(transaction.id);
      if (!recurringId) return;
      Alert.alert(
        'Delete recurring plan?',
        'This transaction is generated from a recurring/installment plan. Deleting it will remove the entire plan (including future occurrences).',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Plan',
            style: 'destructive',
            onPress: () => {
              deleteRecurringExpense(recurringId);
              router.back();
            },
          },
        ]
      );
      return;
    }

    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(transaction.id);
          router.back();
        },
      },
    ]);
  };

  if (!transaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Transaction not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction date</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {isEditing
                  ? formatDetailTransactionDate(
                      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    )
                  : formatDetailTransactionDate(transaction.date)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction time</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {isEditing
                  ? formatDetailTransactionTime(
                      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
                    )
                  : formatDetailTransactionTime(transaction.time, transaction.createdAt)}
              </Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DETAILS</Text>

          {/* Type */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Type</Text>
            {isEditing ? (
              <View style={[styles.typeSelector, { backgroundColor: theme.backgroundSecondary }]}>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'expense' && { backgroundColor: theme.secondary }]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'expense' ? buttonTextColor : theme.textSecondary }]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, type === 'income' && { backgroundColor: theme.primary }]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'income' ? buttonTextColor : theme.textSecondary }]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>{transaction.type}</Text>
            )}
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
              />
            ) : (
              <Text style={[styles.value, { color: transaction.type === 'income' ? theme.primary : theme.secondary }]}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            {isEditing ? (
              <CategorySelector
                type={type}
                selectedCategory={category}
                onSelect={(c) => setCategory(c.id)}
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>{getCategoryById(transaction.category, customCategories)?.name || transaction.category}</Text>
            )}
          </View>

          {/* Account */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Account</Text>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.accountSelector,
                    { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                    !hasAccountsOrCards && { opacity: 0.55 },
                  ]}
                  onPress={() => hasAccountsOrCards && setShowAccountPicker(true)}
                  activeOpacity={hasAccountsOrCards ? 0.7 : 1}
                  disabled={!hasAccountsOrCards}
                >
                  <Text style={[styles.value, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                    {labelForSelection(selectedAccount, bankAccounts, userCards)}
                  </Text>
                  <Icon name="chevron-down" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
                {!hasAccountsOrCards ? (
                  <Text style={[styles.accountHint, { color: theme.textTertiary }]}>
                    Add accounts or cards in Profile to link this transaction.
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>{accountDisplayLabel}</Text>
            )}
          </View>

          {/* Merchant */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Merchant</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={merchant}
                onChangeText={setMerchant}
                placeholder="e.g. Shopee, FairPrice"
                placeholderTextColor={theme.textTertiary}
                autoCapitalize="words"
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>
                {transaction.merchant ? transaction.merchant : '—'}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a note..."
                placeholderTextColor={theme.textTertiary}
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>
                {transaction.description ? transaction.description : '—'}
              </Text>
            )}
          </View>

          {/* Transaction date & time (edit only — summary is in the card above) */}
          {isEditing && (
            <>
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction date</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                    <input
                      type="date"
                      value={date.toISOString().split('T')[0]}
                      onChange={(e) => {
                        const next = new Date(e.target.value);
                        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setDate(next);
                      }}
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
                      onChange={(_, selected) => {
                        if (!selected) return;
                        const next = new Date(selected);
                        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                        setDate(next);
                      }}
                      maximumDate={new Date()}
                      themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                    />
                  </View>
                )}
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction time</Text>
                {Platform.OS === 'web' ? (
                  <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                    <input
                      type="time"
                      value={`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(':').map((x) => parseInt(x, 10));
                        if (!Number.isFinite(h) || !Number.isFinite(m)) return;
                        const next = new Date(date);
                        next.setHours(h, m, 0, 0);
                        setDate(next);
                      }}
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
                      mode="time"
                      display="default"
                      onChange={(_, selected) => {
                        if (!selected) return;
                        const next = new Date(date);
                        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                        setDate(next);
                      }}
                      themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                    />
                  </View>
                )}
              </View>
            </>
          )}
          </View>

          <View style={styles.actions}>
          {!isGenerated && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: isEditing ? theme.primary : theme.backgroundSecondary, borderColor: theme.cardBorder },
              ]}
              onPress={() => (isEditing ? applyEdit() : startEdit())}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryButtonText, { color: isEditing ? buttonTextColor : theme.text }]}>
                {isEditing ? 'Apply' : 'Edit'}
              </Text>
            </TouchableOpacity>
          )}

          {isEditing && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.cardBorder }]}
              onPress={cancelEdit}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: theme.cardBorder }]}
            onPress={confirmDelete}
            activeOpacity={0.8}
          >
            <Text style={[styles.deleteText, { color: theme.error }]}>Delete</Text>
          </TouchableOpacity>
          </View>
      </ScrollView>

      {showAccountPicker && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setShowAccountPicker(false)}>
          <View style={styles.accountModalOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAccountPicker(false)} />
            <GlassCard style={styles.accountModalCard} intensity="strong" borderRadius={Radius.lg}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.accountModalRow}
                  onPress={() => {
                    setSelectedAccount(undefined);
                    setShowAccountPicker(false);
                  }}
                  activeOpacity={0.65}
                >
                  <Icon
                    name="close-circle-outline"
                    size={20}
                    color={!selectedAccount ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.accountModalRowText,
                      { color: !selectedAccount ? theme.primary : theme.text },
                    ]}
                  >
                    No account
                  </Text>
                  {!selectedAccount ? <Icon name="checkmark" size={18} color={theme.primary} /> : <View style={{ width: 18 }} />}
                </TouchableOpacity>
                {bankAccounts.map((acct) => {
                  const isSel = selectedAccount?.kind === 'bank' && selectedAccount.id === acct.id;
                  return (
                    <React.Fragment key={acct.id}>
                      <View style={[styles.accountModalDivider, { backgroundColor: theme.cardBorder }]} />
                      <TouchableOpacity
                        style={styles.accountModalRow}
                        onPress={() => {
                          setSelectedAccount({ kind: 'bank', id: acct.id });
                          setShowAccountPicker(false);
                        }}
                        activeOpacity={0.65}
                      >
                        <BankAvatar name={acct.name} size={22} />
                        <Text
                          style={[styles.accountModalRowText, { color: isSel ? theme.primary : theme.text }]}
                          numberOfLines={1}
                        >
                          {acct.name}
                        </Text>
                        {isSel ? <Icon name="checkmark" size={18} color={theme.primary} /> : <View style={{ width: 18 }} />}
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
                {userCards.map((card) => {
                  const isSel = selectedAccount?.kind === 'card' && selectedAccount.id === card.id;
                  return (
                    <React.Fragment key={card.id}>
                      <View style={[styles.accountModalDivider, { backgroundColor: theme.cardBorder }]} />
                      <TouchableOpacity
                        style={styles.accountModalRow}
                        onPress={() => {
                          setSelectedAccount({ kind: 'card', id: card.id });
                          setShowAccountPicker(false);
                        }}
                        activeOpacity={0.65}
                      >
                        <Icon name="card-outline" size={20} color={isSel ? theme.primary : theme.textSecondary} />
                        <Text
                          style={[styles.accountModalRowText, { color: isSel ? theme.primary : theme.text }]}
                          numberOfLines={1}
                        >
                          {card.name}
                        </Text>
                        {isSel ? <Icon name="checkmark" size={18} color={theme.primary} /> : <View style={{ width: 18 }} />}
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </ScrollView>
            </GlassCard>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  accountHint: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16,
  },
  accountModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: Spacing.xl,
  },
  accountModalCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    paddingVertical: Spacing.sm,
    zIndex: 2,
  },
  accountModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  accountModalRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 0,
  },
  accountModalDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.xl,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  webDateContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
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
  actions: {
    gap: 10,
    marginTop: 6,
    paddingBottom: 16,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

