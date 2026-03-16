import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { TimePeriod } from '@/types';

export const getPeriodDates = (period: TimePeriod, date: Date = new Date()) => {
  switch (period) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    default:
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
  }
};

export const isDateInPeriod = (date: string, period: TimePeriod, referenceDate: Date = new Date()): boolean => {
  const dateObj = parseISO(date);
  const { start, end } = getPeriodDates(period, referenceDate);
  return isWithinInterval(dateObj, { start, end });
};

const safeNum = (num: number): number => {
  if (!Number.isFinite(num)) return 0;
  return num;
};

/**
 * Safely formats a number with toFixed, falling back for values where
 * Number.prototype.toFixed returns scientific notation (>= 1e21).
 */
const safeToFixed = (num: number, digits: number): string => {
  const s = num.toFixed(digits);
  if (!s.includes('e')) return s;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: false,
  }).format(num);
};

/**
 * Abbreviates large numbers with K, M, B, T suffixes.
 * Guards against NaN, Infinity, and numbers too large for toFixed.
 */
export const abbreviateNumber = (num: number, decimals: number = 1): string => {
  num = safeNum(num);
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000_000_000) {
    const divided = num / 1_000_000_000_000;
    if (Math.abs(divided) >= 1_000_000_000_000) return num < 0 ? '-999T+' : '999T+';
    return safeToFixed(divided, decimals) + 'T';
  }
  if (absNum >= 1_000_000_000) {
    return safeToFixed(num / 1_000_000_000, decimals) + 'B';
  }
  if (absNum >= 1_000_000) {
    return safeToFixed(num / 1_000_000, decimals) + 'M';
  }
  if (absNum >= 10_000) {
    return safeToFixed(num / 1_000, decimals) + 'K';
  }
  
  return num.toFixed(2);
};

/**
 * Formats currency with automatic abbreviation for large numbers.
 * Guards against NaN, Infinity, and extreme values.
 */
export const formatCurrency = (amount: number, forceAbbreviate: boolean = false): string => {
  amount = safeNum(amount);
  const absAmount = Math.abs(amount);
  
  if (absAmount >= 10_000) {
    const sign = amount < 0 ? '-' : '';
    return `${sign}$${abbreviateNumber(Math.abs(amount), 1)}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
};

export const formatDateShort = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

