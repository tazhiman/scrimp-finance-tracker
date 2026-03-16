import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProgress } from '@/types';
import { calculateXPForLevel, calculateXPProgress } from '@/utils/gamification';
import { useTheme } from '@/context/ThemeContext';
import { ProgressRing } from './ProgressRing';
import { Spacing } from '@/constants/design';

interface LevelProgressProps {
  progress: UserProgress;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ progress }) => {
  const { theme } = useTheme();
  const xpProgress = calculateXPProgress(progress.xp, progress.level);
  const xpForCurrentLevel = calculateXPForLevel(progress.level);
  const xpForNextLevel = calculateXPForLevel(progress.level + 1);
  const xpInCurrentLevel = progress.xp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  return (
    <View style={styles.container}>
      <View style={styles.levelContainer}>
        <Text style={[styles.levelLabel, { color: theme.textSecondary }]}>Level</Text>
        <Text style={[styles.levelNumber, { color: theme.text }]}>{progress.level}</Text>
      </View>
      
      <ProgressRing
        progress={xpProgress}
        size={100}
        strokeWidth={10}
        color={theme.ringBlue}
        showPercentage={false}
      />

      <View style={styles.xpInfo}>
        <Text style={[styles.xpText, { color: theme.text }]}>
          {xpInCurrentLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
        </Text>
        <Text style={[styles.totalXP, { color: theme.textSecondary }]}>
          Total: {progress.xp.toLocaleString()} XP
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  xpInfo: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  totalXP: {
    fontSize: 14,
    fontWeight: '500',
  },
});
