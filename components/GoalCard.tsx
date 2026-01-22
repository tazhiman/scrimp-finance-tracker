import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SavingsGoal } from '@/types';
import { calculateGoalProgress, getContributionStatus } from '@/utils/calculations';
import { formatCurrency } from '@/utils/dateHelpers';
import { useTheme } from '@/context/ThemeContext';
import { ProgressRing } from './ProgressRing';
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
  
  // In dark mode, use black text on the light colored button for better contrast
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  
  // Determine status badge styling
  const getStatusConfig = () => {
    if (remaining <= 0) {
      return {
        icon: 'checkmark-circle' as const,
        text: 'Goal Reached',
        color: theme.primary,
        bgColor: theme.backgroundTertiary,
      };
    }
    
    switch (contributionStatus) {
      case 'completed':
        return {
          icon: 'checkmark-circle' as const,
          text: 'Paid this ' + (goal.frequency === 'weekly' ? 'week' : 'month'),
          color: theme.primary,
          bgColor: theme.backgroundTertiary,
        };
      case 'overdue':
        return {
          icon: 'alert-circle' as const,
          text: 'Overdue',
          color: theme.error,
          bgColor: theme.backgroundTertiary,
        };
      case 'due':
        return {
          icon: 'time' as const,
          text: 'Due this ' + (goal.frequency === 'weekly' ? 'week' : 'month'),
          color: '#FF9500', // Orange
          bgColor: theme.backgroundTertiary,
        };
    }
  };
  
  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.text }]}>{goal.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
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
              style={[styles.contributeButton, { backgroundColor: theme.primary }]}
              onPress={onContribute}
              activeOpacity={0.7}
            >
              <Text style={[styles.contributeText, { color: buttonTextColor }]}>Contribute</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  content: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  target: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  frequencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contributeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  contributeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

