import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'what_is_this',
    question: 'What does this app do?',
    answer:
      'This app helps you track income and expenses, set savings goals, and stay consistent with weekly/monthly goal contributions. Your Dashboard shows goal progress and your budget remaining for the month.',
  },
  {
    id: 'how_budget',
    question: 'How is my budget calculated?',
    answer:
      'The app uses a monthly budget model:\n\nBudget base = 80% of your monthly income.\nBudget remaining = (income × 0.8) − (goal contributions) − (spending).\n\nThis shows how much you can still spend after accounting for goal contributions and expenses.',
  },
  {
    id: 'goals_vs_transactions',
    question: 'What is the difference between goals and transactions?',
    answer:
      'Transactions are your income and expenses (salary, groceries, rent, etc.). Goals are targets you want to save toward. You can contribute to a goal, and the app will indicate whether you have contributed for the current week/month.',
  },
  {
    id: 'goal_status',
    question: 'What do the goal status indicators mean?',
    answer:
      'On goal cards and the Dashboard:\n\n- Paid this week/month: you made your contribution in the current period.\n- Due this week/month: you have not contributed yet for the current period.\n- Overdue: the period ended and you still did not contribute.\n- Goal Reached: you reached the goal target amount.',
  },
  {
    id: 'notifications',
    question: 'How do goal reminders work?',
    answer:
      'If enabled in Settings, the app schedules weekly local notifications for goals that are due or overdue. Notifications are sent on a weekly cadence to help you stay consistent.',
  },
  {
    id: 'where_data',
    question: 'Where is my data stored?',
    answer:
      'Your data is saved only on your phone. It is not sent to the internet or shared with anyone by default. Only you can see it in this app on this phone (unless someone else has access to your phone).',
  },
];

export default function FAQScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.cardBorder }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Quick answers about how the app works.
        </Text>

        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            >
              <TouchableOpacity
                style={styles.row}
                onPress={() => setOpenId(isOpen ? null : item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.question, { color: theme.text }]}>{item.question}</Text>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              {isOpen && (
                <Text style={[styles.answer, { color: theme.textSecondary }]}>{item.answer}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  answer: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
});

