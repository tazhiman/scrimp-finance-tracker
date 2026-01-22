import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { ProgressRing } from '@/components/ProgressRing';
import { calculateGoalProgress } from '@/utils/calculations';
import { formatCurrency, formatDate } from '@/utils/dateHelpers';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goals, deleteGoal } = useFinance();
  const { theme, themeMode } = useTheme();

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Goal Not Found</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>
    );
  }

  const progress = calculateGoalProgress(goal);
  const remaining = goal.targetAmount - goal.currentAmount;
  const isGoalReached = remaining <= 0;
  const contributions = goal.contributions || [];
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteGoal(goal.id);
            router.back();
          },
        },
      ]
    );
  };

  const renderContribution = ({ item }: { item: { date: string; amount: number } }) => (
    <View style={[styles.contributionCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.contributionLeft}>
        <View style={[styles.contributionIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons name="arrow-up" size={18} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.contributionDate, { color: theme.text }]}>
            {formatDate(new Date(item.date))}
          </Text>
          <Text style={[styles.contributionTime, { color: theme.textSecondary }]}>
            {new Date(item.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      <Text style={[styles.contributionAmount, { color: theme.primary }]}>
        +{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="wallet-outline" size={48} color={theme.textTertiary} />
      <Text style={[styles.emptyText, { color: theme.text }]}>No contributions yet</Text>
      <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
        Start contributing to reach your goal
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {goal.name}
        </Text>
        {isGoalReached ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.editButton}
          >
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push(`/goals?editGoalId=${id}`)}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.progressSection}>
        <View style={[styles.progressCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Current Progress</Text>
              <Text style={[styles.progressAmount, { color: theme.text }]}>
                {formatCurrency(goal.currentAmount)}
              </Text>
              <Text style={[styles.progressTarget, { color: theme.textSecondary }]}>
                of {formatCurrency(goal.targetAmount)}
              </Text>
            </View>
            <ProgressRing
              progress={progress}
              size={120}
              strokeWidth={12}
              color={theme.ringGreen}
              showPercentage={true}
            />
          </View>

          {remaining > 0 && (
            <View style={[styles.remainingBadge, { backgroundColor: theme.backgroundTertiary }]}>
              <Ionicons name="flag-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
                {formatCurrency(remaining)} remaining
              </Text>
            </View>
          )}

          {remaining <= 0 && (
            <View style={[styles.completeBadge, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
              <Text style={[styles.completeText, { color: theme.primary }]}>
                Goal Reached! 🎉
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.contributionsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Contribution History</Text>
        <FlatList
          data={sortedContributions}
          renderItem={renderContribution}
          keyExtractor={(item, index) => `${item.date}-${index}`}
          contentContainerStyle={
            sortedContributions.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  editButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  progressSection: {
    padding: 16,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressTarget: {
    fontSize: 16,
  },
  remainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  contributionsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  contributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contributionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributionDate: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  contributionTime: {
    fontSize: 12,
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
