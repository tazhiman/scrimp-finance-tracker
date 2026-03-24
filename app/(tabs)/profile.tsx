import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { formatCurrency } from '@/utils/dateHelpers';
import { Icon } from '@/components/ui/Icon';
import { BankAvatar } from '@/components/ui/BankAvatar';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalSavedInGoals,
} from '@/utils/calculations';
import { BankAccount } from '@/types';
import { loadBankAccounts, saveBankAccounts } from '@/utils/onboarding';

export default function ProfileScreen() {
  const { transactions, goals } = useFinance();
  const { theme, themeMode } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();

  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const loaded = await loadBankAccounts();
        setAccounts(loaded);
      })();
    }, [])
  );

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

    let updated: BankAccount[];
    if (editingAccount) {
      updated = accounts.map(a =>
        a.id === editingAccount.id ? { ...a, name, balance } : a
      );
    } else {
      const newAccount: BankAccount = {
        id: Date.now().toString(),
        name,
        balance,
      };
      updated = [...accounts, newAccount];
    }

    await saveBankAccounts(updated);
    setAccounts(updated);
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
            const updated = accounts.filter(a => a.id !== account.id);
            await saveBankAccounts(updated);
            setAccounts(updated);
            if (updated.length === 0) setIsEditing(false);
          },
        },
      ]
    );
  };

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const totalSaved = calculateTotalSavedInGoals(goals);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const stats = [
    { icon: 'trending-up' as const, value: formatCurrency(totalSaved), label: 'Total Saved', color: theme.primary },
    { icon: 'arrow-down-circle' as const, value: formatCurrency(totalIncome), label: 'Total Income', color: theme.primary },
    { icon: 'arrow-up-circle' as const, value: formatCurrency(totalExpenses), label: 'Total Spent', color: theme.secondary },
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
          </View>

          {accounts.length > 0 && (
            <View style={[styles.accountList, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              {accounts.map((account, idx) => (
                <React.Fragment key={account.id}>
                  <TouchableOpacity
                    style={styles.accountRow}
                    onPress={() => isEditing ? openEditModal(account) : undefined}
                    activeOpacity={isEditing ? 0.6 : 1}
                    disabled={!isEditing}
                  >
                    {isEditing && (
                      <TouchableOpacity
                        onPress={() => handleDeleteAccount(account)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon name="remove-circle" size={22} color={theme.secondary} />
                      </TouchableOpacity>
                    )}
                    <BankAvatar name={account.name} size={34} />
                    <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={[styles.accountBalance, { color: theme.text }]}>
                      {formatCurrency(account.balance)}
                    </Text>
                    {isEditing && (
                      <Icon name="chevron-forward" size={16} color={theme.textTertiary} />
                    )}
                  </TouchableOpacity>
                  {idx < accounts.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
                  )}
                </React.Fragment>
              ))}
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
  accountName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
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
