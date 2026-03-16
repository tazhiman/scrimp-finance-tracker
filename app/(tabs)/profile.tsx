import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGamification } from '@/context/GamificationContext';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { LevelProgress } from '@/components/LevelProgress';
import { BadgeDisplay } from '@/components/BadgeDisplay';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassModal } from '@/components/ui/GlassModal';
import { Spacing, Radius } from '@/constants/design';
import { formatCurrency, formatDate } from '@/utils/dateHelpers';
import { Ionicons } from '@expo/vector-icons';
import { calculateTotalIncome, calculateTotalExpenses, calculateNetSavings } from '@/utils/calculations';
import { Badge } from '@/types';

export default function ProfileScreen() {
  const { progress } = useGamification();
  const { transactions, goals } = useFinance();
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const totalSaved = calculateNetSavings(transactions);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const unlockedBadges = progress.badges.filter(b => b.unlocked);
  const lockedBadges = progress.badges.filter(b => !b.unlocked);

  const stats = [
    { icon: 'trending-up' as const, value: formatCurrency(totalSaved), label: 'Total Saved', color: theme.primary },
    { icon: 'arrow-down-circle' as const, value: formatCurrency(totalIncome), label: 'Total Income', color: theme.primary },
    { icon: 'arrow-up-circle' as const, value: formatCurrency(totalExpenses), label: 'Total Spent', color: theme.secondary },
    { icon: 'flag' as const, value: String(completedGoals), label: 'Goals Completed', color: theme.accent },
    { icon: 'flame' as const, value: String(progress.currentStreak), label: 'Day Streak', color: theme.secondary },
    { icon: 'trophy' as const, value: String(unlockedBadges.length), label: 'Badges', color: theme.badgeGold },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing['3xl'] }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        <GlassCard style={styles.levelCard} intensity="subtle" borderRadius={Radius.lg}>
          <LevelProgress progress={progress} />
        </GlassCard>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, idx) => (
              <GlassCard key={idx} style={styles.statCard} intensity="subtle">
                <View style={styles.statInner}>
                  <View style={[styles.statIconCircle, { backgroundColor: stat.color + '18' }]}>
                    <Ionicons name={stat.icon} size={20} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {unlockedBadges.length} of {progress.badges.length} unlocked
          </Text>

          {unlockedBadges.length > 0 && (
            <View style={styles.badgeSection}>
              <Text style={[styles.badgeSectionTitle, { color: theme.textSecondary }]}>Unlocked</Text>
              <View style={styles.badgeGrid}>
                {unlockedBadges.map((badge) => (
                  <BadgeDisplay
                    key={badge.id}
                    badge={badge}
                    size="medium"
                    onPress={() => setSelectedBadge(badge)}
                  />
                ))}
              </View>
            </View>
          )}

          {lockedBadges.length > 0 && (
            <View style={styles.badgeSection}>
              <Text style={[styles.badgeSectionTitle, { color: theme.textSecondary }]}>Locked</Text>
              <View style={styles.badgeGrid}>
                {lockedBadges.map((badge) => (
                  <BadgeDisplay
                    key={badge.id}
                    badge={badge}
                    size="medium"
                    onPress={() => setSelectedBadge(badge)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <GlassModal
        visible={selectedBadge !== null}
        onClose={() => setSelectedBadge(null)}
      >
        <View style={styles.badgeModalContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedBadge(null)}
          >
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>

          {selectedBadge && (
            <>
              <View style={[styles.modalBadgeContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                <Text style={styles.modalBadgeIcon}>{selectedBadge.icon}</Text>
              </View>

              <Text style={[styles.modalBadgeTitle, { color: theme.text }]}>
                {selectedBadge.name}
              </Text>

              <Text style={[styles.modalBadgeDescription, { color: theme.textSecondary }]}>
                {selectedBadge.description}
              </Text>

              {selectedBadge.unlocked && selectedBadge.unlockedAt && (
                <View style={[styles.modalStatusBadge, { backgroundColor: theme.primary + '18' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                  <Text style={[styles.modalStatusText, { color: theme.primary }]}>
                    Unlocked on {formatDate(selectedBadge.unlockedAt)}
                  </Text>
                </View>
              )}

              {!selectedBadge.unlocked && (
                <View style={[styles.modalStatusBadge, { backgroundColor: theme.backgroundTertiary }]}>
                  <Ionicons name="lock-closed" size={18} color={theme.textTertiary} />
                  <Text style={[styles.modalStatusText, { color: theme.textSecondary }]}>
                    Keep going to unlock this achievement!
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </GlassModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  levelCard: {
    marginBottom: Spacing['4xl'],
  },
  section: {
    marginBottom: Spacing['4xl'],
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
  },
  statInner: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  badgeSection: {
    marginBottom: Spacing['3xl'],
  },
  badgeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacing.lg,
  },
  badgeModalContent: {
    padding: Spacing['3xl'],
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    padding: Spacing.md,
    zIndex: 1,
  },
  modalBadgeContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing['2xl'],
  },
  modalBadgeIcon: {
    fontSize: 56,
  },
  modalBadgeTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
  },
  modalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  modalStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
