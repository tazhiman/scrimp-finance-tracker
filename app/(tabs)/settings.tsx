import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { generateTestData } from '@/utils/generateTestData';
import { seedTestData, loadNotificationSettings, saveNotificationSettings } from '@/utils/storage';
import {
  scheduleGoalNotifications,
  cancelAllNotifications,
  sendTestNotification,
} from '@/utils/notifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { goals } = useFinance();
  const tabBarHeight = useBottomTabBarHeight();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load notification settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await loadNotificationSettings();
      setNotificationsEnabled(enabled);
    };
    loadSettings();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await saveNotificationSettings(value);

      if (value) {
        // Schedule notifications for goals
        await scheduleGoalNotifications(goals);
        // Send test notification
        await sendTestNotification();
      } else {
        // Cancel all notifications
        await cancelAllNotifications();
        Alert.alert('Notifications Disabled', 'You will no longer receive goal reminders.');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      setNotificationsEnabled(!value); // Revert on error
    }
  };

  const handleLoadTestData = async () => {
    Alert.alert(
      'Load Test Data',
      'This will clear all existing data and load 2 years of test transactions and goals. Continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Load Data',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Generate test data
              const { transactions, goals } = generateTestData();
              
              // Seed the data
              const result = await seedTestData(transactions, goals);
              
              if (result.success) {
                Alert.alert(
                  'Success',
                  `Loaded ${transactions.length} transactions and ${goals.length} goals. Please restart the app or refresh to see the data.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.error || 'Failed to load test data');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
              console.error('Error loading test data:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setThemeMode('dark')}
            >
              <View style={styles.optionLeft}>
                <Ionicons 
                  name="moon" 
                  size={24} 
                  color={themeMode === 'dark' ? theme.primary : theme.textSecondary} 
                />
                <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
              </View>
              {themeMode === 'dark' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity
              style={styles.option}
              onPress={() => setThemeMode('light')}
            >
              <View style={styles.optionLeft}>
                <Ionicons 
                  name="sunny" 
                  size={24} 
                  color={themeMode === 'light' ? theme.primary : theme.textSecondary} 
                />
                <Text style={[styles.optionText, { color: theme.text }]}>Light Mode</Text>
              </View>
              {themeMode === 'light' && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeftGrow}>
                <Ionicons 
                  name="notifications" 
                  size={24} 
                  color={notificationsEnabled ? theme.primary : theme.textSecondary} 
                />
                <View style={styles.optionTextBlock}>
                  <Text style={[styles.optionText, { color: theme.text }]}>Goal Reminders</Text>
                  <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                    Weekly notifications for due/overdue goals
                  </Text>
                </View>
              </View>
              <View style={styles.switchWrapper}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: theme.textTertiary, true: theme.primary }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                  ios_backgroundColor={theme.textTertiary}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ABOUT</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.option}>
              <Text style={[styles.optionText, { color: theme.text }]}>Version</Text>
              <Text style={[styles.versionText, { color: theme.textSecondary }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HELP</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => router.push('/(tabs)/faq')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Ionicons name="help-circle" size={24} color={theme.primary} />
                <View>
                  <Text style={[styles.optionText, { color: theme.text }]}>FAQ</Text>
                  <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                    How the app works
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Section - Only visible in development mode */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DEVELOPER</Text>
            
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={styles.option}
                onPress={handleLoadTestData}
                disabled={loading}
              >
                <View style={styles.optionLeft}>
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Ionicons 
                      name="cloud-download" 
                      size={24} 
                      color={theme.primary} 
                    />
                  )}
                  <View>
                    <Text style={[styles.optionText, { color: theme.text }]}>Load Test Data</Text>
                    <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                      2 years of sample data
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionLeftGrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  optionTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  switchWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    marginLeft: 52,
  },
  versionText: {
    fontSize: 16,
  },
});
