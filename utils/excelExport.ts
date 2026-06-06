/**
 * Excel Export Utility
 *
 * Exports logged transactions, generated recurring occurrences, and goal contributions.
 */

import * as XLSX from 'xlsx';
import { writeAsStringAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { endOfDay, startOfDay } from 'date-fns';
import { Transaction, Category, RecurringExpense, SavingsGoal } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { formatDetailTransactionTime, isDateInRange } from '@/utils/dateHelpers';
import { generateRecurringTransactionsForDateRange, isGeneratedRecurringTransactionId } from '@/utils/recurring';

interface ExportOptions {
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  recurringExpenses?: RecurringExpense[];
  goals?: SavingsGoal[];
  customCategories?: Category[];
}

type ExportRow = {
  Date: string;
  Type: string;
  Category: string;
  Amount: number;
  Merchant: string;
  Time: string;
  Description: string;
  Source: string;
  'Card ID': string;
  'Added to App': string;
};

/**
 * Exports transactions to Excel file
 */
export async function exportTransactionsToExcel(options: ExportOptions): Promise<void> {
  const {
    startDate,
    endDate,
    transactions,
    recurringExpenses = [],
    goals = [],
    customCategories = [],
  } = options;

  const rangeStart = startOfDay(startDate);
  const rangeEnd = endOfDay(endDate);
  const exportRows = buildExportRows(
    transactions,
    recurringExpenses,
    goals,
    rangeStart,
    rangeEnd,
    customCategories
  );

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 22 },
    { wch: 10 },
    { wch: 30 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  const summary = createSummarySheet(exportRows);
  const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
  summaryWorksheet['!cols'] = [{ wch: 24 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  const wbout = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
  });

  const filename = `transactions_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}.xlsx`;
  const fileUri = `${documentDirectory}${filename}`;

  await writeAsStringAsync(fileUri, wbout, {
    encoding: 'base64',
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Transactions',
      UTI: 'com.microsoft.excel.xlsx',
    });
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

function buildExportRows(
  transactions: Transaction[],
  recurringExpenses: RecurringExpense[],
  goals: SavingsGoal[],
  rangeStart: Date,
  rangeEnd: Date,
  customCategories: Category[]
): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const tx of transactions) {
    if (!isDateInRange(tx.date, rangeStart, rangeEnd)) continue;
    rows.push(transactionToRow(tx, customCategories, 'Logged'));
  }

  const generated = generateRecurringTransactionsForDateRange(
    recurringExpenses,
    rangeStart,
    rangeEnd
  );
  for (const tx of generated) {
    rows.push(transactionToRow(tx, customCategories, 'Recurring'));
  }

  for (const goal of goals) {
    for (const contribution of goal.contributions ?? []) {
      if (!isDateInRange(contribution.date, rangeStart, rangeEnd)) continue;
      rows.push({
        Date: formatDate(contribution.date),
        Type: 'Goal Contribution',
        Category: goal.name,
        Amount: contribution.amount,
        Merchant: '',
        Time: formatDetailTransactionTime(undefined, contribution.date),
        Description: `${goal.name} contribution`,
        Source: 'Goal',
        'Card ID': '',
        'Added to App': formatDateTime(contribution.date),
      });
    }
  }

  rows.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
  return rows;
}

function transactionToRow(
  tx: Transaction,
  customCategories: Category[],
  source: string
): ExportRow {
  const category = getCategoryById(tx.category, customCategories);

  return {
    Date: formatDate(tx.date),
    Type: tx.type === 'income' ? 'Income' : 'Expense',
    Category: category?.name || tx.category,
    Amount: tx.amount,
    Merchant: tx.merchant || '',
    Time: formatDetailTransactionTime(tx.time, tx.createdAt),
    Description: tx.description || '',
    Source: source,
    'Card ID': tx.cardId || '',
    'Added to App': formatDateTime(tx.createdAt),
  };
}

function createSummarySheet(rows: ExportRow[]) {
  const income = rows
    .filter(r => r.Type === 'Income')
    .reduce((sum, r) => sum + r.Amount, 0);

  const expenses = rows
    .filter(r => r.Type === 'Expense')
    .reduce((sum, r) => sum + r.Amount, 0);

  const goalContributions = rows
    .filter(r => r.Type === 'Goal Contribution')
    .reduce((sum, r) => sum + r.Amount, 0);

  const netBalance = income - expenses - goalContributions;

  const categoryBreakdown: Record<string, number> = {};
  rows
    .filter(r => r.Type === 'Expense' || r.Type === 'Goal Contribution')
    .forEach(r => {
      categoryBreakdown[r.Category] = (categoryBreakdown[r.Category] || 0) + r.Amount;
    });

  const safeFmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

  return [
    { Label: 'Total Income', Value: `$${safeFmt(income)}` },
    { Label: 'Total Expenses', Value: `$${safeFmt(expenses)}` },
    { Label: 'Goal Contributions', Value: `$${safeFmt(goalContributions)}` },
    { Label: 'Net Balance', Value: `$${safeFmt(netBalance)}` },
    { Label: 'Total Rows', Value: rows.length },
    { Label: '', Value: '' },
    { Label: 'Expenses & Contributions by Category', Value: '' },
    ...Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        Label: `  ${category}`,
        Value: `$${safeFmt(amount)}`,
      })),
  ];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString.length <= 10 ? `${dateString}T12:00:00` : dateString);
  return date.toISOString().split('T')[0];
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
