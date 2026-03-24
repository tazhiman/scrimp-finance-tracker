import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { Platform, View, ActivityIndicator, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { FinanceProvider } from '@/context/FinanceContext';
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { loadRewardsData } from '@/utils/cardEngine';
import { isOnboardingCompleted } from '@/utils/onboarding';
import { requestNotificationPermissions } from '@/utils/notifications';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

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
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadRewardsData();
        await requestNotificationPermissions();
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
      } catch (error) {
        console.error('Error initializing app:', error);
        setShowOnboarding(false);
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

  if (isLoadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000505', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#D0EFB1" />
        <Text style={{ color: '#7A7778', marginTop: 16, fontSize: 14 }}>Loading rewards data...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <FinanceProvider>
        <GamificationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="monthly-spending"
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          {showOnboarding && (
            <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
          )}
        </GamificationProvider>
      </FinanceProvider>
    </ThemeProvider>
  );
}

