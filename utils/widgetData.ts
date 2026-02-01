/**
 * Widget Data Bridge
 * 
 * This module handles sharing data between the React Native app and iOS widget
 * via App Groups and shared UserDefaults.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

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

  try {
    // Store data for widget access
    await AsyncStorage.setItem('@widget_today_spending', todaySpending.toString());
    await AsyncStorage.setItem('@widget_monthly_spending', monthlySpending.toString());
    await AsyncStorage.setItem('@widget_monthly_budget', monthlyBudget.toString());

    // If native module is available, use it to update shared UserDefaults
    if (WidgetDataModule?.updateWidgetData) {
      await WidgetDataModule.updateWidgetData({
        todaySpending,
        monthlySpending,
        monthlyBudget,
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
  if (Platform.OS !== 'ios') return;

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
