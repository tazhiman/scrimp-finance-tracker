import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserProgress } from '@/types';
import { calculateXPForLevel, calculateXPProgress } from '@/utils/gamification';
import { useTheme } from '@/context/ThemeContext';
import { ProgressRing } from './ProgressRing';

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
    padding: 20,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  xpInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalXP: {
    fontSize: 14,
  },
});

