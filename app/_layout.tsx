import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FinanceProvider } from '@/context/FinanceContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { loadRewardsData } from '@/utils/cardEngine';

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
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // Initialize rewards data on app start
    const initializeData = async () => {
      try {
        console.log('Initializing rewards data...');
        await loadRewardsData();
        console.log('Rewards data initialized');
      } catch (error) {
        console.error('Error initializing rewards data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    initializeData();
  }, []);

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

  // Show loading screen while initializing data
  if (isLoadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D0EFB1" />
        <Text style={{ color: '#888', marginTop: 16, fontSize: 14 }}>Loading rewards data...</Text>
      </View>
    );
  }

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

