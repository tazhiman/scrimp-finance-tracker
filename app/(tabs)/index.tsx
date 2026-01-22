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
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const tabBarHeight = useBottomTabBarHeight();
  const { transactions, goals, recurringExpenses } = useFinance();
  const { progress } = useGamification();
  const { theme, themeMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  
  // In dark mode, use black text on the light colored button for better contrast
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  // Always use monthly data for progress rings
  const monthlyTransactions = getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'month');
  const income = calculateTotalIncome(monthlyTransactions);
  const expenses = calculateTotalExpenses(monthlyTransactions);
  const savings = calculateNetSavings(monthlyTransactions);

  // Calculate goal progress (total progress across all goals)
  const hasGoals = goals.length > 0;
  const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const goalProgress = totalGoalTarget > 0 ? Math.min((totalGoalCurrent / totalGoalTarget) * 100, 100) : 0;

  // Calculate monthly goal contributions from this month's transactions
  const monthlyGoalContributions = goals.reduce((sum, goal) => sum + goal.contributionAmount, 0);

  // Calculate progress percentages
  const savingsTarget = income * 0.2; // 20% savings target
  const savingsProgress = savingsTarget > 0 ? Math.min((savings / savingsTarget) * 100, 100) : 0;
  
  // Budget calculation: 80% of income - monthly goal contributions - expenses
  const baseExpenseLimit = income * 0.8; // 80% expense limit
  const availableBudget = baseExpenseLimit - monthlyGoalContributions - expenses;
  const totalCommitted = monthlyGoalContributions + expenses; // Total money committed (goals + spending)
  const expenseProgress = baseExpenseLimit > 0 ? Math.min((totalCommitted / baseExpenseLimit) * 100, 100) : 0;

  const statsSlices: PieSlice[] = useMemo(() => {
    const byCategory = getExpensesByCategory(monthlyTransactions);
    const slices: PieSlice[] = Object.entries(byCategory)
      .filter(([, amount]) => amount > 0)
      .map(([categoryId, amount]) => {
        const category = getCategoryById(categoryId);
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
      // Only show goal slices for goals that have actually been contributed to this month
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
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.text }]}>Welcome back!</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Level {progress.level} • {progress.xp.toLocaleString()} XP</Text>
        </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(tabs)/settings')}
          >
            <Ionicons name="settings-outline" size={28} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Rings */}
        {hasGoals ? (
          <>
            {/* Active Goals Section */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Goals</Text>
            {goals.slice(0, 2).map((goal) => {
              const goalProgressPercent = (goal.currentAmount / goal.targetAmount) * 100;
              const contributionStatus = getContributionStatus(goal);
              const remaining = goal.targetAmount - goal.currentAmount;
              
              // Determine status styling
              const getStatusConfig = () => {
                if (remaining <= 0) {
                  return {
                    icon: 'checkmark-circle' as const,
                    text: 'Goal Reached',
                    color: theme.primary,
                  };
                }
                
                switch (contributionStatus) {
                  case 'completed':
                    return {
                      icon: 'checkmark-circle' as const,
                      text: '✓ Paid this ' + (goal.frequency === 'weekly' ? 'week' : 'month'),
                      color: theme.primary,
                    };
                  case 'overdue':
                    return {
                      icon: 'alert-circle' as const,
                      text: '⚠️ Overdue',
                      color: theme.error,
                    };
                  case 'due':
                    return {
                      icon: 'time' as const,
                      text: '⏰ Due this ' + (goal.frequency === 'weekly' ? 'week' : 'month'),
                      color: '#FF9500',
                    };
                }
              };
              
              const statusConfig = getStatusConfig();
              
              return (
                <TouchableOpacity 
                  key={goal.id} 
                  style={[styles.ringCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  onPress={() => router.push('/(tabs)/goals')}
                  activeOpacity={0.7}
                >
                  <View style={styles.ringCardContent}>
                    <ProgressRing
                      progress={goalProgressPercent}
                      size={100}
                      strokeWidth={10}
                      color={theme.ringGreen}
                      label={goal.name}
                      value={`${Math.round(goalProgressPercent)}%`}
                    />
                    <View style={styles.ringDetails}>
                      <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>Progress</Text>
                      <Text style={[styles.ringDetailValue, { color: theme.text }]}>{formatCurrency(goal.currentAmount)}</Text>
                      <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>of {formatCurrency(goal.targetAmount)}</Text>
                      <Text style={[styles.ringDetailStatus, { color: statusConfig.color }]}>{statusConfig.text}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {goals.length > 2 && (
              <TouchableOpacity 
                style={[styles.viewAllButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                onPress={() => router.push('/(tabs)/goals')}
                activeOpacity={0.7}
              >
                <Text style={[styles.viewAllText, { color: theme.primary }]}>View All {goals.length} Goals</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.primary} />
              </TouchableOpacity>
            )}

            {/* Budget Remaining Section */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Remaining</Text>
            <View style={[styles.ringCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.ringCardContent}>
                <ProgressRing
                  progress={expenseProgress}
                  size={100}
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
                    { color: availableBudget < 0 ? theme.error : theme.text }
                  ]}>
                    {availableBudget >= 0 
                      ? formatCurrency(availableBudget)
                      : formatCurrency(Math.abs(availableBudget))
                    }
                  </Text>
                  <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>
                    Goals: {formatCurrency(monthlyGoalContributions)} • Spending: {formatCurrency(expenses)}
                  </Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.addTransactionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/transactions?openForm=true')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color={buttonTextColor} />
              <Text style={[styles.addTransactionText, { color: buttonTextColor }]}>Add Transaction</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* No Goals - Show Savings Card */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Savings</Text>
            <View style={[styles.ringCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.ringCardContent}>
            <ProgressRing
              progress={savingsProgress}
                  size={100}
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
        </View>

            {/* Budget Remaining Section */}
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Remaining</Text>
            <View style={[styles.ringCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <View style={styles.ringCardContent}>
                <ProgressRing
                  progress={expenseProgress}
                  size={100}
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
                    { color: availableBudget < 0 ? theme.error : theme.text }
                  ]}>
                    {availableBudget >= 0 
                      ? formatCurrency(availableBudget)
                      : formatCurrency(Math.abs(availableBudget))
                    }
            </Text>
                  <Text style={[styles.ringDetailLabel, { color: theme.textSecondary }]}>
                    Monthly spending: {formatCurrency(expenses)}
            </Text>
          </View>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.addTransactionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/(tabs)/transactions?openForm=true')}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle" size={20} color={buttonTextColor} />
              <Text style={[styles.addTransactionText, { color: buttonTextColor }]}>Add Transaction</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Statistics */}
        <View style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
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

              <View style={[styles.statsSelectedCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                <Text style={[styles.statsSelectedLabel, { color: theme.textSecondary }]}>Selected</Text>
                <Text style={[styles.statsSelectedValue, { color: theme.text }]}>
                  {(selectedSlice?.label ?? '—') + ': ' + (selectedSlice ? formatCurrency(selectedSlice.value) : '—')}
                    </Text>
                  </View>

              <View style={styles.statsRows}>
                {statsSlices.map((slice) => (
                  <TouchableOpacity
                    key={slice.id}
                    style={styles.statsRow}
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
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  settingsButton: {
    padding: 4,
    marginTop: -4,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  ringCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  ringCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ringDetails: {
    flex: 1,
    paddingLeft: 4,
  },
  ringDetailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  ringDetailValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  ringDetailStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  ringDetailSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addTransactionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsSubtitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsEmpty: {
    fontSize: 13,
    paddingVertical: 12,
  },
  statsChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statsSelectedCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statsSelectedLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsSelectedValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsRows: {
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  statsSwatch: {
    width: 10,
    height: 10,
    borderRadius: 10,
    marginRight: 10,
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

