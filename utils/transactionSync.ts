import { Platform, NativeModules } from 'react-native';

import type { Transaction } from '@/types';

const TransactionSyncModule = Platform.OS === 'ios'
  ? NativeModules.TransactionSyncModule ?? null
  : null;

if (Platform.OS === 'ios') {
  if (TransactionSyncModule) {
    console.log('[TransactionSync] Native module loaded successfully');
  } else {
    console.warn('[TransactionSync] Native module NOT available');
  }
}

export interface PendingTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  merchant?: string;
  /** Local time HH:mm if provided by Shortcuts */
  time?: string;
  description?: string;
  date: string;
  createdAt: string;
}

/**
 * Maps a row from the Shortcuts / App Group queue into a stored {@link Transaction}.
 * - If `merchant` is set, it is used and `description` is kept as notes.
 * - If only `description` is set (legacy shortcuts), treat it as the payee / merchant name.
 */
export function pendingTransactionToTransaction(p: PendingTransaction): Transaction {
  const merchantTrimmed = (p.merchant ?? '').trim();
  const descTrimmed = (p.description ?? '').trim();
  const hasMerchantField = merchantTrimmed.length > 0;

  let merchant: string | undefined;
  let description: string;

  if (hasMerchantField) {
    merchant = merchantTrimmed;
    description = descTrimmed;
  } else if (descTrimmed) {
    merchant = descTrimmed;
    description = '';
  } else {
    merchant = undefined;
    description = '';
  }

  return {
    id: p.id,
    amount: p.amount,
    type: p.type,
    category: p.category,
    date: p.date,
    createdAt: p.createdAt,
    description,
    ...(merchant ? { merchant } : {}),
    ...(p.time ? { time: p.time } : {}),
  };
}

export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  if (Platform.OS !== 'ios' || !TransactionSyncModule) {
    return [];
  }

  try {
    const jsonString: string = await TransactionSyncModule.getPendingTransactions();
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item: any) => {
        const amount = Number(item?.amount);
        if (!Number.isFinite(amount) || amount < 0) return null;
        if (item?.type !== 'income' && item?.type !== 'expense') return null;
        if (typeof item?.date !== 'string' || item.date.length === 0) return null;
        if (typeof item?.id !== 'string' || item.id.length === 0) return null;

        return {
          id: item.id,
          amount,
          type: item.type,
          category: typeof item?.category === 'string' ? item.category : 'other',
          merchant: typeof item?.merchant === 'string' ? item.merchant : undefined,
          time: typeof item?.time === 'string' && /^\d{1,2}:\d{2}$/.test(item.time.trim()) ? item.time.trim() : undefined,
          description: typeof item?.description === 'string' ? item.description : '',
          date: item.date,
          createdAt: typeof item?.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        } as PendingTransaction;
      })
      .filter((tx: PendingTransaction | null): tx is PendingTransaction => tx !== null);
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
