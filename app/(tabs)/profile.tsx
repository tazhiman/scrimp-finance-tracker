import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { useBankAccounts } from '@/context/BankAccountsContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { formatCurrency, formatRelativeTime, daysSince } from '@/utils/dateHelpers';
import { Icon } from '@/components/ui/Icon';
import { BankAvatar } from '@/components/ui/BankAvatar';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalSavedInGoals,
  getCombinedTransactionsByPeriod,
} from '@/utils/calculations';
import { BankAccount } from '@/types';

const STALE_THRESHOLD_DAYS = 14;
const JUST_CONFIRMED_MS = 60 * 60 * 1000;

const isJustConfirmed = (account: BankAccount): boolean => {
  if (!account.lastUpdated) return false;
  return Date.now() - new Date(account.lastUpdated).getTime() < JUST_CONFIRMED_MS;
};

export default function ProfileScreen() {
  const { transactions, goals, recurringExpenses } = useFinance();
  const { theme, themeMode } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const { accounts, addAccount, updateAccount, deleteAccount, confirmBalance } =
    useBankAccounts();

  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const [isEditing, setIsEditing] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');

  const [confirmAnim] = useState(() => new Animated.Value(1));

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const openAddModal = () => {
    setEditingAccount(null);
    setAccountName('');
    setAccountBalance('');
    setAccountModalVisible(true);
  };

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setAccountBalance(account.balance.toString());
    setAccountModalVisible(true);
  };

  const handleSaveAccount = async () => {
    const name = accountName.trim();
    if (!name) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }
    const balance = parseFloat(accountBalance);
    if (isNaN(balance)) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    if (editingAccount) {
      await updateAccount(editingAccount.id, { name, balance });
    } else {
      await addAccount(name, balance);
    }

    setAccountModalVisible(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (account: BankAccount) => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to remove "${account.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount(account.id);
            if (accounts.length <= 1) setIsEditing(false);
          },
        },
      ]
    );
  };

  const handleConfirmBalance = async (account: BankAccount) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.sequence([
      Animated.spring(confirmAnim, { toValue: 1.35, useNativeDriver: true, speed: 50, bounciness: 12 }),
      Animated.spring(confirmAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 8 }),
    ]).start();
    await confirmBalance(account.id);
  };

  const isStale = (account: BankAccount) =>
    !account.lastUpdated || daysSince(account.lastUpdated) > STALE_THRESHOLD_DAYS;

  const monthlyTransactions = useMemo(
    () => getCombinedTransactionsByPeriod(transactions, recurringExpenses, 'month'),
    [transactions, recurringExpenses]
  );
  const totalIncome = calculateTotalIncome(monthlyTransactions);
  const totalExpenses = calculateTotalExpenses(monthlyTransactions);
  const totalSaved = calculateTotalSavedInGoals(goals);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const stats = [
    { icon: 'trending-up' as const, value: formatCurrency(totalSaved), label: 'Total Saved', color: theme.primary },
    { icon: 'arrow-down-circle' as const, value: formatCurrency(totalIncome), label: 'Monthly Income', color: theme.primary },
    { icon: 'arrow-up-circle' as const, value: formatCurrency(totalExpenses), label: 'Monthly Spent', color: theme.secondary },
    { icon: 'flag' as const, value: String(completedGoals), label: 'Goals Achieved', color: theme.accent },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing['3xl'] }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        {/* Account Balances */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Accounts</Text>
            {accounts.length > 0 && (
              <TouchableOpacity onPress={() => setIsEditing(v => !v)} activeOpacity={0.7}>
                <Text style={[styles.editToggle, { color: theme.primary }]}>
                  {isEditing ? 'Done' : 'Edit'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.totalCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Balance</Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>
              {formatCurrency(totalBalance)}
            </Text>
            {accounts.some(a => !isJustConfirmed(a)) && (
              <Text style={[styles.totalHint, { color: theme.textTertiary }]}>
                Tap a row to edit · tap the checkmark to confirm
              </Text>
            )}
          </View>

          {accounts.length > 0 && (
            <View style={[styles.accountList, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              {accounts.map((account, idx) => {
                const stale = isStale(account);
                return (
                  <React.Fragment key={account.id}>
                    <View style={styles.accountRow}>
                      {isEditing && (
                        <TouchableOpacity
                          onPress={() => handleDeleteAccount(account)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Icon name="remove-circle" size={22} color={theme.secondary} />
                        </TouchableOpacity>
                      )}
                      <BankAvatar name={account.name} size={34} />
                      <TouchableOpacity
                        style={styles.accountInfo}
                        onPress={() => openEditModal(account)}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                          {account.name}
                        </Text>
                        <View style={styles.stalenessRow}>
                          <Text style={[styles.lastUpdatedText, { color: theme.textTertiary }]}>
                            {formatRelativeTime(account.lastUpdated)}
                          </Text>
                          {stale && (
                            <View style={[styles.stalePill, { backgroundColor: theme.warningOrange + '28' }]}>
                              <Text style={[styles.stalePillText, { color: theme.warningOrange }]}>Stale</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                      <Text style={[styles.accountBalance, { color: theme.text }]}>
                        {formatCurrency(account.balance)}
                      </Text>
                      {!isJustConfirmed(account) && (
                        <Animated.View style={{ transform: [{ scale: confirmAnim }], marginLeft: Spacing.lg }}>
                          <TouchableOpacity
                            onPress={() => handleConfirmBalance(account)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={[
                              styles.confirmBtn,
                              { backgroundColor: stale ? theme.warningOrange + '22' : theme.primary + '18' },
                            ]}
                          >
                            <Icon
                              name="checkmark-circle"
                              size={22}
                              color={stale ? theme.warningOrange : theme.primary}
                            />
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </View>
                    {idx < accounts.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          )}

          <TouchableOpacity
            style={[styles.addAccountBtn, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <Icon name="add-circle-outline" size={22} color={theme.primary} />
            <Text style={[styles.addAccountText, { color: theme.primary }]}>Add Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistics</Text>
          </View>
          <View style={styles.statsColumn}>
            {stats.map((stat, idx) => (
              <GlassCard key={idx} style={styles.statCard} intensity="subtle">
                <View style={styles.statInner}>
                  <View style={[styles.statIconCircle, { backgroundColor: stat.color + '18' }]}>
                    <Icon name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <View style={styles.statTextBlock}>
                    <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Add / Edit Account Modal */}
      <Modal
        visible={accountModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAccountModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={styles.modalHeaderBtn}>
              <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingAccount ? 'Edit Account' : 'Add Account'}
            </Text>
            <View style={styles.modalHeaderBtn} />
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Account Name</Text>
            <TextInput
              style={[
                styles.fieldInput,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="e.g. DBS Savings"
              placeholderTextColor={theme.textTertiary}
              autoFocus={!editingAccount}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: Spacing.xl }]}>Balance</Text>
            <TextInput
              style={[
                styles.fieldInput,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text },
              ]}
              value={accountBalance}
              onChangeText={setAccountBalance}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
              autoFocus={!!editingAccount}
            />

            <Text style={[styles.balanceHint, { color: theme.textTertiary }]}>
              Saving a new balance marks it as confirmed and resets the staleness timer.
            </Text>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }, Shadow.medium]}
              onPress={handleSaveAccount}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveBtnText, { color: buttonTextColor }]}>
                {editingAccount ? 'Save Changes' : 'Add Account'}
              </Text>
            </TouchableOpacity>

            {editingAccount && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  setAccountModalVisible(false);
                  setTimeout(() => handleDeleteAccount(editingAccount), 350);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteBtnText, { color: theme.secondary }]}>Delete Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  editToggle: {
    fontSize: 15,
    fontWeight: '600',
  },

  totalCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: Spacing.sm,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  totalHint: {
    fontSize: 11,
    marginTop: Spacing.sm,
  },

  accountList: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  stalenessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  lastUpdatedText: {
    fontSize: 11,
  },
  stalePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  stalePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmBtn: {
    borderRadius: Radius.full,
    padding: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing.xl + 34 + Spacing.md,
  },

  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addAccountText: {
    fontSize: 15,
    fontWeight: '600',
  },

  section: {
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsColumn: {
    gap: Spacing.md,
    width: '100%',
  },
  statCard: {
    width: '100%',
    alignSelf: 'stretch',
  },
  statInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  statTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'left',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderBtn: {
    width: 60,
    paddingVertical: Spacing.xs,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalBody: {
    padding: Spacing.xl,
    paddingTop: Spacing['3xl'],
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldInput: {
    borderRadius: Radius.md,
    padding: Spacing.xl,
    fontSize: 16,
    borderWidth: 1,
  },
  balanceHint: {
    fontSize: 12,
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  saveBtn: {
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: Spacing['3xl'],
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
