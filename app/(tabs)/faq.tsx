import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { GlassHeader } from '@/components/ui/GlassHeader';
import { Spacing, Radius } from '@/constants/design';

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
      'The app uses your calendar month income and activity.\n\nBudget remaining = (monthly income) − (sum of your goals’ monthly contribution amounts) − (spending that month).\n\nThe ring on the Dashboard shows how much of your income is already committed to goals plus expenses. Totals use the same month as your transactions.',
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
      'On goal cards and the Dashboard:\n\n• Paid this week/month: You made your contribution in the current period.\n\n• Due this week/month: You have not contributed yet for the current period.\n\n• Overdue: The period ended and you still did not contribute.\n\n• Goal Reached: You reached the goal target amount.',
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
      <GlassHeader style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Icon name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>FAQ</Text>
          <View style={styles.placeholder} />
        </View>
      </GlassHeader>

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
                <Icon
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.answerContainer}>
                  {item.answer.split('\n\n').map((paragraph, idx) => {
                    if (paragraph.startsWith('•')) {
                      // Bullet point item
                      const [bullet, ...rest] = paragraph.split(': ');
                      return (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={[styles.bullet, { color: theme.textSecondary }]}>• </Text>
                          <Text style={[styles.bulletText, { color: theme.textSecondary }]}>
                            {bullet.substring(2)}: {rest.join(': ')}
                          </Text>
                        </View>
                      );
                    }
                    // Regular paragraph
                    return (
                      <Text key={idx} style={[styles.answer, { color: theme.textSecondary }]}>
                        {paragraph}
                      </Text>
                    );
                  })}
                </View>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: Spacing.md,
    marginLeft: -Spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: Spacing.xl,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  answerContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginRight: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

