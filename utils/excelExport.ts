/**
 * Excel Export Utility
 * 
 * Exports transactions to Excel format with date range filtering
 */

import * as XLSX from 'xlsx';
import { writeAsStringAsync, documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Transaction, Category } from '@/types';
import { getCategoryById } from '@/constants/categories';
import { formatDetailTransactionTime } from '@/utils/dateHelpers';

interface ExportOptions {
  startDate: Date;
  endDate: Date;
  transactions: Transaction[];
  customCategories?: Category[];
}

/**
 * Exports transactions to Excel file
 */
export async function exportTransactionsToExcel(options: ExportOptions): Promise<void> {
  const { startDate, endDate, transactions, customCategories = [] } = options;

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start of day for comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    txDate.setHours(0, 0, 0, 0);
    
    return txDate >= start && txDate <= end;
  });

  // Sort by date (newest first)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Prepare data for Excel
  const excelData = sortedTransactions.map(tx => {
    const category = getCategoryById(tx.category, customCategories);
    
    return {
      'Date': formatDate(tx.date),
      'Type': tx.type === 'income' ? 'Income' : 'Expense',
      'Category': category?.name || tx.category,
      'Amount': tx.amount,
      'Merchant': tx.merchant || '',
      'Time': formatDetailTransactionTime(tx.time, tx.createdAt),
      'Description': tx.description || '',
      'Card ID': tx.cardId || '',
      'Added to App': formatDateTime(tx.createdAt),
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 },  // Date
    { wch: 10 },  // Type
    { wch: 20 },  // Category
    { wch: 12 },  // Amount
    { wch: 22 },  // Merchant
    { wch: 10 },  // Time
    { wch: 30 },  // Description
    { wch: 20 },  // Card ID
    { wch: 20 },  // Added to App
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  // Add summary sheet
  const summary = createSummarySheet(sortedTransactions, customCategories);
  const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
  summaryWorksheet['!cols'] = [
    { wch: 20 },  // Label
    { wch: 15 },  // Value
  ];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Generate Excel file
  const wbout = XLSX.write(workbook, {
    type: 'base64',
    bookType: 'xlsx',
  });

  // Create filename with date range
  const filename = `transactions_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}.xlsx`;
  const fileUri = `${documentDirectory}${filename}`;

  // Write file
  await writeAsStringAsync(fileUri, wbout, {
    encoding: 'base64',
  });

  // Share file
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

/**
 * Creates summary data for the summary sheet
 */
function createSummarySheet(transactions: Transaction[], customCategories: Category[]) {
  const income = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const netBalance = income - expenses;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  transactions
    .filter(tx => tx.type === 'expense')
    .forEach(tx => {
      const category = getCategoryById(tx.category, customCategories);
      const categoryName = category?.name || tx.category;
      categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + tx.amount;
    });

  const safeFmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

  const summary = [
    { Label: 'Total Income', Value: `$${safeFmt(income)}` },
    { Label: 'Total Expenses', Value: `$${safeFmt(expenses)}` },
    { Label: 'Net Balance', Value: `$${safeFmt(netBalance)}` },
    { Label: 'Total Transactions', Value: transactions.length },
    { Label: '', Value: '' },
    { Label: 'Expenses by Category', Value: '' },
    ...Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        Label: `  ${category}`,
        Value: `$${safeFmt(amount)}`,
      })),
  ];

  return summary;
}

/**
 * Formats date as YYYY-MM-DD
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Formats date and time
 */
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

/**
 * Formats date for filename (YYYYMMDD)
 */
function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
