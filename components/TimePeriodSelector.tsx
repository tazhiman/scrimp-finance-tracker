import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimePeriod } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, Radius } from '@/constants/design';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  showCalendarButton?: boolean;
  isCalendarActive?: boolean;
  onCalendarPress?: () => void;
}

const periods: { label: string; value: TimePeriod }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
];

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  showCalendarButton,
  isCalendarActive,
  onCalendarPress,
}) => {
  const { theme, themeMode } = useTheme();
  const activeTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {periods.map((period) => {
        const isActive = selectedPeriod === period.value && !(period.value === 'month' && isCalendarActive);
        
        return (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.button,
              isActive && { backgroundColor: theme.primary },
            ]}
            onPress={() => onPeriodChange(period.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                { color: isActive ? activeTextColor : theme.textSecondary },
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
      {showCalendarButton && (
        <TouchableOpacity
          style={[
            styles.iconButton,
            isCalendarActive && { backgroundColor: theme.primary },
          ]}
          onPress={onCalendarPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isCalendarActive ? 'calendar' : 'calendar-outline'}
            size={18}
            color={isCalendarActive ? activeTextColor : theme.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.xs,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    marginLeft: Spacing.xs,
  },
});
