import { Transaction, SavingsGoal, TimePeriod, ContributionStatus } from '@/types';
import { isDateInPeriod } from './dateHelpers';
import { RecurringExpense } from '@/types';
import { generateRecurringTransactionsForPeriod } from './recurring';

export const getTransactionsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  date: Date = new Date()
): Transaction[] => {
  return transactions.filter(transaction => 
    isDateInPeriod(transaction.date, period, date)
  );
};

export const getCombinedTransactionsByPeriod = (
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  period: TimePeriod,
  date: Date = new Date()
): Transaction[] => {
  const base = getTransactionsByPeriod(transactions, period, date);
  const generated = generateRecurringTransactionsForPeriod(recurringExpenses, period, date);
  return [...base, ...generated];
};

const safeAmount = (n: number): number => (Number.isFinite(n) && n >= 0 ? n : 0);

export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + safeAmount(t.amount), 0);
};

export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + safeAmount(t.amount), 0);
};

export const calculateNetSavings = (transactions: Transaction[]): number => {
  return calculateTotalIncome(transactions) - calculateTotalExpenses(transactions);
};

export const calculateSavingsByPeriod = (
  transactions: Transaction[],
  period: TimePeriod,
  date: Date = new Date()
): number => {
  const periodTransactions = getTransactionsByPeriod(transactions, period, date);
  return calculateNetSavings(periodTransactions);
};

export const getExpensesByCategory = (transactions: Transaction[]): Record<string, number> => {
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryTotals: Record<string, number> = {};
  
  expenses.forEach(transaction => {
    const category = transaction.category;
    categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
  });
  
  return categoryTotals;
};

export const calculateGoalProgress = (goal: SavingsGoal): number => {
  if (!goal.targetAmount || goal.targetAmount <= 0) return 0;
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  return Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 100) : 0;
};

export const calculateRecommendedContribution = (
  targetAmount: number,
  currentAmount: number,
  frequency: 'weekly' | 'monthly',
  startDate: string,
  endDate?: string
): number => {
  const now = new Date();
  const end = endDate ? new Date(endDate) : null;
  const remaining = targetAmount - currentAmount;
  
  if (remaining <= 0) return 0;
  if (!end || end <= now) return remaining; // If no end date or already past, return full amount
  
  let periodsRemaining = 0;
  const msRemaining = end.getTime() - now.getTime();
  
  switch (frequency) {
    case 'weekly':
      periodsRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24 * 7));
      break;
    case 'monthly':
      periodsRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24 * 30));
      break;
  }
  
  return periodsRemaining > 0 ? Math.ceil(remaining / periodsRemaining) : remaining;
};

// Check if a contribution has been made in the current period
export const getContributionStatus = (goal: SavingsGoal): ContributionStatus => {
  // If goal is already completed, return completed
  if (goal.currentAmount >= goal.targetAmount) {
    return 'completed';
  }

  // If no contribution has been made yet, it's overdue
  if (!goal.lastContributionDate) {
    return 'overdue';
  }

  const now = new Date();
  const lastContribution = new Date(goal.lastContributionDate);
  
  // Check if the last contribution was made in the current period
  if (goal.frequency === 'weekly') {
    // Get the start of the current week (Monday)
    const currentWeekStart = new Date(now);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // If last contribution was this week, mark as completed
    if (lastContribution >= currentWeekStart) {
      return 'completed';
    }
    
    // Check if we're past the current week
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    if (now >= nextWeekStart) {
      return 'overdue';
    }
    
    return 'due';
  } else {
    // Monthly frequency
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastContributionMonth = lastContribution.getMonth();
    const lastContributionYear = lastContribution.getFullYear();
    
    // If last contribution was this month, mark as completed
    if (currentYear === lastContributionYear && currentMonth === lastContributionMonth) {
      return 'completed';
    }
    
    // If we're past the month of last contribution, it's overdue
    if (currentYear > lastContributionYear || 
        (currentYear === lastContributionYear && currentMonth > lastContributionMonth)) {
      return 'overdue';
    }
    
    return 'due';
  }
};
