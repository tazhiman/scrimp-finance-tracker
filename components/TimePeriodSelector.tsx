import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimePeriod } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Icon } from '@/components/ui/Icon';
import { Spacing, Radius, FILTER_TRACK_HEIGHT } from '@/constants/design';

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
          <Icon
            name={isCalendarActive ? 'calendar' : 'calendar-outline'}
            size={18}
            color={isCalendarActive ? activeTextColor : theme.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const INNER_H = FILTER_TRACK_HEIGHT - Spacing.xs * 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: FILTER_TRACK_HEIGHT,
    borderRadius: Radius.md,
    padding: Spacing.xs,
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    width: INNER_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    marginLeft: Spacing.xs,
  },
});
