import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useFinance } from '@/context/FinanceContext';
import { useBankAccounts } from '@/context/BankAccountsContext';
import { useTheme } from '@/context/ThemeContext';
import { evaluateGoalReserve } from '@/utils/goalReserve';
import { GoalReserveStatus } from '@/types';
import { ProgressRing } from '@/components/ProgressRing';
import { calculateGoalProgress } from '@/utils/calculations';
import { formatCurrency, formatDate } from '@/utils/dateHelpers';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { goals, transactions, deleteGoal, deleteContribution } = useFinance();
  const { accounts } = useBankAccounts();
  const { theme, themeMode } = useTheme();

  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const linkedAccount = useMemo(
    () => (goal?.linkedAccountId ? accounts.find(a => a.id === goal.linkedAccountId) : undefined),
    [goal?.linkedAccountId, accounts]
  );

  const reserveStatus: GoalReserveStatus | null = useMemo(() => {
    if (!goal?.linkedAccountId) return null;
    return evaluateGoalReserve(goal, transactions);
  }, [goal, transactions]);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.text} />
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

  const handleDeleteContribution = (contributionDate: string, contributionAmount: number) => {
    Alert.alert(
      'Remove contribution',
      `Remove ${formatCurrency(contributionAmount)} from this goal's history? Your saved balance will decrease by the same amount.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteContribution(goal.id, contributionDate, contributionAmount),
        },
      ]
    );
  };

  const renderContribution = ({ item }: { item: { date: string; amount: number } }) => (
    <View style={[styles.contributionCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
      <View style={styles.contributionLeft}>
        <View style={[styles.contributionIcon, { backgroundColor: theme.primary + '20' }]}>
          <Icon name="arrow-up" size={18} color={theme.primary} />
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
      <View style={styles.contributionRight}>
        <Text style={[styles.contributionAmount, { color: theme.primary }]}>
          +{formatCurrency(item.amount)}
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteContribution(item.date, item.amount)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove contribution of ${formatCurrency(item.amount)}`}
        >
          <Icon name="trash-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="wallet-outline" size={48} color={theme.textTertiary} />
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
          <Icon name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {goal.name}
        </Text>
        {isGoalReached ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.editButton}
          >
            <Icon name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push(`/goals?editGoalId=${id}`)}
            style={styles.editButton}
          >
            <Icon name="create-outline" size={24} color={theme.primary} />
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
              animated
            />
          </View>

          {remaining > 0 && (
            <View style={[styles.remainingBadge, { backgroundColor: theme.backgroundTertiary }]}>
              <Icon name="flag-outline" size={16} color={theme.textSecondary} />
              <Text style={[styles.remainingText, { color: theme.textSecondary }]}>
                {formatCurrency(remaining)} remaining
              </Text>
            </View>
          )}

          {remaining <= 0 && (
            <View style={[styles.completeBadge, { backgroundColor: theme.primary + '20' }]}>
              <Icon name="checkmark-circle" size={20} color={theme.primary} />
              <Text style={[styles.completeText, { color: theme.primary }]}>
                Goal Reached! 🎉
              </Text>
            </View>
          )}

          {linkedAccount && (
            <View style={[styles.linkedRow, { backgroundColor: theme.backgroundTertiary }]}>
              <Icon name="wallet-outline" size={16} color={theme.primary} />
              <Text style={[styles.linkedText, { color: theme.textSecondary }]}>
                Linked: {linkedAccount.name}
              </Text>
            </View>
          )}

          {reserveStatus && reserveStatus !== 'ok' && (
            <View
              style={[
                styles.reserveBadge,
                {
                  backgroundColor:
                    reserveStatus === 'negated' ? theme.error + '20' : theme.warningOrange + '20',
                },
              ]}
            >
              <Icon
                name="alert-circle-outline"
                size={18}
                color={reserveStatus === 'negated' ? theme.error : theme.warningOrange}
              />
              <Text
                style={[
                  styles.reserveText,
                  { color: reserveStatus === 'negated' ? theme.error : theme.warningOrange },
                ]}
              >
                {reserveStatus === 'negated'
                  ? 'Linked account spending has negated your earmarked savings'
                  : 'Linked account spending is nearing your earmarked amount'}
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
  linkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  linkedText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  reserveBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  reserveText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
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
    flex: 1,
  },
  contributionRight: {
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
