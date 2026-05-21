import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { BankAccount } from '@/types';

const { width } = Dimensions.get('window');

type BankAccountFormRow = { id: string; name: string; balance: string };

const toFormRows = (initialAccounts?: BankAccount[]): BankAccountFormRow[] => {
  if (initialAccounts && initialAccounts.length > 0) {
    return initialAccounts.map(a => ({
      id: a.id,
      name: a.name,
      balance: String(a.balance),
    }));
  }
  return [{ id: `acct-${Date.now()}`, name: '', balance: '' }];
};

interface BankAccountStepProps {
  initialAccounts?: BankAccount[];
  onNext: (accounts: BankAccount[]) => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function BankAccountStep({ initialAccounts, onNext, onSkip, onBack }: BankAccountStepProps) {
  const { theme, themeMode } = useTheme();
  const [accounts, setAccounts] = useState<BankAccountFormRow[]>(() => toFormRows(initialAccounts));

  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const updateAccount = (id: string, field: 'name' | 'balance', value: string) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addAccount = () => {
    setAccounts(prev => [...prev, { id: `acct-${Date.now()}`, name: '', balance: '' }]);
  };

  const removeAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const validAccounts = accounts.filter(a => a.name.trim() && parseFloat(a.balance) >= 0);

  const handleNext = () => {
    const result: BankAccount[] = validAccounts.map(a => ({
      id: a.id,
      name: a.name.trim(),
      balance: parseFloat(a.balance) || 0,
    }));
    onNext(result);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { width }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, { color: theme.primary }]}>Skip for Now</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
          <Icon name="wallet" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Bank Accounts</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Add your bank accounts and their current balance to track your finances.
        </Text>

        {accounts.map((account, index) => (
          <View key={account.id} style={[styles.accountCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
            <View style={styles.accountHeader}>
              <Text style={[styles.accountLabel, { color: theme.textSecondary }]}>Account {index + 1}</Text>
              {accounts.length > 1 && (
                <TouchableOpacity onPress={() => removeAccount(account.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="close-circle" size={22} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              style={[styles.nameInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}
              value={account.name}
              onChangeText={(v) => updateAccount(account.id, 'name', v)}
              placeholder="Account name (e.g. Checking, Savings)"
              placeholderTextColor={theme.textTertiary}
            />

            <View style={[styles.balanceInput, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
              <TextInput
                style={[styles.balanceValue, { color: theme.text }]}
                value={account.balance}
                onChangeText={(v) => updateAccount(account.id, 'balance', v)}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.addButton, { borderColor: theme.cardBorder }]}
          onPress={addAccount}
          activeOpacity={0.7}
        >
          <Icon name="add" size={22} color={theme.primary} />
          <Text style={[styles.addButtonText, { color: theme.primary }]}>Add Another Account</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>
            {validAccounts.length > 0 ? 'Continue' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  accountCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  balanceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  balanceValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
