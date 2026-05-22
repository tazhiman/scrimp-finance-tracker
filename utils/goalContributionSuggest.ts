import {
  differenceInCalendarDays,
  differenceInCalendarMonths,
  startOfDay,
  isAfter,
  isSameDay,
} from 'date-fns';
import { ContributionFrequency } from '@/types';

/**
 * Counts approximate contribution intervals from `fromDate` through `endDate`
 * used to derive an equal-payment suggestion (target ÷ intervals).
 */
export function countContributionIntervals(
  endDate: Date,
  frequency: ContributionFrequency,
  fromDate: Date = new Date()
): number {
  const start = startOfDay(fromDate);
  const end = startOfDay(endDate);

  if (isSameDay(end, start)) return 1;
  if (!isAfter(end, start)) return 0;

  if (frequency === 'weekly') {
    const days = differenceInCalendarDays(end, start);
    return Math.max(1, Math.ceil(days / 7));
  }

  return Math.max(1, differenceInCalendarMonths(end, start) + 1);
}

export function suggestedContributionPerPeriod(
  targetAmount: number,
  endDate: Date,
  frequency: ContributionFrequency,
  fromDate?: Date
): number | null {
  if (!(targetAmount > 0)) return null;
  const n = countContributionIntervals(endDate, frequency, fromDate);
  if (n <= 0) return null;
  return targetAmount / n;
}
