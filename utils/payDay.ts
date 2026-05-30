import { format, parseISO } from 'date-fns';

/** Clamp pay day to valid calendar range (1–31). */
export function clampPayDay(day: number): number {
  return Math.min(Math.max(Math.round(day), 1), 31);
}

/** Day of month for a yyyy-mm-dd start date anchor. */
export function startDateToPayDay(startDate: string): number {
  try {
    const parsed = parseISO(startDate);
    if (Number.isNaN(parsed.getTime())) return 1;
    return parsed.getDate();
  } catch {
    return 1;
  }
}

/**
 * Build the next recurring start date from a pay day of month (1–31).
 * Uses the current month if the day has not passed yet, otherwise next month.
 */
export function payDayToStartDate(payDay: number): string {
  const clamped = clampPayDay(payDay);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let year = now.getFullYear();
  let month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let candidate = new Date(year, month, Math.min(clamped, daysInMonth));

  if (candidate < today) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    const daysInNext = new Date(year, month + 1, 0).getDate();
    candidate = new Date(year, month, Math.min(clamped, daysInNext));
  }

  return format(candidate, 'yyyy-MM-dd');
}

export function ordinalSuffix(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function payDayLabel(payDay: number, frequency: 'weekly' | 'monthly' = 'monthly'): string {
  const day = clampPayDay(payDay);
  if (frequency === 'weekly') {
    return `Every week starting on the ${ordinalSuffix(day)}`;
  }
  return `Every month on the ${ordinalSuffix(day)}`;
}
