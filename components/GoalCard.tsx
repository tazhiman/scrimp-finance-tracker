import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SavingsGoal } from '@/types';
import { calculateGoalProgress, getContributionStatus } from '@/utils/calculations';
import { formatCurrency } from '@/utils/dateHelpers';
import { useTheme } from '@/context/ThemeContext';
import { ProgressRing } from './ProgressRing';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { Ionicons } from '@expo/vector-icons';

interface GoalCardProps {
  goal: SavingsGoal;
  onPress?: () => void;
  onContribute?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress, onContribute }) => {
  const { theme, themeMode } = useTheme();
  const progress = calculateGoalProgress(goal);
  const remaining = goal.targetAmount - goal.currentAmount;
  const contributionStatus = getContributionStatus(goal);
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  
  const getStatusConfig = () => {
    if (remaining <= 0) {
      return { icon: 'checkmark-circle' as const, text: 'Goal Reached', color: theme.primary };
    }
    switch (contributionStatus) {
      case 'completed':
        return { icon: 'checkmark-circle' as const, text: 'Paid this ' + (goal.frequency === 'weekly' ? 'week' : 'month'), color: theme.primary };
      case 'overdue':
        return { icon: 'alert-circle' as const, text: 'Overdue', color: theme.error };
      case 'due':
        return { icon: 'time' as const, text: 'Due this ' + (goal.frequency === 'weekly' ? 'week' : 'month'), color: theme.warningOrange };
    }
  };
  
  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassCard style={styles.card} intensity="subtle" borderRadius={Radius.lg}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: theme.text }]}>{goal.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '18' }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
            </View>
          </View>
          <Text style={[styles.target, { color: theme.textSecondary }]}>
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
          </Text>
          
          <View style={styles.progressContainer}>
            <ProgressRing
              progress={progress}
              size={80}
              strokeWidth={8}
              color={theme.ringGreen}
              showPercentage={true}
            />
          </View>

          <View style={styles.footer}>
            <View style={[styles.frequencyBadge, { backgroundColor: theme.backgroundTertiary }]}>
              <Text style={[styles.frequencyText, { color: theme.textSecondary }]}>
                {goal.frequency.charAt(0).toUpperCase() + goal.frequency.slice(1)}
              </Text>
            </View>
            {remaining > 0 && (
              <TouchableOpacity
                style={[styles.contributeButton, { backgroundColor: theme.primary }, Shadow.small]}
                onPress={onContribute}
                activeOpacity={0.7}
              >
                <Text style={[styles.contributeText, { color: buttonTextColor }]}>Contribute</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  content: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginLeft: Spacing.md,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  target: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  frequencyBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contributeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
  },
  contributeText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
