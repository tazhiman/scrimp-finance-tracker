import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { CategorySelector } from '@/components/CategorySelector';
import { Transaction, TransactionType } from '@/types';
import {
  getRecurringIdFromGeneratedTransactionId,
  isGeneratedRecurringTransactionId,
} from '@/utils/recurring';
import { formatCurrency } from '@/utils/dateHelpers';

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

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
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [date, setDate] = useState<Date>(() => {
    return transaction?.date ? new Date(transaction.date) : new Date();
  });

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
    setDescription(transaction.description ?? '');
    setDate(new Date(transaction.date));
    setIsEditing(true);
  };

  useEffect(() => {
    if (shouldStartInEdit && transaction && !isGenerated) {
      // Start editing automatically when navigated from swipe action.
      startEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartInEdit, transaction?.id]);

  const cancelEdit = () => {
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

    updateTransaction(transaction.id, {
      type,
      amount: amountNum,
      category,
      description,
      date: date.toISOString().split('T')[0],
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
            <Ionicons name="arrow-back" size={24} color={theme.text} />
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
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Added to app</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatDateTime(transaction.createdAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Transaction date</Text>
            <Text style={[styles.value, { color: theme.text }]}>{transaction.date}</Text>
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
              <Text style={[styles.value, { color: theme.text }]}>{transaction.category}</Text>
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

          {/* Date */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Date</Text>
            {isEditing ? (
              Platform.OS === 'web' ? (
                <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <input
                    type="date"
                    value={date.toISOString().split('T')[0]}
                    onChange={(e) => setDate(new Date(e.target.value))}
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
                    onChange={(_, selected) => selected && setDate(selected)}
                    maximumDate={new Date()}
                    themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                  />
                </View>
              )
            ) : (
              <Text style={[styles.value, { color: theme.text }]}>{transaction.date}</Text>
            )}
          </View>
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

