import { SavingsGoal, Transaction, GoalReserveStatus, ContributionStatus } from '@/types';
import { formatCurrency } from '@/utils/dateHelpers';
import { getContributionStatus } from '@/utils/calculations';

export type GoalStatusSeverity = 'success' | 'error' | 'warning' | 'neutral';

export interface GoalStatusBadge {
  text: string;
  severity: GoalStatusSeverity;
}

const NEARING_RATIO = 0.8;

export function sumLinkedAccountExpensesSince(
  transactions: Transaction[],
  accountId: string,
  startDate: string
): number {
  return transactions
    .filter(
      t =>
        t.type === 'expense' &&
        t.accountId === accountId &&
        t.date >= startDate
    )
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Compares expenses on the linked account since reserveWatchStartDate
 * against reserveAmount. Multiple goals on one account each use their own window.
 */
export function evaluateGoalReserve(
  goal: SavingsGoal,
  transactions: Transaction[]
): GoalReserveStatus {
  if (!goal.linkedAccountId || goal.reserveAmount == null || goal.reserveAmount <= 0) {
    return 'ok';
  }
  if (!goal.reserveWatchStartDate) {
    return 'ok';
  }

  const spent = sumLinkedAccountExpensesSince(
    transactions,
    goal.linkedAccountId,
    goal.reserveWatchStartDate
  );
  const reserve = goal.reserveAmount;

  if (spent >= reserve) {
    return 'negated';
  }
  if (spent >= reserve * NEARING_RATIO) {
    return 'nearing';
  }
  return 'ok';
}

export function getReserveNotificationContent(
  goal: SavingsGoal,
  status: Exclude<GoalReserveStatus, 'ok'>
): { title: string; body: string } {
  const reserve = formatCurrency(goal.reserveAmount ?? 0);
  if (status === 'nearing') {
    return {
      title: 'Goal savings at risk',
      body: `Spending on your linked account is nearing the ${reserve} you set aside for "${goal.name}".`,
    };
  }
  return {
    title: 'Goal savings negated',
    body: `Expenses on your linked account have exceeded the ${reserve} earmarked for "${goal.name}".`,
  };
}

export function todayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Badge copy for goal cards on Dashboard and Goals tab.
 * Linked-account reserve negated is shown as Overdue (earmarked savings spent down).
 */
export function getGoalStatusBadge(
  goal: SavingsGoal,
  transactions: Transaction[],
  payDay?: number
): GoalStatusBadge {
  const remaining = goal.targetAmount - goal.currentAmount;
  if (remaining <= 0) {
    return { text: 'Goal Reached', severity: 'success' };
  }

  if (goal.linkedAccountId && (goal.reserveAmount ?? 0) > 0) {
    const reserveStatus = evaluateGoalReserve(goal, transactions);
    if (reserveStatus === 'negated') {
      return { text: 'Savings spent', severity: 'error' };
    }
    if (reserveStatus === 'nearing') {
      return { text: 'At risk', severity: 'warning' };
    }
  }

  const contributionStatus: ContributionStatus = getContributionStatus(goal, payDay);
  const period =
    goal.frequency === 'weekly' ? 'week' : payDay !== undefined ? 'period' : 'month';
  switch (contributionStatus) {
    case 'completed':
      return { text: `Paid this ${period}`, severity: 'success' };
    case 'overdue':
      return { text: 'Overdue', severity: 'error' };
    case 'due':
    default:
      return { text: `Due this ${period}`, severity: 'warning' };
  }
}

export function goalStatusColor(
  severity: GoalStatusSeverity,
  theme: { primary: string; error: string; warningOrange: string; textSecondary: string }
): string {
  switch (severity) {
    case 'success':
      return theme.primary;
    case 'error':
      return theme.error;
    case 'warning':
      return theme.warningOrange;
    default:
      return theme.textSecondary;
  }
}

/** Build reserve fields when linking an account at goal creation */
export function buildInitialReserveFields(
  linkedAccountId: string,
  reserveAmount: number,
  startDate: string
): Pick<SavingsGoal, 'linkedAccountId' | 'reserveAmount' | 'reserveWatchStartDate' | 'lastReserveStatus'> {
  return {
    linkedAccountId,
    reserveAmount,
    reserveWatchStartDate: startDate,
    lastReserveStatus: 'ok',
  };
}

/** Reset watch window after a manual contribution */
export function buildContributionReserveFields(
  amount: number,
  watchStartDate: string
): Pick<SavingsGoal, 'reserveAmount' | 'reserveWatchStartDate' | 'lastReserveStatus' | 'lastReserveNotifiedAt'> {
  return {
    reserveAmount: amount,
    reserveWatchStartDate: watchStartDate,
    lastReserveStatus: 'ok',
    lastReserveNotifiedAt: undefined,
  };
}
