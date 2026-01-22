import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { TransactionForm } from '@/components/TransactionForm';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { TransactionCalendarMonth } from '@/components/TransactionCalendarMonth';
import { TransactionDayModal } from '@/components/TransactionDayModal';
import { Transaction, TimePeriod } from '@/types';
import { getCombinedTransactionsByPeriod, getExpensesByCategory } from '@/utils/calculations';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

export default function TransactionsScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const params = useLocalSearchParams();
  const {
    transactions,
    recurringExpenses,
    addTransaction,
    addRecurringExpense,
    updateTransaction,
  } = useFinance();
  const { theme, themeMode } = useTheme();
  
  // In dark mode, use black text on the light colored buttons for better contrast
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [showCalendar, setShowCalendar] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date>(new Date());
  const [formVisible, setFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Open form automatically if openForm parameter is present
  useEffect(() => {
    if (params.openForm === 'true') {
      setFormVisible(true);
      // Clear the parameter after opening
      router.setParams({ openForm: undefined });
    }
  }, [params.openForm]);

  const periodTransactions = getCombinedTransactionsByPeriod(
    transactions,
    recurringExpenses,
    selectedPeriod,
    referenceDate
  );
  const monthTransactions = useMemo(
    () => getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'month', referenceDate),
    [transactions, recurringExpenses, referenceDate]
  );
  // Preload current, prev, and next day transactions for seamless swiping
  const dayModalTransactions = useMemo(() => {
    const dayTx = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'day', dayModalDate);
    return [...dayTx].sort((a, b) => {
      const at = new Date(a.createdAt ?? a.date).getTime();
      const bt = new Date(b.createdAt ?? b.date).getTime();
      return bt - at;
    });
  }, [transactions, recurringExpenses, dayModalDate]);

  // Preload previous day
  const prevDayDate = useMemo(() => {
    const d = new Date(dayModalDate);
    d.setDate(d.getDate() - 1);
    return d;
  }, [dayModalDate]);

  const prevDayTransactions = useMemo(() => {
    const dayTx = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'day', prevDayDate);
    return [...dayTx].sort((a, b) => {
      const at = new Date(a.createdAt ?? a.date).getTime();
      const bt = new Date(b.createdAt ?? b.date).getTime();
      return bt - at;
    });
  }, [transactions, recurringExpenses, prevDayDate]);

  // Preload next day
  const nextDayDate = useMemo(() => {
    const d = new Date(dayModalDate);
    d.setDate(d.getDate() + 1);
    return d;
  }, [dayModalDate]);

  const nextDayTransactions = useMemo(() => {
    const dayTx = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'day', nextDayDate);
    return [...dayTx].sort((a, b) => {
      const at = new Date(a.createdAt ?? a.date).getTime();
      const bt = new Date(b.createdAt ?? b.date).getTime();
      return bt - at;
    });
  }, [transactions, recurringExpenses, nextDayDate]);
  const sortedTransactions = [...periodTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAdd = () => {
    setEditingTransaction(null);
    setFormVisible(true);
  };

  const handleSubmit = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transaction);
    } else {
      addTransaction(transaction);
    }
    setFormVisible(false);
    setEditingTransaction(null);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category);
    const isIncome = item.type === 'income';

    return (
      <TouchableOpacity
        style={[styles.transactionCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
        onPress={() => router.push(`/transaction/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: category?.color + '20' || theme.backgroundTertiary },
            ]}
          >
            <Text style={styles.categoryEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionCategory, { color: theme.text }]}>
              {category?.name || item.category}
            </Text>
            {item.description && (
              <Text style={[styles.transactionDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            )}
            <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>{formatDateShort(item.date)}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              { color: isIncome ? theme.primary : theme.secondary },
            ]}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color={theme.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.text }]}>No transactions yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Add your first transaction to start tracking
      </Text>
      <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={handleAdd}>
        <Text style={[styles.emptyButtonText, { color: buttonTextColor }]}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );

  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={handleAdd}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={buttonTextColor} />
        </TouchableOpacity>
      </View>

      <View style={styles.periodSelector}>
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={(p) => {
            setSelectedPeriod(p);
            if (p === 'month' && showCalendar) {
              // If already in calendar view, turn it off
              setShowCalendar(false);
            } else if (p !== 'month') {
              setShowCalendar(false);
            }
          }}
          showCalendarButton={true}
          isCalendarActive={showCalendar}
          onCalendarPress={() => {
            if (selectedPeriod !== 'month') {
              setSelectedPeriod('month');
              setShowCalendar(true);
              return;
            }
            setShowCalendar(v => !v);
          }}
        />
      </View>

      {selectedPeriod === 'month' && showCalendar && (
        <TransactionCalendarMonth
          monthTransactions={monthTransactions}
          monthDate={referenceDate}
          onMonthChange={(d) => setReferenceDate(d)}
          onSelectDate={(d) => {
            setReferenceDate(d);
            setDayModalDate(d);
            setDayModalVisible(true);
          }}
        />
      )}

      {/* Summary */}
      {periodTransactions.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: theme.primary }]}>
              {formatCurrency(totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: theme.secondary }]}>
              {formatCurrency(totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Net</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalIncome - totalExpenses >= 0 ? theme.primary : theme.error },
              ]}
            >
              {formatCurrency(totalIncome - totalExpenses)}
            </Text>
          </View>
        </View>
      )}

      {!showCalendar && (
        <FlatList
          data={sortedTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            sortedTransactions.length === 0 ? styles.emptyContainer : styles.listContent,
            { paddingBottom: tabBarHeight + 24 },
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TransactionDayModal
        visible={dayModalVisible}
        date={dayModalDate}
        transactions={dayModalTransactions}
        modalHeight={(Dimensions.get('window').height - tabBarHeight) * 0.8}
        onClose={() => setDayModalVisible(false)}
        onPrevDay={() => {
          const d = new Date(dayModalDate);
          d.setDate(d.getDate() - 1);
          setDayModalDate(d);
          setReferenceDate(d);
        }}
        onNextDay={() => {
          const d = new Date(dayModalDate);
          d.setDate(d.getDate() + 1);
          setDayModalDate(d);
          setReferenceDate(d);
        }}
        onPressTransaction={(tx) => {
          setDayModalVisible(false);
          router.push(`/transaction/${tx.id}`);
        }}
      />

      <TransactionForm
        visible={formVisible}
        onClose={() => {
          setFormVisible(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleSubmit}
        onSubmitRecurring={addRecurringExpense}
        initialTransaction={editingTransaction || undefined}
      />
    </SafeAreaView>
  );
}

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
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

