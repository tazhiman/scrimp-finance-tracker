import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SavingsGoal, ContributionStatus, GoalReserveStatus, RecurringExpense } from '@/types';
import { getReserveNotificationContent } from './goalReserve';
import { getContributionStatus } from './calculations';
import { resolveSalaryPayDay } from './payPeriodContext';

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('goal-reminders', {
        name: 'Goal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D0EFB1',
      });
      await Notifications.setNotificationChannelAsync('balance-reminders', {
        name: 'Balance Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#FF9F0A',
      });
      await Notifications.setNotificationChannelAsync('goal-reserve', {
        name: 'Goal Savings Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9F0A',
      });
      await Notifications.setNotificationChannelAsync('tap-to-pay', {
        name: 'Transaction Logged',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#D0EFB1',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Cancel all notifications whose `data.kind` matches the given value.
 * Falls back to cancelling ALL notifications if no kind filter is needed.
 */
const cancelNotificationsByKind = async (kind: 'goal' | 'balance' | 'goal-reserve'): Promise<void> => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled
      .filter(n => (n.content.data as Record<string, unknown>)?.kind === kind)
      .map(n => n.identifier);
    await Promise.all(toCancel.map(id => Notifications.cancelScheduledNotificationAsync(id)));
  } catch (error) {
    console.error(`Error cancelling ${kind} notifications:`, error);
  }
};

// Cancel all scheduled notifications (used when master toggle is disabled)
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
};

// Get notification content based on goal status
const getNotificationContent = (
  goal: SavingsGoal,
  status: ContributionStatus
): { title: string; body: string } => {
  const frequency = goal.frequency === 'weekly' ? 'week' : 'month';
  
  switch (status) {
    case 'overdue':
      return {
        title: '⚠️ Contribution Overdue',
        body: `You missed your ${goal.name} contribution. Don't fall behind on your goal!`,
      };
    case 'due':
      return {
        title: '⏰ Contribution Due',
        body: `Your ${goal.name} contribution is due this ${frequency}. Stay on track!`,
      };
    default:
      return {
        title: '',
        body: '',
      };
  }
};

// Schedule weekly notifications for goals
export const scheduleGoalNotifications = async (
  goals: SavingsGoal[],
  recurringExpenses: RecurringExpense[] = []
): Promise<void> => {
  try {
    // Cancel only goal-tagged notifications, preserving balance reminders
    await cancelNotificationsByKind('goal');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission, skipping scheduling');
      return;
    }

    const payDay = resolveSalaryPayDay(recurringExpenses);

    for (const goal of goals) {
      if (goal.currentAmount >= goal.targetAmount) {
        continue;
      }

      const status = getContributionStatus(goal, payDay);
      
      if (status === 'due' || status === 'overdue') {
        const { title, body } = getNotificationContent(goal, status);
        
        if (!title || !body) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { kind: 'goal', goalId: goal.id, goalName: goal.name },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            ...(Platform.OS === 'android' && { channelId: 'goal-reminders' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 2, // Monday
            hour: 9,
            minute: 0,
            ...(Platform.OS === 'android' ? { channelId: 'goal-reminders' } : {}),
          },
        });

        console.log(`Scheduled weekly goal notification for ${goal.name} (Mon 9:00)`);
      }
    }
  } catch (error) {
    console.error('Error scheduling goal notifications:', error);
  }
};

/** Schedule a single weekly balance reconciliation reminder (Sunday 18:00). */
export const scheduleBalanceReconciliationNotification = async (): Promise<void> => {
  try {
    // Remove any existing balance reminder first to avoid duplicates
    await cancelNotificationsByKind('balance');

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Money check-in time',
        body: 'Open Scrimp and confirm your account balances are up to date.',
        data: { kind: 'balance' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'balance-reminders' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday (1 = Sunday in Expo's convention)
        hour: 18,
        minute: 0,
        ...(Platform.OS === 'android' ? { channelId: 'balance-reminders' } : {}),
      },
    });

    console.log('Scheduled weekly balance reconciliation notification (Sun 18:00)');
  } catch (error) {
    console.error('Error scheduling balance notification:', error);
  }
};

/** Cancel the balance reconciliation reminder. */
export const cancelBalanceReconciliationNotification = async (): Promise<void> => {
  await cancelNotificationsByKind('balance');
};

/** Immediate notification when a tap-to-pay / Shortcuts transaction is synced. */
export const sendTapToPayNotification = async (
  amount: number,
  merchant?: string
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const label = (merchant ?? '').trim() || 'Unknown Merchant';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Transaction Logged',
        body: `$${amount.toFixed(2)} at ${label} has been logged.`,
        data: { kind: 'tap-to-pay' },
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'tap-to-pay' }),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending tap-to-pay notification:', error);
  }
};

/** Immediate alert when linked-account spending threatens or negates goal savings. */
export const sendGoalReserveNotification = async (
  goal: SavingsGoal,
  status: Exclude<GoalReserveStatus, 'ok'>
): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const { title, body } = getReserveNotificationContent(goal, status);

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { kind: 'goal-reserve', goalId: goal.id, goalName: goal.name, reserveStatus: status },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === 'android' && { channelId: 'goal-reserve' }),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Error sending goal reserve notification:', error);
  }
};

// Get all scheduled notifications (for debugging)
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Send immediate test notification
export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ Notifications Enabled',
        body: 'You will receive weekly reminders for your goals and balance check-ins.',
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'goal-reminders' }),
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};
