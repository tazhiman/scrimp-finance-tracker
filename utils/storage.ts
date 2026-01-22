import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, SavingsGoal, UserProgress, RecurringExpense, Category } from '@/types';

const STORAGE_KEYS = {
  TRANSACTIONS: '@finance_tracker:transactions',
  GOALS: '@finance_tracker:goals',
  RECURRING_EXPENSES: '@finance_tracker:recurring_expenses',
  USER_PROGRESS: '@finance_tracker:user_progress',
  NOTIFICATION_SETTINGS: '@finance_tracker:notification_settings',
  CUSTOM_CATEGORIES: '@finance_tracker:custom_categories',
};

// Transactions
export const saveTransactions = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
};

export const loadTransactions = async (): Promise<Transaction[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading transactions:', error);
    return [];
  }
};

// Savings Goals
export const saveGoals = async (goals: SavingsGoal[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goals:', error);
    throw error;
  }
};

export const loadGoals = async (): Promise<SavingsGoal[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading goals:', error);
    return [];
  }
};

// Recurring Expenses
export const saveRecurringExpenses = async (recurring: RecurringExpense[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECURRING_EXPENSES, JSON.stringify(recurring));
  } catch (error) {
    console.error('Error saving recurring expenses:', error);
    throw error;
  }
};

export const loadRecurringExpenses = async (): Promise<RecurringExpense[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECURRING_EXPENSES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading recurring expenses:', error);
    return [];
  }
};

// User Progress
export const saveUserProgress = async (progress: UserProgress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving user progress:', error);
    throw error;
  }
};

export const loadUserProgress = async (): Promise<UserProgress | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading user progress:', error);
    return null;
  }
};

// Clear all data (for testing/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.GOALS,
      STORAGE_KEYS.RECURRING_EXPENSES,
      STORAGE_KEYS.USER_PROGRESS,
      STORAGE_KEYS.NOTIFICATION_SETTINGS,
      STORAGE_KEYS.CUSTOM_CATEGORIES,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

// Notification Settings
export const saveNotificationSettings = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify({ enabled }));
  } catch (error) {
    console.error('Error saving notification settings:', error);
    throw error;
  }
};

export const loadNotificationSettings = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    if (data) {
      const settings = JSON.parse(data);
      return settings.enabled ?? false;
    }
    return false; // Default to disabled
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return false;
  }
};

// Custom Categories
export const saveCustomCategories = async (categories: Category[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving custom categories:', error);
    throw error;
  }
};

export const loadCustomCategories = async (): Promise<Category[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading custom categories:', error);
    return [];
  }
};

// Seed test data (for development/testing)
export const seedTestData = async (
  transactions: Transaction[],
  goals: SavingsGoal[],
  recurringExpenses: RecurringExpense[] = []
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Clear existing data first
    await clearAllData();
    
    // Save new test data
    await saveTransactions(transactions);
    await saveGoals(goals);
    await saveRecurringExpenses(recurringExpenses);
    
    console.log(
      `Seeded ${transactions.length} transactions, ${goals.length} goals, and ${recurringExpenses.length} recurring expenses`
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error seeding test data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
