import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SavingsGoal, ContributionStatus } from '@/types';
import { getContributionStatus } from './calculations';

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

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('goal-reminders', {
        name: 'Goal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D0EFB1',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Cancel all scheduled notifications
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
export const scheduleGoalNotifications = async (goals: SavingsGoal[]): Promise<void> => {
  try {
    // Cancel existing notifications first
    await cancelAllNotifications();

    // Check if we have permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('No notification permission, skipping scheduling');
      return;
    }

    // Schedule notifications for each goal that needs attention
    for (const goal of goals) {
      // Skip completed goals
      if (goal.currentAmount >= goal.targetAmount) {
        continue;
      }

      const status = getContributionStatus(goal);
      
      // Only schedule for due or overdue goals
      if (status === 'due' || status === 'overdue') {
        const { title, body } = getNotificationContent(goal, status);
        
        if (!title || !body) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: { goalId: goal.id, goalName: goal.name },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            ...(Platform.OS === 'android' && { channelId: 'goal-reminders' }),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 2, // Monday (1 = Sunday, 2 = Monday, etc.)
            hour: 9,
            minute: 0,
            ...(Platform.OS === 'android' ? { channelId: 'goal-reminders' } : {}),
          },
        });

        console.log(`Scheduled weekly notification for ${goal.name} (Mon 9:00)`);
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
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
        body: 'You will receive weekly reminders for your goals.',
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'goal-reminders' }),
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};
