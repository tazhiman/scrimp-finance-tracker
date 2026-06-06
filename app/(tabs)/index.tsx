import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFinance } from '@/context/FinanceContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { useBankAccounts } from '@/context/BankAccountsContext';
import { StaleBalanceBanner } from '@/components/StaleBalanceBanner';
import { setBalanceBannerDismissedToday, wasBalanceBannerDismissedToday } from '@/utils/storage';
import { ProgressRing } from '@/components/ProgressRing';
import { PieChart, PieSlice } from '@/components/PieChart';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetSavings,
} from '@/utils/calculations';
import { getGoalStatusBadge, goalStatusColor } from '@/utils/goalReserve';
import {
  buildMonthlyStatsSlices,
  computeMonthlyBudgetMetrics,
} from '@/utils/monthlyStatsSlices';
import {
  getDaysLeftInPeriod,
  getBudgetPaceHeadline,
  getBudgetRingColor,
} from '@/utils/budgetPace';
import { formatCurrency } from '@/utils/dateHelpers';
import {
  getCombinedTransactionsForPayContext,
  resolvePayPeriodContext,
} from '@/utils/payPeriodContext';
import { Icon } from '@/components/ui/Icon';

export default function DashboardScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { transactions, goals, recurringExpenses, customCategories } = useFinance();
  const { progress } = useGamification();
  const { theme, themeMode } = useTheme();
  const { getStaleAccounts } = useBankAccounts();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(true); // start hidden; async check below

  useEffect(() => {
    wasBalanceBannerDismissedToday().then(dismissed => setBannerDismissed(dismissed));
  }, []);

  const staleAccounts = getStaleAccounts(14);
  const showBanner = !bannerDismissed && staleAccounts.length > 0;

  const handleBannerDismiss = async () => {
    setBannerDismissed(true);
    await setBalanceBannerDismissedToday();
  };

  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const payPeriodContext = useMemo(
    () => resolvePayPeriodContext(recurringExpenses, new Date()),
    [recurringExpenses]
  );

  const monthlyTransactions = useMemo(
    () => getCombinedTransactionsForPayContext(transactions, recurringExpenses, payPeriodContext),
    [transactions, recurringExpenses, payPeriodContext]
  );

  const income = calculateTotalIncome(monthlyTransactions);
  const expenses = calculateTotalExpenses(monthlyTransactions);
  const savings = calculateNetSavings(monthlyTransactions);

  const hasGoals = goals.length > 0;
  const savingsTarget = income * 0.2;
  const savingsProgress = savingsTarget > 0 ? Math.min((savings / savingsTarget) * 100, 100) : 0;

  const { availableBudget, expenseProgress } = computeMonthlyBudgetMetrics(
    transactions,
    recurringExpenses,
    goals,
    new Date(),
    payPeriodContext.payDay
  );

  const budgetPace = useMemo(() => {
    const now = new Date();
    const daysLeft = getDaysLeftInPeriod(payPeriodContext.periodEnd, now);
    const dailyHeadroom = availableBudget / daysLeft;
    const headline = getBudgetPaceHeadline(availableBudget, income, daysLeft);
    const ringColor = getBudgetRingColor({
      availableBudget,
      income,
      dailyHeadroom,
      periodStart: payPeriodContext.periodStart,
      periodEnd: payPeriodContext.periodEnd,
      theme: {
        error: theme.error,
        warningOrange: theme.warningOrange,
        ringGreen: theme.ringGreen,
        ringOrange: theme.ringOrange,
      },
    });
    return { daysLeft, dailyHeadroom, headline, ringColor };
  }, [
    availableBudget,
    income,
    payPeriodContext.periodStart,
    payPeriodContext.periodEnd,
    theme.error,
    theme.warningOrange,
    theme.ringGreen,
    theme.ringOrange,
  ]);

  const statsSlices: PieSlice[] = useMemo(
    () =>
      buildMonthlyStatsSlices(
        transactions,
        recurringExpenses,
        goals,
        customCategories,
        {
          primary: theme.primary,
          accent: theme.accent,
          secondary: theme.secondary,
          ringOrange: theme.ringOrange,
        },
        new Date(),
        payPeriodContext.payDay
      ),
    [
      transactions,
      recurringExpenses,
      goals,
      customCategories,
      payPeriodContext.payDay,
      theme.primary,
      theme.accent,
      theme.secondary,
      theme.ringOrange,
    ]
  );

  useEffect(() => {
    if (!selectedSliceId && statsSlices.length > 0) {
      setSelectedSliceId(statsSlices[0].id);
      return;
    }
    if (selectedSliceId && statsSlices.length > 0 && !statsSlices.some(s => s.id === selectedSliceId)) {
      setSelectedSliceId(statsSlices[0].id);
    }
  }, [selectedSliceId, statsSlices]);

  const selectedSlice = statsSlices.find(s => s.id === selectedSliceId) ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderGoalCard = (goal: typeof goals[0]) => {
    const goalProgressPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const statusBadge = getGoalStatusBadge(goal, transactions);
    const statusColor = goalStatusColor(statusBadge.severity, theme);
    
    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => router.push('/(tabs)/goals')}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.ringCard} intensity="subtle">
          <Text style={[styles.goalCardTitle, { color: theme.text }]} numberOfLines={2}>
            {goal.name}
          </Text>
          <View style={styles.ringCardInner}>
            <ProgressRing
              progress={goalProgressPercent}
              size={96}
              strokeWidth={10}
              color={theme.ringGreen}
              showPercentage
            />
            <View style={styles.ringDetails}>
              <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>Progress</Text>
              <Text style={[styles.ringDetailValue, { color: theme.text }]}>{formatCurrency(goal.currentAmount)}</Text>
              <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>of {formatCurrency(goal.targetAmount)}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                <Text style={[styles.statusPillText, { color: statusColor }]}>{statusBadge.text}</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const budgetCardA11yLabel = `${budgetPace.headline}. ${
    availableBudget >= 0 ? 'Available' : 'Over budget'
  } ${formatCurrency(Math.abs(availableBudget))}. Opens monthly spending details.`;

  const renderBudgetCard = () => (
    <TouchableOpacity
      onPress={() => router.push('/monthly-spending')}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={budgetCardA11yLabel}
    >
      <GlassCard style={styles.ringCard} intensity="subtle">
        <View style={styles.ringCardInner}>
          <ProgressRing
            progress={expenseProgress}
            size={96}
            strokeWidth={10}
            color={budgetPace.ringColor}
            label="Budget"
            value={`${Math.round(expenseProgress)}%`}
          />
          <View style={styles.ringDetails}>
            <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>
              {availableBudget >= 0 ? 'Available' : 'Over Budget'}
            </Text>
            <Text
              style={[
                styles.budgetAvailableHero,
                { color: availableBudget < 0 ? theme.error : theme.primary },
              ]}
            >
              {formatCurrency(Math.abs(availableBudget))}
            </Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing['3xl'] }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.text }]}>Welcome back!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Level {progress.level} • {progress.xp.toLocaleString()} XP
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            onPress={() => router.push('/(tabs)/settings')}
            activeOpacity={0.7}
          >
            <Icon name="settings-outline" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {showBanner && (
          <StaleBalanceBanner
            staleCount={staleAccounts.length}
            onReview={() => {
              handleBannerDismiss();
              router.push('/(tabs)/profile');
            }}
            onDismiss={handleBannerDismiss}
          />
        )}

        {hasGoals ? (
          <>
            <Text style={[styles.budgetPaceSupporting, { color: theme.textSecondary }]} numberOfLines={2}>
              {budgetPace.headline}
            </Text>
            {renderBudgetCard()}

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Goals</Text>
            {goals.slice(0, 2).map(renderGoalCard)}
            {goals.length > 2 && (
              <TouchableOpacity
                style={[styles.viewAllButton, { backgroundColor: theme.primary }, Shadow.small]}
                onPress={() => router.push('/(tabs)/goals')}
                activeOpacity={0.85}
              >
                <Text style={[styles.viewAllText, { color: buttonTextColor }]}>
                  View All {goals.length} Goals
                </Text>
                <Icon name="chevron-forward" size={20} color={buttonTextColor} />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Savings</Text>
            <GlassCard style={styles.ringCard} intensity="subtle">
              <View style={styles.ringCardInner}>
                <ProgressRing
                  progress={savingsProgress}
                  size={96}
                  strokeWidth={10}
                  color={theme.ringGreen}
                  label="Savings"
                  value={formatCurrency(savings)}
                />
                <View style={styles.ringDetails}>
                  <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>Net Savings</Text>
                  <Text style={[styles.ringDetailValue, { color: theme.text }]}>{formatCurrency(savings)}</Text>
                  <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>Goal: {formatCurrency(savingsTarget)}</Text>
                </View>
              </View>
            </GlassCard>

            <Text style={[styles.budgetPaceSupporting, { color: theme.textSecondary }]} numberOfLines={2}>
              {budgetPace.headline}
            </Text>
            {renderBudgetCard()}
          </>
        )}

        {!(hasGoals && goals.length > 2) && (
          <TouchableOpacity
            style={[styles.addTransactionButton, { backgroundColor: theme.primary }, Shadow.medium]}
            onPress={() => router.push('/(tabs)/transactions?openForm=true')}
            activeOpacity={0.8}
          >
            <Icon name="add-circle" size={20} color={buttonTextColor} />
            <Text style={[styles.addTransactionText, { color: buttonTextColor }]}>Add Transaction</Text>
          </TouchableOpacity>
        )}

        <GlassCard style={styles.statsCard} intensity="subtle" borderRadius={Radius.lg}>
          <View style={styles.statsInner}>
            <TouchableOpacity
              onPress={() => router.push('/monthly-spending')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Statistics, open monthly spending details"
              style={styles.statsHeader}
            >
              <Text style={[styles.statsTitle, { color: theme.text }]}>Statistics</Text>
              <View style={styles.statsHeaderRight}>
                <Text style={[styles.statsSubtitle, { color: theme.textSecondary }]}>This month</Text>
                <Icon name="chevron-forward" size={18} color={theme.textTertiary} />
              </View>
            </TouchableOpacity>

            {statsSlices.length === 0 ? (
              <Text style={[styles.statsEmpty, { color: theme.textSecondary }]}>
                No spending (or goal contributions) yet this month.
              </Text>
            ) : (
              <>
                <View style={styles.statsChartContainer}>
                  <PieChart
                    size={220}
                    slices={statsSlices}
                    selectedId={selectedSliceId}
                    onPressSlice={(slice) => setSelectedSliceId(slice.id)}
                  />
                </View>

                <View
                  style={[
                    styles.statsSelectedCard,
                    { backgroundColor: theme.backgroundSecondary + '80', borderColor: theme.cardBorder },
                  ]}
                >
                  <Text style={[styles.statsSelectedLabel, { color: theme.textSecondary }]}>Selected</Text>
                  <Text style={[styles.statsSelectedValue, { color: theme.text }]}>
                    {(selectedSlice?.label ?? '—') + ': ' + (selectedSlice ? formatCurrency(selectedSlice.value) : '—')}
                  </Text>
                </View>

                <View style={styles.statsRows}>
                  {statsSlices.map((slice) => (
                    <TouchableOpacity
                      key={slice.id}
                      style={[
                        styles.statsRow,
                        selectedSliceId === slice.id && {
                          backgroundColor: theme.backgroundSecondary + '60',
                          borderRadius: Radius.sm,
                        },
                      ]}
                      onPress={() => setSelectedSliceId(slice.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.statsRowLeft}>
                        <View style={[styles.statsSwatch, { backgroundColor: slice.color }]} />
                        <Text style={[styles.statsRowLabel, { color: theme.text }]} numberOfLines={1}>
                          {slice.label}
                        </Text>
                      </View>
                      <Text style={[styles.statsRowValue, { color: theme.textSecondary }]}>
                        {formatCurrency(slice.value)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing['3xl'],
  },
  headerLeft: {
    flex: 1,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: Spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  budgetPaceSupporting: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    letterSpacing: -0.2,
  },
  ringCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  goalCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: Spacing.lg,
  },
  ringCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  ringDetails: {
    flex: 1,
  },
  ringDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  ringDetailValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  budgetAvailableHero: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginTop: Spacing.sm,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['3xl'],
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    paddingVertical: 15,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  addTransactionText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
  statsCard: {
    marginBottom: Spacing['3xl'],
  },
  statsInner: {
    padding: Spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsEmpty: {
    fontSize: 14,
    paddingVertical: Spacing.xl,
    textAlign: 'center',
  },
  statsChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  statsSelectedCard: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  statsSelectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsSelectedValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  statsRows: {
    gap: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.lg,
  },
  statsSwatch: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    marginRight: Spacing.lg,
  },
  statsRowLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statsRowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
