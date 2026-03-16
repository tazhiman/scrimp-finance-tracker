import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { GoalCard } from '@/components/GoalCard';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { Spacing, Radius, Shadow } from '@/constants/design';
import { SavingsGoal, ContributionFrequency } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { calculateRecommendedContribution } from '@/utils/calculations';
import { formatCurrency, formatDate } from '@/utils/dateHelpers';

export default function GoalsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal } = useFinance();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, themeMode } = useTheme();
  
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    return defaultDate;
  });

  useEffect(() => {
    if (params.editGoalId) {
      const goalToEdit = goals.find(g => g.id === params.editGoalId);
      if (goalToEdit) {
        openEditModal(goalToEdit);
      }
      router.setParams({ editGoalId: undefined });
    }
  }, [params.editGoalId, goals]);

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setFrequency('monthly');
    setContributionAmount('');
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    setTargetDate(defaultDate);
    setModalVisible(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setFrequency(goal.frequency);
    setContributionAmount(goal.contributionAmount.toString());
    if (goal.endDate) {
      setTargetDate(new Date(goal.endDate));
    } else {
      const defaultDate = new Date();
      defaultDate.setMonth(defaultDate.getMonth() + 6);
      setTargetDate(defaultDate);
    }
    setModalVisible(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) setTargetDate(selectedDate);
  };

  const handleSave = () => {
    const target = parseFloat(targetAmount);
    const contribution = parseFloat(contributionAmount);

    if (!name.trim()) { Alert.alert('Error', 'Please enter a goal name'); return; }
    if (!targetAmount || isNaN(target) || target <= 0) { Alert.alert('Error', 'Please enter a valid target amount'); return; }
    if (!contributionAmount || isNaN(contribution) || contribution <= 0) { Alert.alert('Error', 'Please enter a valid contribution amount'); return; }

    if (editingGoal) {
      updateGoal(editingGoal.id, { name, targetAmount: target, contributionAmount: contribution, frequency, endDate: targetDate.toISOString() });
    } else {
      addGoal({ name, targetAmount: target, currentAmount: 0, contributionAmount: contribution, frequency, startDate: new Date().toISOString(), endDate: targetDate.toISOString() });
    }
    setModalVisible(false);
  };

  const handleDelete = (goalId: string) => {
    Alert.alert('Delete Goal', 'Are you sure you want to delete this goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goalId) },
    ]);
  };

  const handleContribute = (goal: SavingsGoal) => {
    Alert.prompt(
      'Contribute to Goal',
      `How much would you like to contribute?\nRecommended: ${formatCurrency(goal.contributionAmount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contribute', onPress: (amount) => { const c = parseFloat(amount || '0'); if (c > 0) contributeToGoal(goal.id, c); } },
      ],
      'plain-text',
      goal.contributionAmount.toString()
    );
  };

  const recommendedContribution = targetAmount
    ? calculateRecommendedContribution(parseFloat(targetAmount) || 0, editingGoal?.currentAmount || 0, frequency, new Date().toISOString(), targetDate.toISOString())
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <GlassHeader style={styles.headerContainer}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Savings Goals</Text>
        </View>
      </GlassHeader>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Spacing['6xl'] }]}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <Ionicons name="flag-outline" size={48} color={theme.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Create your first savings goal to get started
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: theme.primary }, Shadow.small]}
              onPress={openAddModal}
              activeOpacity={0.8}
            >
              <Text style={[styles.emptyButtonText, { color: buttonTextColor }]}>Create Goal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => router.push(`/goal/${goal.id}`)}
              onContribute={() => handleContribute(goal)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, bottom: tabBarHeight + Spacing.xl }, Shadow.large]}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={buttonTextColor} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancelButton}>
              <Text style={[styles.modalCancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingGoal ? 'Edit Goal' : 'New Goal'}
            </Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
              <Text style={[styles.modalSaveText, { color: theme.primary }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={true}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Goal Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vacation Fund"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Target Amount</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Target Date</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <input
                    type="date"
                    value={targetDate.toISOString().split('T')[0]}
                    onChange={(e) => setTargetDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ backgroundColor: 'transparent', border: 'none', color: theme.text, fontSize: 16, fontFamily: 'inherit', width: '100%', outline: 'none', cursor: 'pointer' }}
                  />
                </View>
              ) : (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={targetDate}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    themeVariant={themeMode === 'dark' ? 'dark' : 'light'}
                  />
                </View>
              )}
              <Text style={[styles.helperText, { color: theme.textTertiary }]}>
                When do you want to reach this goal?
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Contribution Frequency</Text>
              <View style={[styles.frequencySelector, { backgroundColor: theme.backgroundSecondary }]}>
                {(['weekly', 'monthly'] as ContributionFrequency[]).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      { backgroundColor: frequency === freq ? theme.primary : 'transparent' },
                    ]}
                    onPress={() => setFrequency(freq)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        { color: frequency === freq ? buttonTextColor : theme.textSecondary },
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Contribution Amount</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={contributionAmount}
                onChangeText={setContributionAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
              />
              {recommendedContribution > 0 && (
                <Text style={[styles.recommendedText, { color: theme.textSecondary }]}>
                  Recommended: {formatCurrency(recommendedContribution)}/{frequency.replace('ly', '')}
                </Text>
              )}
            </View>

            {editingGoal && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error + '15', borderColor: theme.error }]}
                onPress={() => { setModalVisible(false); handleDelete(editingGoal.id); }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
                <Text style={[styles.deleteButtonText, { color: theme.error }]}>Delete Goal</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  emptySubtext: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: Spacing['3xl'],
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalCancelButton: {
    padding: Spacing.md,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSaveButton: {
    padding: Spacing.md,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 400 : 350,
  },
  inputGroup: {
    marginBottom: Spacing['3xl'],
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: Radius.md,
    padding: Spacing.xl,
    fontSize: 16,
    borderWidth: 1,
  },
  frequencySelector: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendedText: {
    fontSize: 13,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  webDateContainer: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    minHeight: 52,
    justifyContent: 'center',
  },
  datePickerContainer: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: Spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.xl,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
