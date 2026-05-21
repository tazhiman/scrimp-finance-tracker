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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { RecurrenceFrequency } from '@/types';
import { Shadow } from '@/constants/design';

const { width } = Dimensions.get('window');

const defaultPayDay = (): Date => {
  const d = new Date();
  d.setDate(1);
  d.setHours(12, 0, 0, 0);
  return d;
};

export interface SalaryFormData {
  amount: number;
  startDate: string;
  frequency: RecurrenceFrequency;
  title: string;
}

const parsePayDay = (startDate: string): Date => {
  const parsed = new Date(`${startDate}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? defaultPayDay() : parsed;
};

interface SalaryStepProps {
  linkedAccountName?: string;
  initialValues?: SalaryFormData;
  onNext: (data: SalaryFormData) => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function SalaryStep({ linkedAccountName, initialValues, onNext, onSkip, onBack }: SalaryStepProps) {
  const { theme, themeMode } = useTheme();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const [amount, setAmount] = useState(
    initialValues ? String(initialValues.amount) : ''
  );
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    initialValues?.frequency ?? 'monthly'
  );
  const [payDay, setPayDay] = useState<Date>(
    initialValues ? parsePayDay(initialValues.startDate) : defaultPayDay()
  );

  const handleNext = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert('Salary Amount', 'Please enter your salary amount greater than zero.');
      return;
    }

    const y = payDay.getFullYear();
    const mo = String(payDay.getMonth() + 1).padStart(2, '0');
    const day = String(payDay.getDate()).padStart(2, '0');

    onNext({
      amount: parsed,
      startDate: `${y}-${mo}-${day}`,
      frequency,
      title: title.trim() || 'Monthly salary',
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
          <Icon name="cash" size={36} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Set Up Your Salary</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Add your recurring income so we can estimate monthly budget and savings pace.
        </Text>

        {linkedAccountName ? (
          <View style={[styles.accountBadge, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '30' }]}>
            <Icon name="wallet-outline" size={16} color={theme.primary} />
            <Text style={[styles.accountBadgeText, { color: theme.primary }]} numberOfLines={1}>
              {linkedAccountName}
            </Text>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Salary Amount</Text>
          <View style={[styles.currencyRow, { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}>
            <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
            <TextInput
              style={[styles.currencyValue, { color: theme.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="5,000"
              placeholderTextColor={theme.textTertiary}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Name (Optional)</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Monthly salary"
            placeholderTextColor={theme.textTertiary}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 16 }]}>Pay Day</Text>
          <Text style={[styles.fieldHint, { color: theme.textTertiary }]}>
            The day you usually receive your paycheck each period.
          </Text>
          {Platform.OS === 'web' ? (
            <View style={[styles.webDateContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
              <input
                type="date"
                value={payDay.toISOString().split('T')[0]}
                onChange={(e) => {
                  const next = new Date(e.target.value);
                  if (!Number.isNaN(next.getTime())) setPayDay(next);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: theme.text,
                  fontSize: 16,
                  fontFamily: 'inherit',
                  width: '100%',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </View>
          ) : (
            <View style={[styles.datePickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
              <DateTimePicker
                value={payDay}
                mode="date"
                display="default"
                onChange={(_, d) => d && setPayDay(d)}
                themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
              />
            </View>
          )}

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
  skipText: {
    fontSize: 15,
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
  accountBadge: {
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
  accountBadgeText: {
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
  webDateContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
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
