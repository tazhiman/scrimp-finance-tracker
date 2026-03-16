import AsyncStorage from '@react-native-async-storage/async-storage';
import { BankAccount } from '@/types';

const ONBOARDING_KEY = '@finance_tracker:onboarding_completed';
const BALANCE_KEY = '@finance_tracker:bank_balance';
const BANK_ACCOUNTS_KEY = '@finance_tracker:bank_accounts';

export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function completeOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error saving onboarding state:', error);
  }
}

export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error resetting onboarding:', error);
  }
}

export async function saveBankBalance(balance: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BALANCE_KEY, JSON.stringify(balance));
  } catch (error) {
    console.error('Error saving bank balance:', error);
  }
}

export async function loadBankBalance(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(BALANCE_KEY);
    return data ? JSON.parse(data) : 0;
  } catch {
    return 0;
  }
}

export async function saveBankAccounts(accounts: BankAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving bank accounts:', error);
  }
}

export async function loadBankAccounts(): Promise<BankAccount[]> {
  try {
    const data = await AsyncStorage.getItem(BANK_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
