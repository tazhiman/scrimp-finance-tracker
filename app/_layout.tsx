import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FinanceProvider } from '@/context/FinanceContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeProvider } from '@/context/ThemeContext';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // SDK 54+: shouldShowAlert is deprecated in favor of banner/list
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // You can navigate to goals page here if needed
      // const goalId = response.notification.request.content.data.goalId;
    });

    return () => {
      if (notificationListener.current) {
        // expo-notifications Subscription supports .remove()
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <ThemeProvider>
    <FinanceProvider>
      <GamificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GamificationProvider>
    </FinanceProvider>
    </ThemeProvider>
  );
}

