import { RecurringExpense, TimePeriod, Transaction } from '@/types';
import { getPeriodDates } from './dateHelpers';
import {
  addMonths,
  addWeeks,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  format,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';

const toYMD = (d: Date) => format(d, 'yyyy-MM-dd');

const maxDate = (a: Date, b: Date) => (isAfter(a, b) ? a : b);
const minDate = (a: Date, b: Date) => (isBefore(a, b) ? a : b);

export const isGeneratedRecurringTransactionId = (id: string) => id.startsWith('recurring_');

export const getRecurringIdFromGeneratedTransactionId = (id: string) => {
  if (!isGeneratedRecurringTransactionId(id)) return null;
  // recurring_${recurringId}_${yyyy-mm-dd}
  const rest = id.slice('recurring_'.length);
  const idx = rest.lastIndexOf('_');
  if (idx <= 0) return null;
  return rest.slice(0, idx);
};

export const generateRecurringTransactionsForPeriod = (
  recurring: RecurringExpense[],
  period: TimePeriod,
  referenceDate: Date = new Date()
): Transaction[] => {
  const { start: periodStart, end: periodEnd } = getPeriodDates(period, referenceDate);

  const generated: Transaction[] = [];

  recurring.forEach((rule) => {
    const start = parseISO(rule.startDate);
    if (isAfter(start, periodEnd)) return;

    const ruleEnd = rule.endDate ? parseISO(rule.endDate) : null;
    const effectiveEnd = ruleEnd ? minDate(periodEnd, ruleEnd) : periodEnd;
    const effectiveStart = maxDate(periodStart, start);

    // Fast-forward to the first occurrence on/after periodStart
    let cursor = start;
    let occurrenceIndex = 0;

    if (rule.frequency === 'monthly') {
      const monthsJump = Math.max(0, differenceInCalendarMonths(effectiveStart, start));
      cursor = addMonths(start, monthsJump);
      occurrenceIndex = monthsJump;
      // If we jumped to a date still before the effectiveStart, move one more period.
      if (isBefore(cursor, effectiveStart)) {
        cursor = addMonths(cursor, 1);
        occurrenceIndex += 1;
      }
    } else {
      const weeksJump = Math.max(0, differenceInCalendarWeeks(effectiveStart, start));
      cursor = addWeeks(start, weeksJump);
      occurrenceIndex = weeksJump;
      if (isBefore(cursor, effectiveStart)) {
        cursor = addWeeks(cursor, 1);
        occurrenceIndex += 1;
      }
    }

    // Generate occurrences within [periodStart, effectiveEnd]
    while (!isAfter(cursor, effectiveEnd)) {
      const dateStr = toYMD(cursor);

      if (rule.kind === 'installment' && rule.totalInstallments) {
        if (occurrenceIndex >= rule.totalInstallments) break;
      }

      const installmentLabel =
        rule.kind === 'installment' && rule.totalInstallments
          ? ` (Installment ${occurrenceIndex + 1}/${rule.totalInstallments})`
          : rule.kind === 'installment'
            ? ` (Installment ${occurrenceIndex + 1})`
            : ' (Recurring)';

      generated.push({
        id: `recurring_${rule.id}_${dateStr}`,
        type: 'expense',
        amount: rule.amount,
        category: rule.category,
        date: dateStr,
        createdAt: rule.createdAt,
        description: `${rule.title}${installmentLabel}`,
      });

      if (rule.frequency === 'monthly') {
        cursor = addMonths(cursor, 1);
      } else {
        cursor = addWeeks(cursor, 1);
      }
      occurrenceIndex += 1;
    }
  });

  return generated;
};

