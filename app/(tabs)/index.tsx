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
import { ProgressRing } from '@/components/ProgressRing';
import { PieChart, PieSlice } from '@/components/PieChart';
import { CreditCardStats } from '@/components/CreditCardStats';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import {
  getCombinedTransactionsByPeriod,
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateNetSavings,
  getContributionStatus,
  getExpensesByCategory,
} from '@/utils/calculations';
import { formatCurrency, isDateInPeriod } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';
import { Icon } from '@/components/ui/Icon';

export default function DashboardScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { transactions, goals, recurringExpenses, customCategories } = useFinance();
  const { progress } = useGamification();
  const { theme, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const monthlyTransactions = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'month');
  const income = calculateTotalIncome(monthlyTransactions);
  const expenses = calculateTotalExpenses(monthlyTransactions);
  const savings = calculateNetSavings(monthlyTransactions);

  const hasGoals = goals.length > 0;
  const monthlyGoalContributions = goals.reduce((sum, goal) => sum + goal.contributionAmount, 0);

  const savingsTarget = income * 0.2;
  const savingsProgress = savingsTarget > 0 ? Math.min((savings / savingsTarget) * 100, 100) : 0;
  
  const baseExpenseLimit = income * 0.8;
  const availableBudget = baseExpenseLimit - monthlyGoalContributions - expenses;
  const totalCommitted = monthlyGoalContributions + expenses;
  const expenseProgress = baseExpenseLimit > 0 ? Math.min((totalCommitted / baseExpenseLimit) * 100, 100) : 0;

  const statsSlices: PieSlice[] = useMemo(() => {
    const byCategory = getExpensesByCategory(monthlyTransactions);
    const slices: PieSlice[] = Object.entries(byCategory)
      .filter(([, amount]) => amount > 0)
      .map(([categoryId, amount]) => {
        const category = getCategoryById(categoryId, customCategories);
        return {
          id: categoryId,
          label: category?.name ?? 'Other',
          value: amount,
          color: category?.color ?? theme.accent,
        };
      });

    const goalColors = [theme.primary, theme.accent, theme.secondary, theme.ringOrange];
    goals.forEach((goal, idx) => {
      if (goal.contributionAmount <= 0) return;
      if (!goal.lastContributionDate || !isDateInPeriod(goal.lastContributionDate, 'month')) return;
      slices.push({
        id: `goal_contrib_${goal.id}`,
        label: `${goal.name} Contribution`,
        value: goal.contributionAmount,
        color: goalColors[idx % goalColors.length],
      });
    });

    slices.sort((a, b) => b.value - a.value);
    return slices;
  }, [
    goals,
    monthlyTransactions,
    theme.accent,
    theme.primary,
    theme.ringOrange,
    theme.secondary,
  ]);

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
    const contributionStatus = getContributionStatus(goal);
    const remaining = goal.targetAmount - goal.currentAmount;
    
    const getStatusConfig = () => {
      if (remaining <= 0) {
        return { text: 'Goal Reached', color: theme.primary };
      }
      switch (contributionStatus) {
        case 'completed':
          return { text: 'Paid this ' + (goal.frequency === 'weekly' ? 'week' : 'month'), color: theme.primary };
        case 'overdue':
          return { text: 'Overdue', color: theme.error };
        case 'due':
          return { text: 'Due this ' + (goal.frequency === 'weekly' ? 'week' : 'month'), color: theme.warningOrange };
      }
    };
    
    const statusConfig = getStatusConfig();
    
    return (
      <TouchableOpacity
        key={goal.id}
        onPress={() => router.push('/(tabs)/goals')}
        activeOpacity={0.7}
      >
        <GlassCard style={styles.ringCard} intensity="subtle">
          <View style={styles.ringCardInner}>
            <ProgressRing
              progress={goalProgressPercent}
              size={96}
              strokeWidth={10}
              color={theme.ringGreen}
              label={goal.name}
              value={`${Math.round(goalProgressPercent)}%`}
            />
            <View style={styles.ringDetails}>
              <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>Progress</Text>
              <Text style={[styles.ringDetailValue, { color: theme.text }]}>{formatCurrency(goal.currentAmount)}</Text>
              <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>of {formatCurrency(goal.targetAmount)}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '18' }]}>
                <Text style={[styles.statusPillText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderBudgetCard = (subtitle: string) => (
    <GlassCard style={styles.ringCard} intensity="subtle">
      <View style={styles.ringCardInner}>
        <ProgressRing
          progress={expenseProgress}
          size={96}
          strokeWidth={10}
          color={availableBudget < 0 ? theme.error : theme.ringOrange}
          label="Budget"
          value={`${Math.round(expenseProgress)}%`}
        />
        <View style={styles.ringDetails}>
          <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>
            {availableBudget >= 0 ? 'Available' : 'Over Budget'}
          </Text>
          <Text style={[
            styles.ringDetailValue,
            { color: availableBudget < 0 ? theme.error : theme.text },
          ]}>
            {formatCurrency(Math.abs(availableBudget))}
          </Text>
          <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
    </GlassCard>
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

        <CreditCardStats onManagePress={() => router.push('/(tabs)/manage-cards')} />

        {hasGoals ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Goals</Text>
            {goals.slice(0, 2).map(renderGoalCard)}
            {goals.length > 2 && (
              <TouchableOpacity
                style={[styles.viewAllButton, { borderColor: theme.cardBorder }]}
                onPress={() => router.push('/(tabs)/goals')}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewAllText, { color: theme.primary }]}>
                  View All {goals.length} Goals
                </Text>
                <Icon name="chevron-forward" size={18} color={theme.primary} />
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Remaining</Text>
            {renderBudgetCard(`Goals: ${formatCurrency(monthlyGoalContributions)} • Spending: ${formatCurrency(expenses)}`)}
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

            <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Remaining</Text>
            {renderBudgetCard(`Monthly spending: ${formatCurrency(expenses)}`)}
          </>
        )}

        <TouchableOpacity
          style={[styles.addTransactionButton, { backgroundColor: theme.primary }, Shadow.medium]}
          onPress={() => router.push('/(tabs)/transactions?openForm=true')}
          activeOpacity={0.8}
        >
          <Icon name="add-circle" size={20} color={buttonTextColor} />
          <Text style={[styles.addTransactionText, { color: buttonTextColor }]}>Add Transaction</Text>
        </TouchableOpacity>

        <GlassCard style={styles.statsCard} intensity="subtle" borderRadius={Radius.lg}>
          <View style={styles.statsInner}>
            <View style={styles.statsHeader}>
              <Text style={[styles.statsTitle, { color: theme.text }]}>Statistics</Text>
              <Text style={[styles.statsSubtitle, { color: theme.textSecondary }]}>This month</Text>
            </View>

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

                <View style={[styles.statsSelectedCard, { backgroundColor: theme.backgroundSecondary + '80', borderColor: theme.cardBorder }]}>
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
                        selectedSliceId === slice.id && { backgroundColor: theme.backgroundSecondary + '60', borderRadius: Radius.sm },
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
    fontSize: 34,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
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
  ringCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
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
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Spacing.md,
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
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
