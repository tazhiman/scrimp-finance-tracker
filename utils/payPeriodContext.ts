import { endOfMonth, startOfMonth } from 'date-fns';
import { RecurringExpense, Transaction } from '@/types';
import { getPayPeriodDates } from '@/utils/dateHelpers';
import { startDateToPayDay } from '@/utils/payDay';
import {
  getCombinedTransactionsByDateRange,
  getCombinedTransactionsByPeriod,
} from '@/utils/calculations';

export type PayPeriodContext = {
  payDay: number | undefined;
  periodStart: Date;
  periodEnd: Date;
};

/** Resolve pay-period bounds from salary recurring rule, or calendar month fallback. */
export function resolvePayPeriodContext(
  recurringExpenses: RecurringExpense[],
  referenceDate: Date = new Date()
): PayPeriodContext {
  const salaryRule = recurringExpenses.find(
    r => r.category === 'salary' && (r.transactionType ?? 'expense') === 'income'
  );
  const payDay = salaryRule ? startDateToPayDay(salaryRule.startDate) : undefined;
  if (payDay !== undefined) {
    const { start, end } = getPayPeriodDates(payDay, referenceDate);
    return { payDay, periodStart: start, periodEnd: end };
  }
  return {
    payDay: undefined,
    periodStart: startOfMonth(referenceDate),
    periodEnd: endOfMonth(referenceDate),
  };
}

export function getCombinedTransactionsForPayContext(
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  context: PayPeriodContext
): Transaction[] {
  if (context.payDay !== undefined) {
    return getCombinedTransactionsByDateRange(
      transactions,
      recurringExpenses,
      context.periodStart,
      context.periodEnd
    );
  }
  return getCombinedTransactionsByPeriod(
    transactions,
    recurringExpenses,
    'month',
    context.periodStart
  );
}

/** Pay day of month from salary recurring rule, if configured. */
export function resolveSalaryPayDay(recurringExpenses: RecurringExpense[]): number | undefined {
  const salaryRule = recurringExpenses.find(
    r => r.category === 'salary' && (r.transactionType ?? 'expense') === 'income'
  );
  return salaryRule ? startDateToPayDay(salaryRule.startDate) : undefined;
}
