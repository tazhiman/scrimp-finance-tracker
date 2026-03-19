import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  loadUserCards,
  saveUserCards,
} from '@/utils/storage';
import { UserCard } from '@/types';
import { scheduleGoalNotifications } from '@/utils/notifications';
import { updateWidgetData, reloadWidgets } from '@/utils/widgetData';
import { getPendingTransactions, clearPendingTransactions } from '@/utils/transactionSync';

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
  addCustomCategory: (category: Omit<Category, 'id'>) => string;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const appState = useRef<AppStateStatus>(AppState.currentState);

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
        const MAX_SANE_AMOUNT = 10_000_000;
        const migratedTransactions: Transaction[] = loadedTransactions.map((t: any) => {
          const raw = Number(t?.amount);
          const amount = (Number.isFinite(raw) && raw >= 0 && raw <= MAX_SANE_AMOUNT) ? raw : 0;
          const createdAt = t?.createdAt
            ? t.createdAt
            : typeof t?.date === 'string'
              ? new Date(`${t.date}T12:00:00.000Z`).toISOString()
              : new Date().toISOString();
          return { ...t, amount, createdAt } as Transaction;
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

  // Sync pending transactions written by the Shortcuts intent when app becomes active
  useEffect(() => {
    const syncPending = async () => {
      const pending = await getPendingTransactions();
      if (pending.length === 0) return;

      setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newTxs: Transaction[] = pending
          .filter(p => !existingIds.has(p.id))
          .map(p => ({
            id: p.id,
            amount: p.amount,
            type: p.type,
            category: p.category,
            description: p.description ?? '',
            date: p.date,
            createdAt: p.createdAt,
          }));
        return newTxs.length > 0 ? [...prev, ...newTxs] : prev;
      });

      await clearPendingTransactions();
    };

    // Sync once on mount (covers: app opened after shortcut ran)
    if (!loading) {
      syncPending();
    }

    // Sync whenever app comes back to foreground
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        syncPending();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [loading]);

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

  // Update widget whenever transactions change
  useEffect(() => {
    if (!loading) {
      updateWidget();
    }
  }, [transactions, loading]);

  const updateWidget = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculate today's spending
      const todaySpending = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && transactionDate >= todayStart;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate monthly spending
      const monthlySpending = transactions
        .filter(t => {
          const transactionDate = new Date(t.date);
          return t.type === 'expense' && transactionDate >= monthStart;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Get monthly budget (using 3000 as default, you can make this dynamic)
      const monthlyBudget = 3000;

      // Update widget data
      await updateWidgetData(todaySpending, monthlySpending, monthlyBudget);
      await reloadWidgets();
    } catch (error) {
      // Silently fail - widget updates are optional
      console.debug('Widget update skipped:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
    
    // Update card spending if transaction is linked to a card
    if (newTransaction.cardId && newTransaction.type === 'expense') {
      try {
        const userCards = await loadUserCards();
        const updatedCards = userCards.map(card => {
          if (card.id === newTransaction.cardId) {
            // Get current month transactions for this card
            const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
            const currentTransactions = [...transactions, newTransaction].filter(t =>
              t.cardId === card.id &&
              t.type === 'expense' &&
              t.date.startsWith(currentMonth)
            );
            
            const monthlySpend = currentTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            return {
              ...card,
              currentSpend: monthlySpend,
              lastUpdated: new Date().toISOString(),
            };
          }
          return card;
        });
        
        await saveUserCards(updatedCards);
      } catch (error) {
        console.error('Error updating card spending:', error);
      }
    }
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

  const addCustomCategory = (category: Omit<Category, 'id'>): string => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    return newCategory.id;
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

