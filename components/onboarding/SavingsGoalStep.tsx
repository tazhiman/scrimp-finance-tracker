import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { ContributionFrequency } from '@/types';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { formatCurrency } from '@/utils/dateHelpers';
import { countContributionIntervals, suggestedContributionPerPeriod } from '@/utils/goalContributionSuggest';

const { width } = Dimensions.get('window');

/** Space between form groups inside the card (breathing room, not cramped). */
const FIELD_GAP = Spacing.lg;

const defaultEndDate = (): Date => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
};

const parseGoalEndDate = (iso: string): Date => {
  const parsed =
    iso.length <= 10
      ? parseISO(`${iso}T12:00:00`)
      : parseISO(iso);
  return Number.isNaN(parsed.getTime()) ? defaultEndDate() : parsed;
};

export interface GoalFormData {
  name: string;
  targetAmount: number;
  contributionAmount: number;
  frequency: ContributionFrequency;
  /** yyyy-mm-dd */
  endDate: string;
}

interface SavingsGoalStepProps {
  initialValues?: GoalFormData;
  onNext: (data: GoalFormData) => void;
  onBack?: () => void;
}

export function SavingsGoalStep({ initialValues, onNext, onBack }: SavingsGoalStepProps) {
  const { theme, themeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const [name, setName] = useState(initialValues?.name ?? '');
  const [targetAmount, setTargetAmount] = useState(
    initialValues ? String(initialValues.targetAmount) : ''
  );
  const [targetEndDate, setTargetEndDate] = useState<Date>(
    initialValues?.endDate ? parseGoalEndDate(initialValues.endDate) : defaultEndDate()
  );
  const [contributionAmount, setContributionAmount] = useState(
    initialValues ? String(initialValues.contributionAmount) : ''
  );
  const [frequency, setFrequency] = useState<ContributionFrequency>(
    initialValues?.frequency ?? 'monthly'
  );
  const [iosPickerOpen, setIosPickerOpen] = useState(false);
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

  const parsedTarget = useMemo(() => {
    const cleaned = targetAmount.replace(/,/g, '');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }, [targetAmount]);

  const suggestionMemo = useMemo(() => {
    if (parsedTarget <= 0) return null;
    const intervals = countContributionIntervals(targetEndDate, frequency);
    const amount = suggestedContributionPerPeriod(parsedTarget, targetEndDate, frequency);
    if (amount == null || intervals <= 0) return null;
    return { amount, intervals };
  }, [parsedTarget, targetEndDate, frequency]);

  const applySuggestion = () => {
    if (suggestionMemo == null) return;
    const rounded = Math.round(suggestionMemo.amount * 100) / 100;
    setContributionAmount(
      rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(2)
    );
  };

  const openDatePicker = () => {
    if (Platform.OS === 'android') setAndroidPickerOpen(true);
    else setIosPickerOpen(true);
  };

  const handleAndroidDateChange = (event: { type?: string }, date?: Date) => {
    setAndroidPickerOpen(false);
    if (event.type === 'set' && date) setTargetEndDate(date);
  };

  const handleNext = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Goal Name', 'Please give your savings goal a name.');
      return;
    }
    if (!targetAmount || parsedTarget <= 0) {
      Alert.alert('Target Amount', 'Please enter a target amount greater than zero.');
      return;
    }
    const y = targetEndDate.getFullYear();
    const mo = String(targetEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetEndDate.getDate()).padStart(2, '0');
    const endDateStr = `${y}-${mo}-${day}`;

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const endMid = new Date(targetEndDate);
    endMid.setHours(12, 0, 0, 0);
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (endMid < todayMid) {
      Alert.alert('Target Date', 'Choose a target date today or later.');
      return;
    }

    const contribution = parseFloat(contributionAmount.replace(/,/g, ''));
    if (!contributionAmount || Number.isNaN(contribution) || contribution <= 0) {
      Alert.alert('Contribution', 'Please enter how much you want to contribute each period.');
      return;
    }
    onNext({
      name: trimmedName,
      targetAmount: parsedTarget,
      contributionAmount: contribution,
      frequency,
      endDate: endDateStr,
    });
  };

  const periodAbbrev = frequency === 'weekly' ? 'wk' : 'mo';

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
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <Icon name="flag" size={30} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Your First Savings Goal</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {`Add one goal—we'll help you pace contributions for your target date.`}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Goal Name</Text>
            <TextInput
              style={[
                styles.textInput,
                { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Emergency Fund, Vacation"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Amount</Text>
            <View
              style={[
                styles.currencyRow,
                { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
              ]}
            >
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
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Target Date</Text>
            {Platform.OS === 'web' ? (
              <View
                style={[
                  styles.webDateContainer,
                  { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
                ]}
              >
                <input
                  type="date"
                  min={format(new Date(), 'yyyy-MM-dd')}
                  value={format(targetEndDate, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const next = parseISO(`${e.target.value}T12:00:00`);
                    if (!Number.isNaN(next.getTime())) setTargetEndDate(next);
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
                <Text style={[styles.dateRowText, { color: theme.text }]}>{format(targetEndDate, 'd MMM yyyy')}</Text>
                <Icon name="calendar-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.fieldBlock, { marginTop: FIELD_GAP }]}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Contribution Amount</Text>
            <View
              style={[
                styles.currencyRow,
                { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
              ]}
            >
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

            {suggestionMemo ? (
              <TouchableOpacity onPress={applySuggestion} activeOpacity={0.7} style={styles.suggestionWrap}>
                <Text style={[styles.suggestionText, { color: theme.textTertiary }]}>
                  {`${formatCurrency(suggestionMemo.amount)}/${periodAbbrev} · ~${suggestionMemo.intervals} ${
                    suggestionMemo.intervals === 1 ? 'payment' : 'payments'
                  } · `}
                  <Text style={{ color: theme.primary, fontWeight: '700' }}>Use</Text>
                </Text>
              </TouchableOpacity>
            ) : null}
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
      </ScrollView>

      <View
        style={[
          styles.bottomSection,
          {
            backgroundColor: theme.background,
            borderTopColor: theme.cardBorder,
            paddingBottom: Math.max(Spacing.lg, insets.bottom),
          },
        ]}
      >
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
          value={targetEndDate}
          mode="date"
          display="default"
          minimumDate={new Date()}
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
              value={targetEndDate}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_, d) => d && setTargetEndDate(d)}
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
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'] + Spacing.md,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    flexShrink: 0,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: -0.25,
    paddingHorizontal: Spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    opacity: 0.92,
  },
  card: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl - 2,
    paddingVertical: Spacing.xl,
    overflow: 'hidden',
  },
  fieldBlock: {},
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.65,
    marginBottom: Spacing.xs,
  },
  suggestionWrap: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  suggestionText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  textInput: {
    fontSize: 15,
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 3,
    minHeight: 44,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.sm + 2,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: Spacing.sm + 3,
    minHeight: 44,
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
    paddingVertical: Spacing.sm + 3,
    minHeight: 44,
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
    minHeight: 44,
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
    paddingTop: Spacing.md + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
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
