import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Modal,
  ScrollView,
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
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow, FILTER_TRACK_HEIGHT } from '@/constants/design';
import { Transaction, TimePeriod, BankAccount, UserCard } from '@/types';
import { getCombinedTransactionsByPeriod } from '@/utils/calculations';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';
import { getTransactionRowLabels } from '@/utils/transactionDisplay';
import { Icon } from '@/components/ui/Icon';
import { BankAvatar } from '@/components/ui/BankAvatar';
import { loadBankAccounts } from '@/utils/onboarding';
import { loadUserCards } from '@/utils/storage';

type TypeFilter = 'all' | 'income' | 'expense';
type AccountFilter =
  | 'all'
  | { kind: 'bank'; id: string }
  | { kind: 'card'; id: string };

const WINDOW_W = Dimensions.get('window').width;
const WINDOW_H = Dimensions.get('window').height;

type MenuAnchor = { x: number; y: number; width: number; height: number };

function clampMenuLeft(left: number, menuWidth: number, margin = Spacing.md): number {
  return Math.min(Math.max(margin, left), WINDOW_W - menuWidth - margin);
}

/** Flip above anchor only using realistic menu height (not max scroll height). */
function computePopoverTop(
  anchor: MenuAnchor,
  approxMenuHeight: number,
  gap: number,
  bottomSafe = 88
): number {
  let top = anchor.y + anchor.height + gap;
  if (top + approxMenuHeight > WINDOW_H - bottomSafe) {
    const aboveTop = anchor.y - approxMenuHeight - gap;
    if (aboveTop >= 44) top = aboveTop;
  }
  return top;
}

function applyTransactionFilters(
  list: Transaction[],
  typeFilter: TypeFilter,
  accountFilter: AccountFilter
): Transaction[] {
  let next = list;
  if (typeFilter === 'income') next = next.filter((t) => t.type === 'income');
  else if (typeFilter === 'expense') next = next.filter((t) => t.type === 'expense');
  if (accountFilter !== 'all') {
    if (accountFilter.kind === 'bank') {
      next = next.filter((t) => t.accountId === accountFilter.id);
    } else {
      next = next.filter((t) => t.cardId === accountFilter.id);
    }
  }
  return next;
}

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

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('all');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [showTypeFilterModal, setShowTypeFilterModal] = useState(false);
  const [showAccountFilterModal, setShowAccountFilterModal] = useState(false);
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<MenuAnchor | null>(null);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<MenuAnchor | null>(null);
  const typePillRef = useRef<View>(null);
  const accountPillRef = useRef<View>(null);

  const openTypeFilterMenu = useCallback(() => {
    requestAnimationFrame(() => {
      typePillRef.current?.measureInWindow((x, y, width, height) => {
        setTypeMenuAnchor({ x, y, width, height });
        setShowTypeFilterModal(true);
      });
    });
  }, []);

  const closeTypeFilterMenu = useCallback(() => {
    setShowTypeFilterModal(false);
    setTypeMenuAnchor(null);
  }, []);

  const openAccountFilterMenu = useCallback(() => {
    requestAnimationFrame(() => {
      accountPillRef.current?.measureInWindow((x, y, width, height) => {
        setAccountMenuAnchor({ x, y, width, height });
        setShowAccountFilterModal(true);
      });
    });
  }, []);

  const closeAccountFilterMenu = useCallback(() => {
    setShowAccountFilterModal(false);
    setAccountMenuAnchor(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [accounts, cards] = await Promise.all([loadBankAccounts(), loadUserCards()]);
        setBankAccounts(accounts);
        setUserCards(cards);
        setAccountFilter((prev) => {
          if (prev === 'all') return prev;
          if (prev.kind === 'bank' && !accounts.some((a) => a.id === prev.id)) return 'all';
          if (prev.kind === 'card' && !cards.some((c) => c.id === prev.id)) return 'all';
          return prev;
        });
      })();
    }, [])
  );

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

  const sortedPeriodTransactions = useMemo(
    () =>
      [...periodTransactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [periodTransactions]
  );

  const filteredTransactions = useMemo(
    () => applyTransactionFilters(sortedPeriodTransactions, typeFilter, accountFilter),
    [sortedPeriodTransactions, typeFilter, accountFilter]
  );

  const filteredDayModalTransactions = useMemo(
    () => applyTransactionFilters(dayModalTransactions, typeFilter, accountFilter),
    [dayModalTransactions, typeFilter, accountFilter]
  );

  const hasActiveFilters = typeFilter !== 'all' || accountFilter !== 'all';
  const hasAccountsOrCards = bankAccounts.length > 0 || userCards.length > 0;

  const typeFilterLabel =
    typeFilter === 'all' ? 'All' : typeFilter === 'income' ? 'Income' : 'Expenses';

  const accountFilterLabel = useMemo(() => {
    if (accountFilter === 'all') return '';
    if (accountFilter.kind === 'bank') {
      const a = bankAccounts.find((x) => x.id === accountFilter.id);
      return a?.name ?? 'Account';
    }
    const c = userCards.find((x) => x.id === accountFilter.id);
    return c?.name ?? 'Card';
  }, [accountFilter, bankAccounts, userCards]);

  const typePopoverLayout = useMemo(() => {
    if (!typeMenuAnchor) return null;
    const width = Math.min(Math.max(typeMenuAnchor.width, 232), WINDOW_W - Spacing.md * 2);
    const left = clampMenuLeft(typeMenuAnchor.x, width);
    const gap = 10;
    const approxH = 188;
    const top = computePopoverTop(typeMenuAnchor, approxH, gap);
    return { top, left, width };
  }, [typeMenuAnchor]);

  const accountPopoverLayout = useMemo(() => {
    if (!accountMenuAnchor) return null;
    const width = Math.min(Math.max(accountMenuAnchor.width, 260), WINDOW_W - Spacing.md * 2);
    const left = clampMenuLeft(accountMenuAnchor.x, width);
    const gap = 10;
    const rowCount = 1 + bankAccounts.length + userCards.length;
    const approxH = Math.min(56 + rowCount * 52, WINDOW_H * 0.42);
    const top = computePopoverTop(accountMenuAnchor, approxH, gap);
    const scrollMaxHeight = Math.min(WINDOW_H * 0.42, 320);
    return { top, left, width, scrollMaxHeight };
  }, [accountMenuAnchor, bankAccounts.length, userCards.length]);

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
    const categoryLabel = category?.name || item.category;
    const { primary, subtitle } = getTransactionRowLabels(item, categoryLabel);

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
            <Text style={[styles.transactionCategory, { color: theme.text }]}>{primary}</Text>
            {subtitle ? (
              <Text style={[styles.transactionDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {subtitle}
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

  const renderEmptyState = () => {
    const filteredEmpty = hasActiveFilters && sortedPeriodTransactions.length > 0;
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
          <Icon name="receipt-outline" size={48} color={theme.textTertiary} />
        </View>
        <Text style={[styles.emptyText, { color: theme.text }]}>
          {filteredEmpty ? 'No matching transactions' : 'No transactions yet'}
        </Text>
        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
          {filteredEmpty
            ? 'Try changing your filters or time period.'
            : 'Add your first transaction to start tracking'}
        </Text>
        {filteredEmpty ? (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.cardBorder }]}
            onPress={() => {
              setTypeFilter('all');
              setAccountFilter('all');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.emptyButtonText, { color: theme.primary }]}>Clear filters</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.primary }, Shadow.small]}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Text style={[styles.emptyButtonText, { color: buttonTextColor }]}>Add Transaction</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
      </View>

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

      <View style={styles.filterRow}>
        <View ref={typePillRef} collapsable={false} style={styles.filterPillWrap}>
        <TouchableOpacity
          style={[styles.filterPill, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
          onPress={openTypeFilterMenu}
          activeOpacity={0.7}
        >
          <View style={styles.filterPillTextWrap}>
            <Text style={[styles.filterPillText, { color: theme.text }]} numberOfLines={1}>
              {typeFilterLabel}
            </Text>
          </View>
          <Icon name="chevron-down" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        </View>
        <View ref={accountPillRef} collapsable={false} style={styles.filterPillWrap}>
        <TouchableOpacity
          style={[
            styles.filterPill,
            { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
            !hasAccountsOrCards && { opacity: 0.55 },
          ]}
          onPress={() => hasAccountsOrCards && openAccountFilterMenu()}
          activeOpacity={hasAccountsOrCards ? 0.7 : 1}
          disabled={!hasAccountsOrCards}
        >
          <View style={styles.filterPillMain}>
            {accountFilter === 'all' ? (
              <>
                <Icon name="bank" size={20} color={theme.text} />
                <View style={styles.filterPillLabelSlot}>
                  <Text style={[styles.filterPillText, { color: theme.text }]} numberOfLines={1}>
                    All
                  </Text>
                </View>
              </>
            ) : accountFilter.kind === 'bank' ? (
              <>
                <BankAvatar name={accountFilterLabel} size={20} />
                <View style={styles.filterPillLabelSlot}>
                  <Text style={[styles.filterPillText, { color: theme.text }]} numberOfLines={1}>
                    {accountFilterLabel}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Icon name="card-outline" size={20} color={theme.textSecondary} />
                <View style={styles.filterPillLabelSlot}>
                  <Text style={[styles.filterPillText, { color: theme.text }]} numberOfLines={1}>
                    {accountFilterLabel}
                  </Text>
                </View>
              </>
            )}
          </View>
          <Icon name="chevron-down" size={16} color={theme.textTertiary} />
        </TouchableOpacity>
        </View>
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
          data={filteredTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            filteredTransactions.length === 0 ? styles.emptyContainer : styles.listContent,
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
        transactions={filteredDayModalTransactions}
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

      {showTypeFilterModal && (
        <Modal transparent animationType="fade" visible onRequestClose={closeTypeFilterMenu}>
          <View style={styles.filterMenuOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeTypeFilterMenu} />
            {typePopoverLayout && (
              <GlassCard
                style={[
                  styles.filterMenuPopover,
                  Shadow.small,
                  {
                    position: 'absolute',
                    top: typePopoverLayout.top,
                    left: typePopoverLayout.left,
                    width: typePopoverLayout.width,
                  },
                ]}
                intensity="strong"
                borderRadius={18}
              >
                {(['all', 'income', 'expense'] as const).map((key, idx) => {
                  const labels = { all: 'All', income: 'Income', expense: 'Expenses' } as const;
                  const isSelected = typeFilter === key;
                  return (
                    <React.Fragment key={key}>
                      {idx > 0 && <View style={[styles.dropdownDivider, { backgroundColor: theme.cardBorder }]} />}
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setTypeFilter(key);
                          closeTypeFilterMenu();
                        }}
                        activeOpacity={0.6}
                      >
                        <View style={styles.menuLeading}>
                          {isSelected ? (
                            <Icon name="checkmark" size={18} color={theme.primary} />
                          ) : (
                            <Icon
                              name={key === 'all' ? 'list' : key === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                              size={20}
                              color={theme.textSecondary}
                            />
                          )}
                        </View>
                        <Text style={[styles.dropdownItemText, { color: isSelected ? theme.primary : theme.text }]}>
                          {labels[key]}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </GlassCard>
            )}
          </View>
        </Modal>
      )}

      {showAccountFilterModal && (
        <Modal transparent animationType="fade" visible onRequestClose={closeAccountFilterMenu}>
          <View style={styles.filterMenuOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeAccountFilterMenu} />
            {accountPopoverLayout && (
              <GlassCard
                style={[
                  styles.filterMenuPopover,
                  Shadow.small,
                  {
                    position: 'absolute',
                    top: accountPopoverLayout.top,
                    left: accountPopoverLayout.left,
                    width: accountPopoverLayout.width,
                  },
                ]}
                intensity="strong"
                borderRadius={18}
              >
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: accountPopoverLayout.scrollMaxHeight }}
                >
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setAccountFilter('all');
                      closeAccountFilterMenu();
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={styles.menuLeading}>
                      {accountFilter === 'all' ? (
                        <Icon name="checkmark" size={18} color={theme.primary} />
                      ) : (
                        <Icon name="bank" size={20} color={theme.textSecondary} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: accountFilter === 'all' ? theme.primary : theme.text },
                      ]}
                    >
                      All accounts
                    </Text>
                  </TouchableOpacity>
                  {bankAccounts.map((acct) => {
                    const isSelected =
                      accountFilter !== 'all' && accountFilter.kind === 'bank' && accountFilter.id === acct.id;
                    return (
                      <React.Fragment key={acct.id}>
                        <View style={[styles.dropdownDivider, { backgroundColor: theme.cardBorder }]} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setAccountFilter({ kind: 'bank', id: acct.id });
                            closeAccountFilterMenu();
                          }}
                          activeOpacity={0.6}
                        >
                          <View style={styles.menuLeading}>
                            {isSelected ? (
                              <Icon name="checkmark" size={18} color={theme.primary} />
                            ) : (
                              <BankAvatar name={acct.name} size={22} />
                            )}
                          </View>
                          <Text
                            style={[styles.dropdownItemText, { color: isSelected ? theme.primary : theme.text }]}
                            numberOfLines={1}
                          >
                            {acct.name}
                          </Text>
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                  {userCards.map((card) => {
                    const isSelected =
                      accountFilter !== 'all' && accountFilter.kind === 'card' && accountFilter.id === card.id;
                    return (
                      <React.Fragment key={card.id}>
                        <View style={[styles.dropdownDivider, { backgroundColor: theme.cardBorder }]} />
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setAccountFilter({ kind: 'card', id: card.id });
                            closeAccountFilterMenu();
                          }}
                          activeOpacity={0.6}
                        >
                          <View style={styles.menuLeading}>
                            {isSelected ? (
                              <Icon name="checkmark" size={18} color={theme.primary} />
                            ) : (
                              <Icon name="card-outline" size={20} color={theme.textSecondary} />
                            )}
                          </View>
                          <Text
                            style={[styles.dropdownItemText, { color: isSelected ? theme.primary : theme.text }]}
                            numberOfLines={1}
                          >
                            {card.name}
                          </Text>
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </ScrollView>
              </GlassCard>
            )}
          </View>
        </Modal>
      )}

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
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodSelector: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  filterPillWrap: {
    flex: 1,
    minWidth: 0,
    height: FILTER_TRACK_HEIGHT,
  },
  filterPill: {
    flex: 1,
    height: FILTER_TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  filterPillTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: Spacing.xs,
    justifyContent: 'center',
  },
  filterPillMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minWidth: 0,
    marginRight: Spacing.xs,
  },
  filterPillLabelSlot: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  filterMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  filterMenuPopover: {
    paddingVertical: Spacing.md,
    zIndex: 2,
    overflow: 'hidden',
  },
  menuLeading: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  dropdownDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.lg,
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
