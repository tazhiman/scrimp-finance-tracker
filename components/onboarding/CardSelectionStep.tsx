import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spacing, Radius, Shadow } from '@/constants/design';

const { width } = Dimensions.get('window');

export type AccountType = 'credit_card' | 'bank_account';

interface CardSelectionStepProps {
  onNext: (selected: AccountType) => void;
  onSkip: () => void;
}

export function CardSelectionStep({ onNext, onSkip }: CardSelectionStepProps) {
  const { theme, themeMode } = useTheme();
  const [selected, setSelected] = useState<AccountType | null>(null);

  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const options: { type: AccountType; label: string; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { type: 'credit_card', label: 'Credit Card', icon: 'card', description: 'Track spending and rewards' },
    { type: 'bank_account', label: 'Bank Account', icon: 'cash', description: 'Track your balance' },
  ];

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.skipText, { color: theme.primary }]}>Skip for Now</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>Add your accounts{'\n'}or cards</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          What would you like to set up first?
        </Text>

        <View style={styles.optionsList}>
          {options.map(opt => {
            const isSelected = selected === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                onPress={() => setSelected(opt.type)}
                activeOpacity={0.7}
              >
                <GlassCard
                  style={[
                    styles.optionCard,
                    isSelected && { borderColor: theme.primary, borderWidth: 1.5 },
                  ]}
                  intensity="subtle"
                  borderRadius={Radius.lg}
                >
                  <View style={styles.optionRow}>
                    <View style={[
                      styles.optionIcon,
                      { backgroundColor: isSelected ? theme.primary + '25' : theme.backgroundTertiary },
                    ]}>
                      <Ionicons name={opt.icon} size={26} color={isSelected ? theme.primary : theme.textSecondary} />
                    </View>
                    <View style={styles.optionTextBlock}>
                      <Text style={[styles.optionLabel, { color: isSelected ? theme.primary : theme.text }]}>
                        {opt.label}
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                        {opt.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selected && (
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }, Shadow.medium]}
            onPress={() => onNext(selected)}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextButtonText, { color: buttonTextColor }]}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing.xl,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing['4xl'],
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing['4xl'],
  },
  optionsList: {
    gap: Spacing.xl,
  },
  optionCard: {
    padding: Spacing['2xl'],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextBlock: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: Spacing['3xl'],
  },
  nextButton: {
    paddingVertical: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
