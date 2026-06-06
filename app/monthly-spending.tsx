import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addMonths, format, isSameMonth, parseISO, startOfMonth } from 'date-fns';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { GlassCard } from '@/components/ui/GlassCard';
import { PieChart, PieSlice } from '@/components/PieChart';
import { Spacing, Radius } from '@/constants/design';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import {
  buildMonthlyStatsSlices,
  computeMonthlyBudgetMetrics,
  getNavigableMonthStarts,
} from '@/utils/monthlyStatsSlices';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
} from '@/utils/calculations';
import {
  getCombinedTransactionsForPayContext,
  resolvePayPeriodContext,
} from '@/utils/payPeriodContext';

export default function MonthlySpendingScreen() {
  const router = useRouter();
  const { month: monthParam } = useLocalSearchParams<{ month?: string }>();
  const { transactions, recurringExpenses, goals, customCategories } = useFinance();
  const { theme } = useTheme();

  const monthStarts = useMemo(
    () => getNavigableMonthStarts(transactions, recurringExpenses, 24),
    [transactions, recurringExpenses]
  );

  const [selectedMonth, setSelectedMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);

  useEffect(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const d = parseISO(`${monthParam}-01`);
      if (!Number.isNaN(d.getTime())) {
        setSelectedMonth(startOfMonth(d));
      }
    }
  }, [monthParam]);

  useEffect(() => {
    if (monthStarts.length === 0) return;
    const inList = monthStarts.some((m) => isSameMonth(m, selectedMonth));
    if (!inList) {
      setSelectedMonth(monthStarts[monthStarts.length - 1]);
    }
  }, [monthStarts, selectedMonth]);

  const monthIndex = useMemo(
    () => monthStarts.findIndex((m) => isSameMonth(m, selectedMonth)),
    [monthStarts, selectedMonth]
  );

  const payPeriodContext = useMemo(
    () => resolvePayPeriodContext(recurringExpenses, selectedMonth),
    [recurringExpenses, selectedMonth]
  );

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
        selectedMonth,
        payPeriodContext.payDay
      ),
    [
      transactions,
      recurringExpenses,
      goals,
      customCategories,
      selectedMonth,
      payPeriodContext.payDay,
      theme.primary,
      theme.accent,
      theme.secondary,
      theme.ringOrange,
    ]
  );

  const sliceTotal = useMemo(
    () => statsSlices.reduce((s, x) => s + Math.max(x.value, 0), 0),
    [statsSlices]
  );

  useEffect(() => {
    if (!selectedSliceId && statsSlices.length > 0) {
      setSelectedSliceId(statsSlices[0].id);
      return;
    }
    if (selectedSliceId && statsSlices.length > 0 && !statsSlices.some((s) => s.id === selectedSliceId)) {
      setSelectedSliceId(statsSlices[0].id);
    }
  }, [selectedSliceId, statsSlices]);

  const selectedSlice = statsSlices.find((s) => s.id === selectedSliceId) ?? null;

  const budget = useMemo(
    () =>
      computeMonthlyBudgetMetrics(
        transactions,
        recurringExpenses,
        goals,
        selectedMonth,
        payPeriodContext.payDay
      ),
    [transactions, recurringExpenses, goals, selectedMonth, payPeriodContext.payDay]
  );

  const priorMonthRef = useMemo(() => startOfMonth(addMonths(selectedMonth, -1)), [selectedMonth]);
  const priorPayContext = useMemo(
    () => resolvePayPeriodContext(recurringExpenses, priorMonthRef),
    [recurringExpenses, priorMonthRef]
  );
  const priorMetrics = useMemo(
    () =>
      computeMonthlyBudgetMetrics(
        transactions,
        recurringExpenses,
        goals,
        priorMonthRef,
        priorPayContext.payDay
      ),
    [transactions, recurringExpenses, goals, priorMonthRef, priorPayContext.payDay]
  );

  const spendingTrendPct =
    priorMetrics.expenses > 0
      ? ((budget.expenses - priorMetrics.expenses) / priorMetrics.expenses) * 100
      : null;

  const recentRows = useMemo(() => {
    const reversed = [...monthStarts].reverse().slice(0, 12);
    return reversed.map((m) => {
      const ctx = resolvePayPeriodContext(recurringExpenses, m);
      const tx = getCombinedTransactionsForPayContext(transactions, recurringExpenses, ctx);
      return {
        key: format(m, 'yyyy-MM'),
        label: format(m, 'MMM yyyy'),
        spent: calculateTotalExpenses(tx),
        income: calculateTotalIncome(tx),
      };
    });
  }, [monthStarts, transactions, recurringExpenses]);

  const periodRangeLabel =
    payPeriodContext.payDay !== undefined
      ? `${formatDateShort(payPeriodContext.periodStart)} – ${formatDateShort(payPeriodContext.periodEnd)}`
      : null;

  const goPrev = () => {
    if (monthIndex <= 0) return;
    setSelectedMonth(monthStarts[monthIndex - 1]);
  };

  const goNext = () => {
    if (monthIndex < 0 || monthIndex >= monthStarts.length - 1) return;
    setSelectedMonth(monthStarts[monthIndex + 1]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12} accessibilityRole="button">
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Monthly spending</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Spacing['4xl'] }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.monthNavWrap}>
          <View style={styles.monthCluster}>
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                onPress={goPrev}
                disabled={monthIndex <= 0}
                style={[styles.monthNavBtn, monthIndex <= 0 && styles.monthNavDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Icon name="chevron-back" size={22} color={monthIndex <= 0 ? theme.textTertiary : theme.text} />
              </TouchableOpacity>
              <Text style={[styles.monthLabel, { color: theme.text }]}>{format(selectedMonth, 'MMMM yyyy')}</Text>
              <TouchableOpacity
                onPress={goNext}
                disabled={monthIndex < 0 || monthIndex >= monthStarts.length - 1}
                style={[
                  styles.monthNavBtn,
                  (monthIndex < 0 || monthIndex >= monthStarts.length - 1) && styles.monthNavDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Icon
                  name="chevron-forward"
                  size={22}
                  color={
                    monthIndex < 0 || monthIndex >= monthStarts.length - 1 ? theme.textTertiary : theme.text
                  }
                />
              </TouchableOpacity>
            </View>
            {periodRangeLabel ? (
              <Text style={[styles.periodRangeLabel, { color: theme.textSecondary }]}>
                {periodRangeLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <GlassCard style={styles.card} intensity="subtle">
          <Text style={[styles.cardTitle, { color: theme.text }]}>Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCell}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total spent</Text>
              <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(budget.expenses)}</Text>
            </View>
            <View style={[styles.summaryCell, styles.summaryCellIncome]}>
              <Text style={[styles.summaryLabel, styles.summaryTextRight, { color: theme.textSecondary }]}>
                Total income
              </Text>
              <Text style={[styles.summaryValue, styles.summaryTextRight, { color: theme.text }]}>
                {formatCurrency(budget.income)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryRowFull, { borderTopColor: theme.cardBorder }]}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Budget remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: budget.availableBudget >= 0 ? theme.primary : theme.error },
              ]}
            >
              {budget.availableBudget >= 0 ? '+' : ''}
              {formatCurrency(budget.availableBudget)}
            </Text>
          </View>
          {spendingTrendPct !== null && (
            <Text style={[styles.trendLine, { color: theme.textSecondary }]}>
              vs prior {payPeriodContext.payDay !== undefined ? 'period' : 'month'}:{' '}
              {spendingTrendPct >= 0 ? '+' : ''}
              {spendingTrendPct.toFixed(1)}% spending
            </Text>
          )}
        </GlassCard>

        <GlassCard style={styles.card} intensity="subtle">
          <Text style={[styles.cardTitle, { color: theme.text }]}>By category</Text>
          {statsSlices.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>
              No spending (or goal contributions) this month.
            </Text>
          ) : (
            <>
              <View style={styles.chartWrap}>
                <PieChart
                  size={220}
                  slices={statsSlices}
                  selectedId={selectedSliceId}
                  onPressSlice={(slice) => setSelectedSliceId(slice.id)}
                />
              </View>
              <View
                style={[
                  styles.selectedBox,
                  { backgroundColor: theme.backgroundSecondary + '80', borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.selectedLbl, { color: theme.textSecondary }]}>Selected</Text>
                <Text style={[styles.selectedVal, { color: theme.text }]}>
                  {(selectedSlice?.label ?? '—') + ': ' + (selectedSlice ? formatCurrency(selectedSlice.value) : '—')}
                </Text>
              </View>
              {statsSlices.map((slice) => {
                const pct = sliceTotal > 0 ? Math.min(100, (slice.value / sliceTotal) * 100) : 0;
                return (
                  <TouchableOpacity
                    key={slice.id}
                    style={[
                      styles.catRow,
                      selectedSliceId === slice.id && {
                        backgroundColor: theme.backgroundSecondary + '60',
                        borderRadius: Radius.sm,
                      },
                    ]}
                    onPress={() => setSelectedSliceId(slice.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.catRowTop}>
                      <View style={styles.catRowLeft}>
                        <View style={[styles.swatch, { backgroundColor: slice.color }]} />
                        <Text style={[styles.catName, { color: theme.text }]} numberOfLines={2}>
                          {slice.label}
                        </Text>
                      </View>
                      <Text style={[styles.catAmt, { color: theme.text }]}>{formatCurrency(slice.value)}</Text>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: theme.backgroundTertiary }]}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: slice.color }]} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </GlassCard>

        <Text style={[styles.sectionHeading, { color: theme.text }]}>Recent months</Text>
        <GlassCard style={styles.card} intensity="subtle">
          {recentRows.map((row, idx) => (
            <TouchableOpacity
              key={row.key}
              style={[
                styles.recentRow,
                { borderBottomColor: theme.cardBorder },
                idx === recentRows.length - 1 && styles.recentRowLast,
              ]}
              onPress={() => setSelectedMonth(startOfMonth(parseISO(`${row.key}-01`)))}
              activeOpacity={0.7}
            >
              <Text style={[styles.recentLabel, { color: theme.text }]}>{row.label}</Text>
              <View style={styles.recentRight}>
                <Text style={[styles.recentMeta, { color: theme.textSecondary }]}>
                  Spent {formatCurrency(row.spent)}
                </Text>
                <Text style={[styles.recentMeta, { color: theme.textTertiary }]}>
                  Income {formatCurrency(row.income)}
                </Text>
              </View>
              <Icon name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </GlassCard>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  monthNavWrap: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  monthCluster: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    maxWidth: '100%',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 4,
  },
  monthNavBtn: {
    padding: Spacing.sm,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavDisabled: {
    opacity: 0.4,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    flexShrink: 1,
    textAlign: 'center',
    paddingHorizontal: Spacing.xs,
    minWidth: 120,
    maxWidth: 280,
  },
  periodRangeLabel: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    padding: Spacing.xl,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryCell: {
    flex: 1,
  },
  summaryCellIncome: {
    alignItems: 'flex-end',
  },
  summaryTextRight: {
    textAlign: 'right',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryRowFull: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  trendLine: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  chartWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  selectedBox: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  selectedLbl: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  selectedVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
    fontSize: 14,
  },
  catRow: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  catAmt: {
    fontSize: 14,
    fontWeight: '700',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: -Spacing.xs,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  recentRowLast: {
    borderBottomWidth: 0,
  },
  recentLabel: {
    fontSize: 15,
    fontWeight: '600',
    width: 100,
  },
  recentRight: {
    flex: 1,
  },
  recentMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
});
