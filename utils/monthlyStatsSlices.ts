import { addMonths, format, isAfter, isBefore, parseISO, startOfMonth, subMonths } from 'date-fns';
import { Category, RecurringExpense, SavingsGoal, Transaction } from '@/types';
import {
  getCombinedTransactionsByPeriod,
  calculateTotalIncome,
  calculateTotalExpenses,
  getExpensesByCategory,
} from '@/utils/calculations';
import { getCategoryById } from '@/constants/categories';

/** Use planned contribution by default; if user contributed more this month (excluding initial opening balance), use actual. */
export function effectiveGoalContribution(goal: SavingsGoal, referenceDate: Date): number {
  const monthStr = format(referenceDate, 'yyyy-MM');
  const actual = (goal.contributions ?? [])
    .filter(c => !c.isInitial && c.date.startsWith(monthStr))
    .reduce((sum, c) => sum + c.amount, 0);
  return Math.max(goal.contributionAmount, actual);
}

export type MonthlyStatsThemeColors = {
  primary: string;
  accent: string;
  secondary: string;
  ringOrange: string;
};

/** Same shape as PieChart `PieSlice` (kept in utils to avoid importing components). */
export type MonthlyStatSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export function buildMonthlyStatsSlices(
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  goals: SavingsGoal[],
  customCategories: Category[],
  themeColors: MonthlyStatsThemeColors,
  referenceDate: Date = new Date()
): MonthlyStatSlice[] {
  const monthlyTransactions = getCombinedTransactionsByPeriod(
    transactions,
    recurringExpenses,
    'month',
    referenceDate
  );
  const byCategory = getExpensesByCategory(monthlyTransactions);
  const slices: MonthlyStatSlice[] = Object.entries(byCategory)
    .filter(([, amount]) => amount > 0)
    .map(([categoryId, amount]) => {
      const category = getCategoryById(categoryId, customCategories);
      return {
        id: categoryId,
        label: category?.name ?? 'Other',
        value: amount,
        color: category?.color ?? themeColors.accent,
      };
    });

  const goalColors = [
    themeColors.primary,
    themeColors.accent,
    themeColors.secondary,
    themeColors.ringOrange,
  ];
  goals.forEach((goal, idx) => {
    const effective = effectiveGoalContribution(goal, referenceDate);
    if (effective <= 0) return;
    slices.push({
      id: `goal_contrib_${goal.id}`,
      label: `${goal.name} Contribution`,
      value: effective,
      color: goalColors[idx % goalColors.length],
    });
  });

  slices.sort((a, b) => b.value - a.value);
  return slices;
}

const minDate = (a: Date, b: Date) => (isBefore(a, b) ? a : b);
const maxDate = (a: Date, b: Date) => (isAfter(a, b) ? a : b);

/** Month starts from earliest data (capped) through current month, oldest first. */
export function getNavigableMonthStarts(
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  maxMonthsBack: number = 24
): Date[] {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  let earliest = currentMonthStart;

  for (const t of transactions) {
    try {
      const d = parseISO(t.date);
      if (!Number.isNaN(d.getTime())) {
        earliest = minDate(earliest, startOfMonth(d));
      }
    } catch {
      /* skip */
    }
  }
  for (const r of recurringExpenses) {
    try {
      const d = parseISO(r.startDate);
      if (!Number.isNaN(d.getTime())) {
        earliest = minDate(earliest, startOfMonth(d));
      }
    } catch {
      /* skip */
    }
  }

  const capStart = startOfMonth(subMonths(now, maxMonthsBack - 1));
  earliest = maxDate(earliest, capStart);

  const months: Date[] = [];
  let cursor = earliest;
  while (!isAfter(cursor, currentMonthStart)) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export type MonthlyBudgetMetrics = {
  income: number;
  expenses: number;
  monthlyGoalContributions: number;
  availableBudget: number;
  totalCommitted: number;
  expenseProgress: number;
};

export function computeMonthlyBudgetMetrics(
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  goals: SavingsGoal[],
  referenceDate: Date = new Date()
): MonthlyBudgetMetrics {
  const monthlyTransactions = getCombinedTransactionsByPeriod(
    transactions,
    recurringExpenses,
    'month',
    referenceDate
  );
  const income = calculateTotalIncome(monthlyTransactions);
  const expenses = calculateTotalExpenses(monthlyTransactions);
  const monthlyGoalContributions = goals.reduce(
    (sum, g) => sum + effectiveGoalContribution(g, referenceDate),
    0
  );
  const availableBudget = income - monthlyGoalContributions - expenses;
  const totalCommitted = monthlyGoalContributions + expenses;
  const expenseProgress = income > 0 ? Math.min((totalCommitted / income) * 100, 100) : 0;

  return {
    income,
    expenses,
    monthlyGoalContributions,
    availableBudget,
    totalCommitted,
    expenseProgress,
  };
}
