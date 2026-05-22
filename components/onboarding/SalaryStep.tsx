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
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { RecurrenceFrequency } from '@/types';
import { Spacing, Radius, Shadow } from '@/constants/design';

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

const FIELD_GAP = Spacing.md;

export function SalaryStep({ linkedAccountName, initialValues, onNext, onSkip, onBack }: SalaryStepProps) {
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
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
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

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

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      setAndroidPickerOpen(true);
    } else {
      setIosPickerOpen(true);
    }
  };

  const handleAndroidDateChange = (event: { type?: string }, date?: Date) => {
    setAndroidPickerOpen(false);
    if (event.type === 'set' && date) setPayDay(date);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { width }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
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

      {/* Single-screen layout — no ScrollView */}
      <View style={styles.body}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <Icon name="wallet-outline" size={36} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Set Up Your Salary</Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.textSecondary },
              linkedAccountName ? { marginBottom: Spacing.sm + 4 } : { marginBottom: Spacing['2xl'] + Spacing.sm },
            ]}
          >
            Add your recurring income so we can estimate monthly budget and savings pace.
          </Text>

          {linkedAccountName ? (
            <View
              style={[
                styles.accountBadge,
                { backgroundColor: theme.primary + '14', borderColor: theme.primary + '30', marginBottom: Spacing.md + Spacing.sm },
              ]}
            >
              <Icon name="wallet-outline" size={16} color={theme.primary} />
              <Text style={[styles.accountBadgeText, { color: theme.primary }]} numberOfLines={1}>
                {linkedAccountName}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Salary Amount</Text>
            <View
              style={[
                styles.currencyRow,
                { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
              ]}
            >
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
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name (Optional)</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Monthly salary"
              placeholderTextColor={theme.textTertiary}
            />
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Pay Day</Text>
            <Text style={[styles.fieldHint, { color: theme.textTertiary }]}>
              When you usually get paid each period.
            </Text>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.webDateContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
                ]}
              >
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
              <TouchableOpacity
                onPress={openDatePicker}
                activeOpacity={0.75}
                style={[
                  styles.dateRow,
                  { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Text style={[styles.dateRowText, { color: theme.text }]}>{format(payDay, 'd MMM yyyy')}</Text>
                <Icon name="calendar-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Frequency</Text>
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
        </View>
      </View>

      <View style={[styles.bottomSection, { paddingBottom: Math.max(Spacing.lg, insets.bottom) }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: theme.primary }, Shadow.medium]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>Continue</Text>
        </TouchableOpacity>
      </View>

      {androidPickerOpen ? (
        <DateTimePicker
          value={payDay}
          mode="date"
          display="default"
          onChange={handleAndroidDateChange}
          themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
        />
      ) : null}

      <Modal
        visible={iosPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIosPickerOpen(false)}
      >
        <View style={styles.iosModalRoot}>
          <Pressable style={styles.iosModalBackdropFill} onPress={() => setIosPickerOpen(false)} />
          <View
            style={[
              styles.iosModalSheet,
              { backgroundColor: theme.cardBackground, paddingBottom: Spacing.xl + insets.bottom },
            ]}
          >
            <View style={styles.iosModalHeader}>
              <TouchableOpacity onPress={() => setIosPickerOpen(false)} hitSlop={12}>
                <Text style={[styles.iosModalDone, { color: theme.primary }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={payDay}
              mode="date"
              display="spinner"
              onChange={(_, d) => d && setPayDay(d)}
              themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
              style={styles.iosSpinner}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    minHeight: 44,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.md,
    justifyContent: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm + 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xs,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: '100%',
    alignSelf: 'center',
  },
  accountBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  card: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl + 2,
    flexShrink: 0,
  },
  fieldBlock: {},
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs + 2,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.sm,
    marginTop: -2,
  },
  textInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 5,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 5,
    minHeight: 48,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: Spacing.xs,
  },
  currencyValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 5,
    minHeight: 48,
  },
  dateRowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  webDateContainer: {
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: Radius.sm + 2,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSection: {
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.sm,
  },
  nextButton: {
    paddingVertical: Spacing.xl - 2,
    borderRadius: Radius.md + 2,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
  iosModalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  iosModalBackdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,5,0.45)',
  },
  iosModalSheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingTop: Spacing.sm,
    overflow: 'hidden',
  },
  iosModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  iosModalDone: {
    fontSize: 17,
    fontWeight: '700',
  },
  iosSpinner: {
    height: 200,
    width: '100%',
  },
});
