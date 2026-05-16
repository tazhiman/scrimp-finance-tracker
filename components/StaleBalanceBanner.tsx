import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { Spacing, Radius } from '@/constants/design';

interface StaleBalanceBannerProps {
  staleCount: number;
  onReview: () => void;
  onDismiss: () => void;
}

export function StaleBalanceBanner({ staleCount, onReview, onDismiss }: StaleBalanceBannerProps) {
  const { theme } = useTheme();

  const body =
    staleCount === 1
      ? "1 account hasn't been confirmed in 14+ days. Quick check?"
      : `${staleCount} accounts haven't been confirmed in 14+ days. Quick check?`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.warningOrange + '55',
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.warningOrange + '22' }]}>
        <Icon name="wallet-outline" size={20} color={theme.warningOrange} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: theme.text }]}>Reconcile your balances</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onReview} activeOpacity={0.7} style={[styles.reviewBtn, { backgroundColor: theme.warningOrange }]}>
          <Text style={[styles.reviewBtnText, { color: '#fff' }]}>Review</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="close" size={18} color={theme.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  reviewBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
