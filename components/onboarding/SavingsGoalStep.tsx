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
import { ContributionFrequency } from '@/types';
import { Spacing, Radius, Shadow } from '@/constants/design';

const { width } = Dimensions.get('window');

export interface GoalFormData {
  name: string;
  targetAmount: number;
  contributionAmount: number;
  frequency: ContributionFrequency;
}

interface SavingsGoalStepProps {
  onNext: (data: GoalFormData) => void;
  onBack?: () => void;
}

export function SavingsGoalStep({ onNext, onBack }: SavingsGoalStepProps) {
  const { theme, themeMode } = useTheme();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');

  const handleNext = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Goal Name', 'Please give your savings goal a name.');
      return;
    }
    const target = parseFloat(targetAmount);
    if (!targetAmount || isNaN(target) || target <= 0) {
      Alert.alert('Target Amount', 'Please enter a target amount greater than zero.');
      return;
    }
    const contribution = parseFloat(contributionAmount);
    if (!contributionAmount || isNaN(contribution) || contribution <= 0) {
      Alert.alert('Contribution', 'Please enter how much you want to contribute each period.');
      return;
    }
    onNext({
      name: trimmedName,
      targetAmount: target,
      contributionAmount: contribution,
      frequency,
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
          <Icon name="flag" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Your First Savings Goal</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Let's start scrimping by creating your very first savings goal. It can be as small or big as you would like but we need you to create it.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Goal Name</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Emergency Fund, Vacation"
            placeholderTextColor={theme.textTertiary}
            autoFocus
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Target Amount</Text>
          <View style={[styles.currencyRow, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="5,000"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Contribution Amount</Text>
          <View style={[styles.currencyRow, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={contributionAmount}
              onChangeText={setContributionAmount}
              placeholder="200"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Frequency</Text>
          <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
            <TouchableOpacity
              style={[styles.segment, frequency === 'weekly' && { backgroundColor: theme.primary }]}
              onPress={() => setFrequency('weekly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, { color: frequency === 'weekly' ? buttonTextColor : theme.textSecondary }]}>
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, frequency === 'monthly' && { backgroundColor: theme.primary }]}
              onPress={() => setFrequency('monthly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.segmentText, { color: frequency === 'monthly' ? buttonTextColor : theme.textSecondary }]}>
                Monthly
              </Text>
            </TouchableOpacity>
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
    marginBottom: 28,
    paddingHorizontal: 4,
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
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentText: {
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
