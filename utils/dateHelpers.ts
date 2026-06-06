import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  parseISO,
  addMonths,
  subMonths,
  subDays,
} from 'date-fns';
import { TimePeriod, Transaction } from '@/types';
import { clampPayDay } from '@/utils/payDay';

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

/** Pay day of month (1–31) anchored to the salary credit date. */
function payDayInMonth(year: number, month: number, payDay: number): Date {
  const clamped = clampPayDay(payDay);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return startOfDay(new Date(year, month, Math.min(clamped, daysInMonth)));
}

/**
 * Salary pay period: payDay of month through day before next payDay.
 * e.g. pay day 15 → Jun 15 00:00 through Jul 14 23:59:59.
 */
export function getPayPeriodDates(payDay: number, referenceDate: Date = new Date()) {
  const ref = startOfDay(referenceDate);
  const thisMonthPay = payDayInMonth(ref.getFullYear(), ref.getMonth(), payDay);

  if (ref >= thisMonthPay) {
    const nextMonthPay = payDayInMonth(
      addMonths(thisMonthPay, 1).getFullYear(),
      addMonths(thisMonthPay, 1).getMonth(),
      payDay
    );
    return {
      start: thisMonthPay,
      end: endOfDay(subDays(nextMonthPay, 1)),
    };
  }

  const lastMonthPay = payDayInMonth(
    subMonths(thisMonthPay, 1).getFullYear(),
    subMonths(thisMonthPay, 1).getMonth(),
    payDay
  );
  return {
    start: lastMonthPay,
    end: endOfDay(subDays(thisMonthPay, 1)),
  };
}

export function isDateInRange(date: string, start: Date, end: Date): boolean {
  const dateObj = parseISO(date.length <= 10 ? `${date}T12:00:00` : date);
  return isWithinInterval(dateObj, { start, end });
}

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

/** Combine stored date + optional time + createdAt fallback for editors. */
export function buildTransactionDateTime(
  tx: Pick<Transaction, 'date' | 'time' | 'createdAt'>
): Date {
  const raw = tx.date.length <= 10 ? `${tx.date}T12:00:00` : tx.date;
  let d = parseISO(raw);
  if (Number.isNaN(d.getTime())) d = new Date();

  const t = tx.time?.trim();
  if (t && /^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10));
    if (Number.isFinite(h) && Number.isFinite(m)) {
      d.setHours(h, m, 0, 0);
    }
  } else if (tx.createdAt) {
    const c = new Date(tx.createdAt);
    if (!Number.isNaN(c.getTime())) {
      d.setHours(c.getHours(), c.getMinutes(), c.getSeconds(), 0);
    }
  }
  return d;
}

/** e.g. Mar 22, 2026 — from yyyy-mm-dd or ISO date string. */
export function formatDetailTransactionDate(dateStr: string): string {
  const base = dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr;
  const d = parseISO(base);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/** Returns the number of whole days elapsed since the given ISO date-time string. */
export function daysSince(isoString: string): number {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable string for how long ago an ISO date-time was.
 * Examples: "Just now", "2h ago", "3d ago", "14d ago".
 */
export function formatRelativeTime(isoString: string | undefined): string {
  if (!isoString) return 'Never confirmed';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/** 12h locale time from stored HH:mm or createdAt fallback. */
export function formatDetailTransactionTime(timeHm?: string, createdAtFallback?: string): string {
  const t = timeHm?.trim();
  if (t && /^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10));
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
  }
  if (createdAtFallback) {
    const c = new Date(createdAtFallback);
    if (!Number.isNaN(c.getTime())) {
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(c);
    }
  }
  return '—';
}

