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
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFinance } from '@/context/FinanceContext';
import { useTheme } from '@/context/ThemeContext';
import { GoalCard } from '@/components/GoalCard';
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
  
  // In dark mode, use black text on the light colored buttons for better contrast
  const buttonTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [contributionAmount, setContributionAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date>(() => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6); // Default to 6 months from now
    return defaultDate;
  });

  // Open edit modal automatically if editGoalId parameter is present
  useEffect(() => {
    if (params.editGoalId) {
      const goalToEdit = goals.find(g => g.id === params.editGoalId);
      if (goalToEdit) {
        openEditModal(goalToEdit);
      }
      // Clear the parameter
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
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const handleSave = () => {
    const target = parseFloat(targetAmount);
    const contribution = parseFloat(contributionAmount);

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (!targetAmount || isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    if (!contributionAmount || isNaN(contribution) || contribution <= 0) {
      Alert.alert('Error', 'Please enter a valid contribution amount');
      return;
    }

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        name,
        targetAmount: target,
        contributionAmount: contribution,
        frequency,
        endDate: targetDate.toISOString(),
      });
    } else {
      addGoal({
        name,
        targetAmount: target,
        currentAmount: 0,
        contributionAmount: contribution,
        frequency,
        startDate: new Date().toISOString(),
        endDate: targetDate.toISOString(),
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteGoal(goalId),
        },
      ]
    );
  };

  const handleContribute = (goal: SavingsGoal) => {
    Alert.prompt(
      'Contribute to Goal',
      `How much would you like to contribute?\nRecommended: ${formatCurrency(goal.contributionAmount)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Contribute',
          onPress: (amount) => {
            const contribution = parseFloat(amount || '0');
            if (contribution > 0) {
              contributeToGoal(goal.id, contribution);
            }
          },
        },
      ],
      'plain-text',
      goal.contributionAmount.toString()
    );
  };

  const recommendedContribution = targetAmount
    ? calculateRecommendedContribution(
        parseFloat(targetAmount) || 0,
        editingGoal?.currentAmount || 0,
        frequency,
        new Date().toISOString(),
        targetDate.toISOString()
      )
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Savings Goals</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={buttonTextColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No goals yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Create your first savings goal to get started
            </Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={openAddModal}>
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

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={[styles.modalHeader, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCancelButton}
            >
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
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Goal Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vacation Fund"
                placeholderTextColor={theme.textTertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Target Amount</Text>
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
              <Text style={[styles.inputLabel, { color: theme.text }]}>Target Date</Text>
              {Platform.OS === 'web' ? (
                <View style={[styles.webDateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <input
                    type="date"
                    value={targetDate.toISOString().split('T')[0]}
                    onChange={(e) => setTargetDate(new Date(e.target.value))}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: theme.text,
                      fontSize: 16,
                      fontFamily: 'inherit',
                      width: '100%',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
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
                    themeVariant={theme === theme ? 'dark' : 'light'}
                  />
                </View>
              )}
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                When do you want to reach this goal?
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Contribution Frequency</Text>
              <View style={[styles.frequencySelector, { backgroundColor: theme.backgroundSecondary }]}>
                {(['weekly', 'monthly'] as ContributionFrequency[]).map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      { backgroundColor: frequency === freq ? theme.primary : 'transparent', borderColor: frequency === freq ? theme.primary : 'transparent' },
                    ]}
                    onPress={() => setFrequency(freq)}
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        { color: frequency === freq ? theme.text : theme.textSecondary },
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Contribution Amount</Text>
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
                  💡 Recommended: {formatCurrency(recommendedContribution)}/{frequency.replace('ly', '')}
                </Text>
              )}
            </View>

            {editingGoal && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: theme.error }]}
                onPress={() => {
                  setModalVisible(false);
                  handleDelete(editingGoal.id);
                }}
              >
                <Text style={[styles.deleteButtonText, { color: '#FFFFFF' }]}>Delete Goal</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    padding: 8,
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 400 : 350,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  frequencySelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  frequencyButtonActive: {
  },
  frequencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
  },
  recommendedText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500',
  },
  webDateContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  datePickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    minHeight: 52,
    justifyContent: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  deleteButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
});

