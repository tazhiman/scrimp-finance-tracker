import { NativeModules, Platform } from 'react-native';
import { Transaction } from '@/types';

const { TransactionSyncModule } = NativeModules;

export interface PendingTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description?: string;
  date: string;
  createdAt: string;
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  if (Platform.OS !== 'ios' || !TransactionSyncModule) {
    return [];
  }

  try {
    const jsonString: string = await TransactionSyncModule.getPendingTransactions();
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (error) {
    console.error('Error reading pending transactions:', error);
    return [];
  }
}

export async function clearPendingTransactions(): Promise<void> {
  if (Platform.OS !== 'ios' || !TransactionSyncModule) {
    return;
  }

  try {
    await TransactionSyncModule.clearPendingTransactions();
  } catch (error) {
    console.error('Error clearing pending transactions:', error);
  }
}
