import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGamification } from '@/context/GamificationContext';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { LevelProgress } from '@/components/LevelProgress';
import { BadgeDisplay } from '@/components/BadgeDisplay';
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </View>

        {/* Level Progress */}
        <View style={styles.section}>
          <LevelProgress progress={progress} />
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="trending-up" size={24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totalSaved)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Saved</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="arrow-down-circle" size={24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totalIncome)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Income</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="arrow-up-circle" size={24} color={theme.secondary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(totalExpenses)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Spent</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="flag" size={24} color={theme.accent} />
              <Text style={[styles.statValue, { color: theme.text }]}>{completedGoals}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Goals Completed</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="flame" size={24} color={theme.secondary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{progress.currentStreak}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
              <Ionicons name="trophy" size={24} color={theme.badgeGold} />
              <Text style={[styles.statValue, { color: theme.text }]}>{unlockedBadges.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Badges</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Achievements</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {unlockedBadges.length} of {progress.badges.length} unlocked
          </Text>

          {/* Unlocked Badges */}
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

          {/* Locked Badges */}
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

      {/* Badge Detail Modal */}
      <Modal
        visible={selectedBadge !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedBadge(null)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedBadge(null)}
            >
              <Ionicons name="close" size={24} color={theme.textSecondary} />
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
                  <View style={[styles.modalUnlockedBadge, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    <Text style={[styles.modalUnlockedText, { color: theme.primary }]}>
                      Unlocked on {formatDate(selectedBadge.unlockedAt)}
                    </Text>
                  </View>
                )}

                {!selectedBadge.unlocked && (
                  <View style={[styles.modalLockedBadge, { backgroundColor: theme.backgroundTertiary, borderColor: theme.cardBorder }]}>
                    <Ionicons name="lock-closed" size={20} color={theme.textTertiary} />
                    <Text style={[styles.modalLockedText, { color: theme.textSecondary }]}>
                      Keep going to unlock this achievement!
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  badgeSection: {
    marginBottom: 24,
  },
  badgeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  modalBadgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginTop: 20,
    marginBottom: 20,
  },
  modalBadgeIcon: {
    fontSize: 64,
  },
  modalBadgeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalUnlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  modalUnlockedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  modalLockedText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

