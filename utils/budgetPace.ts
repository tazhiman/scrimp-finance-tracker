import { differenceInCalendarDays, endOfMonth, startOfDay } from 'date-fns';
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

/** Days remaining in a period (inclusive of today). */
export function getDaysLeftInPeriod(periodEnd: Date, referenceDate: Date = new Date()): number {
  const end = startOfDay(periodEnd);
  const start = startOfDay(referenceDate);
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

/** @deprecated Use getDaysLeftInPeriod with an explicit period end. */
export function getDaysLeftInMonth(date: Date = new Date()): number {
  return getDaysLeftInPeriod(endOfMonth(date), date);
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
  periodStart: Date;
  periodEnd: Date;
  theme: BudgetRingTheme;
}): string {
  const { availableBudget, income, dailyHeadroom, periodStart, periodEnd, theme } = params;

  if (availableBudget < 0) {
    return theme.error;
  }

  if (income === 0) {
    return theme.warningOrange;
  }

  const daysInPeriod = Math.max(
    1,
    differenceInCalendarDays(startOfDay(periodEnd), startOfDay(periodStart)) + 1
  );
  const expectedEvenDaily = income / daysInPeriod;
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
