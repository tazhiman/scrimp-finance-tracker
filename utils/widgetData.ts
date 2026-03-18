/**
 * Widget Data Bridge
 * 
 * This module handles sharing data between the React Native app and iOS widget
 * via App Groups and shared UserDefaults.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

// Temporary kill switch for diagnosing iOS startup crashes.
// Set to true to re-enable widget bridge calls.
const WIDGET_SYNC_ENABLED = false;

// Check if native module is available
const WidgetDataModule = Platform.OS === 'ios' ? NativeModules.WidgetDataModule : null;

/**
 * Updates widget data with current spending information
 * This will be called whenever transactions are added/updated
 */
export async function updateWidgetData(
  todaySpending: number,
  monthlySpending: number,
  monthlyBudget: number
): Promise<void> {
  if (Platform.OS !== 'ios') {
    console.log('Widget updates are only available on iOS');
    return;
  }
  if (!WIDGET_SYNC_ENABLED) {
    return;
  }

  try {
    // Prevent invalid numeric payloads from reaching native bridge.
    // Some iOS APIs can throw Objective-C exceptions for non-finite values.
    const safeTodaySpending = Number.isFinite(todaySpending) ? todaySpending : 0;
    const safeMonthlySpending = Number.isFinite(monthlySpending) ? monthlySpending : 0;
    const safeMonthlyBudget = Number.isFinite(monthlyBudget) ? monthlyBudget : 0;

    // Store data for widget access
    await AsyncStorage.setItem('@widget_today_spending', safeTodaySpending.toString());
    await AsyncStorage.setItem('@widget_monthly_spending', safeMonthlySpending.toString());
    await AsyncStorage.setItem('@widget_monthly_budget', safeMonthlyBudget.toString());

    // If native module is available, use it to update shared UserDefaults
    if (WidgetDataModule?.updateWidgetData) {
      await WidgetDataModule.updateWidgetData({
        todaySpending: safeTodaySpending,
        monthlySpending: safeMonthlySpending,
        monthlyBudget: safeMonthlyBudget,
      });
      console.log('Widget data updated successfully');
    }
  } catch (error) {
    console.error('Failed to update widget data:', error);
  }
}

/**
 * Reloads all widgets to show updated data
 */
export async function reloadWidgets(): Promise<void> {
  if (Platform.OS !== 'ios' || !WIDGET_SYNC_ENABLED) return;

  try {
    if (WidgetDataModule?.reloadWidgets) {
      await WidgetDataModule.reloadWidgets();
    }
  } catch (error) {
    console.error('Failed to reload widgets:', error);
  }
}

/**
 * Gets cached widget data
 */
export async function getWidgetData(): Promise<{
  todaySpending: number;
  monthlySpending: number;
  monthlyBudget: number;
} | null> {
  try {
    const todaySpending = await AsyncStorage.getItem('@widget_today_spending');
    const monthlySpending = await AsyncStorage.getItem('@widget_monthly_spending');
    const monthlyBudget = await AsyncStorage.getItem('@widget_monthly_budget');

    if (!todaySpending || !monthlySpending || !monthlyBudget) {
      return null;
    }

    return {
      todaySpending: parseFloat(todaySpending),
      monthlySpending: parseFloat(monthlySpending),
      monthlyBudget: parseFloat(monthlyBudget),
    };
  } catch (error) {
    console.error('Failed to get widget data:', error);
    return null;
  }
}
