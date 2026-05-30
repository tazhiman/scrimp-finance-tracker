import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { Spacing, Radius, Shadow } from '@/constants/design';
import {
  loadSalarySkippedAt,
  clearSalarySkippedAt,
  loadSalaryReminderLastShown,
  saveSalaryReminderLastShown,
} from '@/utils/storage';

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export function SalarySetupReminder() {
  const { recurringExpenses } = useFinance();
  const { theme, themeMode } = useTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      const skippedAt = await loadSalarySkippedAt();
      if (!skippedAt) return;

      const hasSalary = recurringExpenses.some(
        r => r.category === 'salary' && (r.transactionType ?? 'expense') === 'income'
      );
      if (hasSalary) {
        await clearSalarySkippedAt();
        if (!cancelled) setVisible(false);
        return;
      }

      const lastShown = await loadSalaryReminderLastShown();
      if (lastShown) {
        const elapsed = Date.now() - new Date(lastShown).getTime();
        if (elapsed < TWO_DAYS_MS) return;
      }

      if (!cancelled) setVisible(true);
    };

    evaluate();
    return () => {
      cancelled = true;
    };
  }, [recurringExpenses]);

  const handleDismiss = async () => {
    await saveSalaryReminderLastShown(new Date().toISOString());
    setVisible(false);
  };

  const handleSetUp = async () => {
    await saveSalaryReminderLastShown(new Date().toISOString());
    setVisible(false);
    router.push('/(tabs)/transactions?openForm=true');
  };

  if (!visible) return null;

  return (
    <View style={[styles.wrapper, Shadow.medium]}>
      <View style={[styles.banner, { backgroundColor: theme.cardBackground, borderColor: theme.primary + '40' }]}>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: theme.text }]}>Set up your salary</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Add recurring income on the Transactions page so budget and savings stay accurate.
          </Text>
        </View>
        <TouchableOpacity onPress={handleDismiss} hitSlop={12} style={styles.dismissBtn}>
          <Icon name="close" size={20} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: theme.primary }]}
        onPress={handleSetUp}
        activeOpacity={0.85}
      >
        <Text style={[styles.actionText, { color: themeMode === 'dark' ? '#000505' : '#FEFCFD' }]}>
          Set up salary
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing.xl,
    right: Spacing.xl,
    bottom: 100,
    zIndex: 50,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  dismissBtn: {
    padding: Spacing.xs,
  },
  actionBtn: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
