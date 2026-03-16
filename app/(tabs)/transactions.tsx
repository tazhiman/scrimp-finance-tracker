import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { TransactionForm } from '@/components/TransactionForm';
import { TimePeriodSelector } from '@/components/TimePeriodSelector';
import { TransactionCalendarMonth } from '@/components/TransactionCalendarMonth';
import { TransactionDayModal } from '@/components/TransactionDayModal';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { Transaction, TimePeriod } from '@/types';
import { getCombinedTransactionsByPeriod } from '@/utils/calculations';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';
import { Ionicons } from '@expo/vector-icons';

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
    customCategories,
  } = useFinance();
  const { theme, themeMode } = useTheme();
  
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [showCalendar, setShowCalendar] = useState(false);
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<Date>(new Date());
  const [savedDayModalState, setSavedDayModalState] = useState<{ date: Date; shouldReopen: boolean } | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.openForm === 'true') {
      setFormVisible(true);
      router.setParams({ openForm: undefined });
    }
  }, [params.openForm]);

  useFocusEffect(
    useCallback(() => {
      if (savedDayModalState?.shouldReopen) {
        const timer = setTimeout(() => {
          setDayModalDate(savedDayModalState.date);
          setDayModalVisible(true);
          setSavedDayModalState(null);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [savedDayModalState])
  );

  const periodTransactions = getCombinedTransactionsByPeriod(
    transactions, recurringExpenses, selectedPeriod, referenceDate
  );
  const monthTransactions = useMemo(
    () => getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'month', referenceDate),
    [transactions, recurringExpenses, referenceDate]
  );
  const dayModalTransactions = useMemo(() => {
    const dayTx = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'day', dayModalDate);
    return [...dayTx].sort((a, b) => {
      const at = new Date(a.createdAt ?? a.date).getTime();
      const bt = new Date(b.createdAt ?? b.date).getTime();
      return bt - at;
    });
  }, [transactions, recurringExpenses, dayModalDate]);

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
    const category = getCategoryById(item.category, customCategories);
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
              { backgroundColor: (category?.color || theme.backgroundTertiary) + '20' },
            ]}
          >
            <Text style={styles.categoryEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionCategory, { color: theme.text }]}>
              {category?.name || item.category}
            </Text>
            {item.description ? (
              <Text style={[styles.transactionDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>{formatDateShort(item.date)}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: isIncome ? theme.primary : theme.secondary },
          ]}
        >
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
        <Ionicons name="receipt-outline" size={48} color={theme.textTertiary} />
      </View>
      <Text style={[styles.emptyText, { color: theme.text }]}>No transactions yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Add your first transaction to start tracking
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: theme.primary }, Shadow.small]}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
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
      <GlassHeader style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        </View>
      </GlassHeader>

      <View style={styles.periodSelector}>
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={(p) => {
            setSelectedPeriod(p);
            if (p === 'month' && showCalendar) {
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

      {periodTransactions.length > 0 && (
        <View style={styles.summaryWrapper}>
          <GlassCard style={styles.summary} intensity="subtle" borderRadius={Radius.md}>
            <View style={styles.summaryInner}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
                <Text style={[styles.summaryValue, { color: theme.primary }]}>
                  {formatCurrency(totalIncome)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: theme.secondary }]}>
                  {formatCurrency(totalExpenses)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.cardBorder }]} />
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
          </GlassCard>
        </View>
      )}

      {!showCalendar && (
        <FlatList
          data={sortedTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            sortedTransactions.length === 0 ? styles.emptyContainer : styles.listContent,
            { paddingBottom: tabBarHeight + Spacing['3xl'] },
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
        onClose={() => {
          setDayModalVisible(false);
          setSavedDayModalState(null);
        }}
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
          setSavedDayModalState({ date: dayModalDate, shouldReopen: true });
          setDayModalVisible(false);
          setTimeout(() => { router.push(`/transaction/${tx.id}`); }, 50);
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
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  periodSelector: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  summaryWrapper: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  summary: {
    padding: 0,
  },
  summaryInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  listContent: {
    padding: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  categoryEmoji: {
    fontSize: 22,
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
    fontSize: 13,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
