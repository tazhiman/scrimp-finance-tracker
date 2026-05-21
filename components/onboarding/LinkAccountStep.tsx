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
  Alert,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { BankAccount } from '@/types';
import { Shadow } from '@/constants/design';

const { width } = Dimensions.get('window');

export interface LinkAccountResult {
  account: BankAccount;
  existingSavings: number;
}

interface LinkAccountStepProps {
  goalName: string;
  initialValues?: LinkAccountResult;
  onNext: (result: LinkAccountResult) => void;
  onBack?: () => void;
}

export function LinkAccountStep({ goalName, initialValues, onNext, onBack }: LinkAccountStepProps) {
  const { theme, themeMode } = useTheme();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const [accountName, setAccountName] = useState(initialValues?.account.name ?? '');
  const [balance, setBalance] = useState(
    initialValues != null ? String(initialValues.account.balance) : ''
  );
  const [existingSavings, setExistingSavings] = useState(
    initialValues != null ? String(initialValues.existingSavings) : '0'
  );

  const handleNext = () => {
    const trimmedName = accountName.trim();
    if (!trimmedName) {
      Alert.alert('Account Name', 'Please enter your bank account name.');
      return;
    }
    const bal = parseFloat(balance);
    if (!balance || isNaN(bal)) {
      Alert.alert('Balance', 'Please enter your current account balance.');
      return;
    }
    const savings = parseFloat(existingSavings) || 0;
    if (savings < 0) {
      Alert.alert('Savings', 'Existing savings cannot be negative.');
      return;
    }

    onNext({
      account: {
        id: initialValues?.account.id ?? `acct-${Date.now()}`,
        name: trimmedName,
        balance: bal,
      },
      existingSavings: savings,
    });
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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
          <Icon name="link" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Link a Bank Account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Now let's link a bank account to your savings goal so we can track your progress.
        </Text>

        <View style={[styles.goalBadge, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '30' }]}>
          <Icon name="flag" size={16} color={theme.primary} />
          <Text style={[styles.goalBadgeText, { color: theme.primary }]} numberOfLines={1}>
            {goalName}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Account Name</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g. DBS Savings, OCBC 360"
            placeholderTextColor={theme.textTertiary}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Current Account Balance</Text>
          <View style={[styles.currencyRow, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={balance}
              onChangeText={setBalance}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Existing Savings for This Goal</Text>
          <Text style={[styles.fieldHint, { color: theme.textTertiary }]}>
            Already saved something towards this goal? Enter it here.
          </Text>
          <View style={[styles.currencyRow, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={existingSavings}
              onChangeText={setExistingSavings}
              placeholder="0.00"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }, Shadow.medium]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>Continue</Text>
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
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    maxWidth: '90%',
  },
  goalBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
  },
  card: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
    marginTop: -4,
  },
  textInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  currencyValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
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
