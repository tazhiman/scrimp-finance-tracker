import { Platform, NativeModules } from 'react-native';

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
