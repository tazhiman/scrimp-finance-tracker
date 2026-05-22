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
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { Spacing, Radius } from '@/constants/design';
import { generateTestData } from '@/utils/generateTestData';
import { seedTestData, loadNotificationSettings, saveNotificationSettings, loadUserCards } from '@/utils/storage';
import { ShortcutsGuideStep } from '@/components/onboarding/ShortcutsGuideStep';
import {
  scheduleGoalNotifications,
  cancelAllNotifications,
  sendTestNotification,
  scheduleBalanceReconciliationNotification,
  cancelBalanceReconciliationNotification,
} from '@/utils/notifications';
import { UserCard } from '@/types';
import { loadRewardsData } from '@/utils/cardEngine';
import { forceRefresh } from '@/utils/remoteRewardsData';
import { ENV } from '@/config/env';
import { exportTransactionsToExcel } from '@/utils/excelExport';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode } = useTheme();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const { goals, transactions, customCategories } = useFinance();
  const tabBarHeight = useBottomTabBarHeight();
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userCards, setUserCards] = useState<UserCard[]>([]);

  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Export state
  const [exportStartDate, setExportStartDate] = useState<Date>(new Date());
  const [exportEndDate, setExportEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const enabled = await loadNotificationSettings();
      const cards = await loadUserCards();
      
      setNotificationsEnabled(enabled);
      setUserCards(cards);
    };
    loadSettings();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    try {
      setNotificationsEnabled(value);
      await saveNotificationSettings(value);

      if (value) {
        await scheduleGoalNotifications(goals);
        await scheduleBalanceReconciliationNotification();
        await sendTestNotification();
      } else {
        await cancelAllNotifications();
        Alert.alert('Notifications Disabled', 'You will no longer receive reminders.');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings');
      setNotificationsEnabled(!value); // Revert on error
    }
  };

  const handleManageCards = () => {
    router.push('/(tabs)/manage-cards');
  };

  const handleSyncRewards = async () => {
    setLoading(true);
    try {
      console.log('🔄 Manually triggering rewards sync...');
      const result = await forceRefresh();
      
      if (result.success) {
        // Reload the card engine with fresh data
        await loadRewardsData();
        
        Alert.alert(
          'Sync Complete',
          'Successfully fetched latest rewards data from GitHub!'
        );
      } else {
        Alert.alert(
          'Sync Failed',
          result.message || 'Could not fetch from GitHub. Check your connection and config.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while syncing.'
      );
      console.error('Sync error:', error);
    } finally {
      setLoading(false);
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

  const handleExportToExcel = async () => {
    if (exportStartDate > exportEndDate) {
      Alert.alert('Invalid Date Range', 'Start date must be before end date');
      return;
    }

    setExporting(true);
    try {
      await exportTransactionsToExcel({
        startDate: exportStartDate,
        endDate: exportEndDate,
        transactions,
        customCategories,
      });
      
      Alert.alert(
        'Export Successful',
        'Your transactions have been exported to Excel!'
      );
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert(
        'Export Failed',
        error instanceof Error ? error.message : 'Failed to export transactions'
      );
    } finally {
      setExporting(false);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
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
                <Icon 
                  name="moon" 
                  size={24} 
                  color={themeMode === 'dark' ? theme.primary : theme.textSecondary} 
                />
                <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
              </View>
              {themeMode === 'dark' && (
                <Icon name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity
              style={styles.option}
              onPress={() => setThemeMode('light')}
            >
              <View style={styles.optionLeft}>
                <Icon 
                  name="sunny" 
                  size={24} 
                  color={themeMode === 'light' ? theme.primary : theme.textSecondary} 
                />
                <Text style={[styles.optionText, { color: theme.text }]}>Light Mode</Text>
              </View>
              {themeMode === 'light' && (
                <Icon name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {ENV.enableCreditCards && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CREDIT CARDS</Text>
            
            <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <TouchableOpacity
                style={styles.option}
                onPress={handleManageCards}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <Icon name="card" size={24} color={theme.primary} />
                  <View>
                    <Text style={[styles.optionText, { color: theme.text }]}>My Cards</Text>
                    <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                      {userCards.length === 0 ? 'Tap to add cards' : `${userCards.length} card${userCards.length === 1 ? '' : 's'} added`}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>NOTIFICATIONS</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLeftGrow}>
                <Icon 
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
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DATA EXPORT</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.exportContainer}>
              <View style={styles.exportHeader}>
                <Icon name="document-text" size={24} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: theme.text }]}>Export to Excel</Text>
                  <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                    Download transactions as spreadsheet
                  </Text>
                </View>
              </View>

              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerRow}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>Start Date</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
                    onPress={() => setShowStartDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateButtonText, { color: theme.text }]}>
                      {formatDateDisplay(exportStartDate)}
                    </Text>
                    <Icon name="calendar-outline" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.datePickerRow}>
                  <Text style={[styles.dateLabel, { color: theme.text }]}>End Date</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
                    onPress={() => setShowEndDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dateButtonText, { color: theme.text }]}>
                      {formatDateDisplay(exportEndDate)}
                    </Text>
                    <Icon name="calendar-outline" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.exportButton, { backgroundColor: theme.primary }]}
                onPress={handleExportToExcel}
                disabled={exporting}
                activeOpacity={0.8}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={buttonTextColor} />
                ) : (
                  <>
                    <Icon name="download" size={20} color={buttonTextColor} />
                    <Text style={[styles.exportButtonText, { color: buttonTextColor }]}>Export to Excel</Text>
                  </>
                )}
              </TouchableOpacity>
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
            
            {ENV.showDebugFeatures && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />
                <View style={styles.option}>
                  <Text style={[styles.optionText, { color: theme.text }]}>Environment</Text>
                  <Text style={[styles.versionText, { color: theme.primary }]}>
                    {ENV.config.name}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>HELP</Text>
          
          <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => setShowSetupGuide(true)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Icon name="rocket" size={24} color={theme.primary} />
                <View>
                  <Text style={[styles.optionText, { color: theme.text }]}>Tap-to-Pay Setup</Text>
                  <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                    Set up Apple Shortcuts automation
                  </Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

            <TouchableOpacity
              style={styles.option}
              onPress={() => router.push('/(tabs)/faq')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <Icon name="help-circle" size={24} color={theme.primary} />
                <View>
                  <Text style={[styles.optionText, { color: theme.text }]}>FAQ</Text>
                  <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                    How the app works
                  </Text>
                </View>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Developer Section - Visible in dev and UAT, hidden in production */}
        {ENV.showDebugFeatures && (
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
                    <Icon 
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
                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

              <TouchableOpacity
                style={styles.option}
                onPress={handleSyncRewards}
                disabled={loading}
              >
                <View style={styles.optionLeft}>
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Icon 
                      name="refresh" 
                      size={24} 
                      color={theme.primary} 
                    />
                  )}
                  <View>
                    <Text style={[styles.optionText, { color: theme.text }]}>Sync Rewards Data</Text>
                    <Text style={[styles.optionSubtext, { color: theme.textSecondary }]}>
                      Force fetch from GitHub
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Date Picker Modal */}
      {Platform.OS === 'ios' && showStartDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showStartDatePicker}
          onRequestClose={() => setShowStartDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.datePickerModal, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select Start Date</Text>
                <TouchableOpacity onPress={() => setShowStartDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: theme.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={exportStartDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setExportStartDate(selectedDate);
                  }
                }}
                textColor={theme.text}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={exportStartDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate && event.type === 'set') {
              setExportStartDate(selectedDate);
            }
          }}
        />
      )}

      {/* End Date Picker Modal */}
      {Platform.OS === 'ios' && showEndDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showEndDatePicker}
          onRequestClose={() => setShowEndDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.datePickerModal, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.datePickerHeader, { borderBottomColor: theme.cardBorder }]}>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.datePickerTitle, { color: theme.text }]}>Select End Date</Text>
                <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                  <Text style={[styles.datePickerButton, { color: theme.primary }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={exportEndDate}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setExportEndDate(selectedDate);
                  }
                }}
                textColor={theme.text}
              />
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={exportEndDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate && event.type === 'set') {
              setExportEndDate(selectedDate);
            }
          }}
        />
      )}

      <Modal
        visible={showSetupGuide}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSetupGuide(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <ShortcutsGuideStep
            onDone={() => setShowSetupGuide(false)}
            standalone
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.md,
    marginLeft: -Spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  optionLeftGrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.lg,
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
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  versionText: {
    fontSize: 16,
  },
  exportContainer: {
    padding: Spacing.xl,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  datePickerContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.sm,
    borderWidth: 1,
    minWidth: 160,
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerModal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
