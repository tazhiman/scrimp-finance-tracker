import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { BankAccount } from '@/types';
import { loadBankAccounts, saveBankAccounts } from '@/utils/onboarding';
import { daysSince } from '@/utils/dateHelpers';
import { loadNotificationSettings } from '@/utils/storage';
import { scheduleBalanceReconciliationNotification } from '@/utils/notifications';

interface BankAccountsContextType {
  accounts: BankAccount[];
  loading: boolean;
  /** Reload accounts from storage (e.g. after onboarding commits linked accounts). */
  reloadAccounts: () => Promise<void>;
  addAccount: (name: string, balance: number) => Promise<void>;
  updateAccount: (id: string, updates: { name?: string; balance?: number }) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  /** Mark the account as confirmed by the user right now (resets lastUpdated). */
  confirmBalance: (id: string) => Promise<void>;
  /**
   * Apply a signed delta to an account's balance without touching lastUpdated.
   * Used by FinanceContext when transactions are added / updated / deleted.
   * Positive delta = money in, negative = money out.
   */
  applyTransactionDelta: (accountId: string, signedDelta: number) => Promise<void>;
  /** Accounts whose lastUpdated is missing or older than thresholdDays. */
  getStaleAccounts: (thresholdDays?: number) => BankAccount[];
}

const BankAccountsContext = createContext<BankAccountsContextType | undefined>(undefined);

export const BankAccountsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadAccounts = useCallback(async () => {
    try {
      const loaded = await loadBankAccounts();
      setAccounts(loaded);
      if (loaded.length > 0) {
        const notifEnabled = await loadNotificationSettings();
        if (notifEnabled) {
          scheduleBalanceReconciliationNotification().catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await reloadAccounts();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [reloadAccounts]);

  // Persist whenever accounts change (after initial load)
  useEffect(() => {
    if (!loading) {
      saveBankAccounts(accounts).catch(console.error);
    }
  }, [accounts, loading]);

  const addAccount = useCallback(async (name: string, balance: number) => {
    const newAccount: BankAccount = {
      id: Date.now().toString(),
      name,
      balance,
      lastUpdated: new Date().toISOString(),
    };
    setAccounts(prev => [...prev, newAccount]);
  }, []);

  const updateAccount = useCallback(async (id: string, updates: { name?: string; balance?: number }) => {
    setAccounts(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const balanceChanged = updates.balance !== undefined && updates.balance !== a.balance;
        return {
          ...a,
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.balance !== undefined ? { balance: updates.balance } : {}),
          // Only reset lastUpdated when the user explicitly changes the balance
          ...(balanceChanged ? { lastUpdated: new Date().toISOString() } : {}),
        };
      })
    );
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }, []);

  const confirmBalance = useCallback(async (id: string) => {
    setAccounts(prev =>
      prev.map(a =>
        a.id === id ? { ...a, lastUpdated: new Date().toISOString() } : a
      )
    );
  }, []);

  const applyTransactionDelta = useCallback(async (accountId: string, signedDelta: number) => {
    if (!accountId || signedDelta === 0) return;
    setAccounts(prev =>
      prev.map(a =>
        a.id === accountId
          ? { ...a, balance: a.balance + signedDelta }
          : a
      )
    );
  }, []);

  const getStaleAccounts = useCallback(
    (thresholdDays = 14) =>
      accounts.filter(
        a => !a.lastUpdated || daysSince(a.lastUpdated) > thresholdDays
      ),
    [accounts]
  );

  return (
    <BankAccountsContext.Provider
      value={{
        accounts,
        loading,
        reloadAccounts,
        addAccount,
        updateAccount,
        deleteAccount,
        confirmBalance,
        applyTransactionDelta,
        getStaleAccounts,
      }}
    >
      {children}
    </BankAccountsContext.Provider>
  );
};

export const useBankAccounts = (): BankAccountsContextType => {
  const ctx = useContext(BankAccountsContext);
  if (!ctx) {
    throw new Error('useBankAccounts must be used within a BankAccountsProvider');
  }
  return ctx;
};
