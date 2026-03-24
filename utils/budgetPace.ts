import { differenceInCalendarDays, endOfMonth, getDaysInMonth, startOfDay } from 'date-fns';
import { formatCurrency } from '@/utils/dateHelpers';

/** Pace vs spreading monthly income evenly; tunable. */
const PACE_COMFORT = 0.35;
const PACE_TIGHT = 0.1;

export interface BudgetRingTheme {
  error: string;
  warningOrange: string;
  ringGreen: string;
  ringOrange: string;
}

export function getDaysLeftInMonth(date: Date = new Date()): number {
  const end = endOfMonth(date);
  const start = startOfDay(date);
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

export function getBudgetPaceHeadline(
  availableBudget: number,
  income: number,
  daysLeft: number
): string {
  const daily = availableBudget / daysLeft;
  const dailyStr = formatCurrency(daily);
  const dayWord = daysLeft === 1 ? 'day' : 'days';

  if (availableBudget < 0) {
    return 'Over budget for the rest of the month';
  }

  if (income === 0) {
    return `No income logged this month — ${dailyStr} / day for ${daysLeft} more ${dayWord}`;
  }

  return `About ${dailyStr} / day for ${daysLeft} more ${dayWord}`;
}

export function getBudgetRingColor(params: {
  availableBudget: number;
  income: number;
  dailyHeadroom: number;
  referenceDate: Date;
  theme: BudgetRingTheme;
}): string {
  const { availableBudget, income, dailyHeadroom, referenceDate, theme } = params;

  if (availableBudget < 0) {
    return theme.error;
  }

  if (income === 0) {
    return theme.warningOrange;
  }

  const daysInMonth = getDaysInMonth(referenceDate);
  const expectedEvenDaily = income / daysInMonth;
  if (expectedEvenDaily <= 0) {
    return theme.warningOrange;
  }

  const paceRatio = dailyHeadroom / expectedEvenDaily;

  if (paceRatio >= PACE_COMFORT) {
    return theme.ringGreen;
  }
  if (paceRatio >= PACE_TIGHT) {
    return theme.warningOrange;
  }
  return theme.ringOrange;
}
