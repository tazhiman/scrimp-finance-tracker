import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, SavingsGoal, RecurringExpense, Category } from '@/types';
import {
  loadTransactions,
  saveTransactions,
  loadGoals,
  saveGoals,
  loadRecurringExpenses,
  saveRecurringExpenses,
  loadNotificationSettings,
  loadCustomCategories,
  saveCustomCategories,
} from '@/utils/storage';
import { scheduleGoalNotifications } from '@/utils/notifications';

interface FinanceContextType {
  transactions: Transaction[];
  goals: SavingsGoal[];
  recurringExpenses: RecurringExpense[];
  customCategories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addRecurringExpense: (recurring: Omit<RecurringExpense, 'id'>) => void;
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  addGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number) => void;
  addCustomCategory: (category: Omit<Category, 'id'>) => void;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTransactions, loadedGoals, loadedRecurring, loadedCategories] = await Promise.all([
          loadTransactions(),
          loadGoals(),
          loadRecurringExpenses(),
          loadCustomCategories(),
        ]);
        // Migration: ensure createdAt exists for older stored transactions
        const migratedTransactions: Transaction[] = loadedTransactions.map((t: any) => {
          if (t?.createdAt) return t as Transaction;
          const fallback =
            typeof t?.date === 'string'
              ? new Date(`${t.date}T12:00:00.000Z`).toISOString()
              : new Date().toISOString();
          return { ...t, createdAt: fallback } as Transaction;
        });
        setTransactions(migratedTransactions);
        setGoals(loadedGoals);
        setRecurringExpenses(loadedRecurring);
        setCustomCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save transactions whenever they change
  useEffect(() => {
    if (!loading) {
      saveTransactions(transactions).catch(console.error);
    }
  }, [transactions, loading]);

  // Save goals whenever they change
  useEffect(() => {
    if (!loading) {
      saveGoals(goals).catch(console.error);
    }
  }, [goals, loading]);

  // Save recurring expenses whenever they change
  useEffect(() => {
    if (!loading) {
      saveRecurringExpenses(recurringExpenses).catch(console.error);
    }
  }, [recurringExpenses, loading]);

  // Save custom categories whenever they change
  useEffect(() => {
    if (!loading) {
      saveCustomCategories(customCategories).catch(console.error);
    }
  }, [customCategories, loading]);

  // Reschedule notifications when goals change
  useEffect(() => {
    if (!loading && goals.length > 0) {
      const updateNotifications = async () => {
        const notificationsEnabled = await loadNotificationSettings();
        if (notificationsEnabled) {
          await scheduleGoalNotifications(goals);
        }
      };
      updateNotifications();
    }
  }, [goals, loading]);

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addRecurringExpense = (recurring: Omit<RecurringExpense, 'id'>) => {
    const newRecurring: RecurringExpense = {
      ...recurring,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setRecurringExpenses(prev => [...prev, newRecurring]);
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    setRecurringExpenses(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const deleteRecurringExpense = (id: string) => {
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const addGoal = (goal: Omit<SavingsGoal, 'id'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const updateGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setGoals(prev =>
      prev.map(g => (g.id === id ? { ...g, ...updates } : g))
    );
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = (goalId: string, amount: number) => {
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const newContribution = {
            date: new Date().toISOString(),
            amount,
          };
          return {
            ...g,
            currentAmount: Math.min(g.currentAmount + amount, g.targetAmount),
            lastContributionDate: new Date().toISOString(),
            contributions: [...(g.contributions || []), newContribution],
          };
        }
        return g;
      })
    );
  };

  const addCustomCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    setCustomCategories((prev) => [...prev, newCategory]);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        goals,
        recurringExpenses,
        customCategories,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        addCustomCategory,
        loading,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

