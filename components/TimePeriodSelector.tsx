import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimePeriod } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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
  
  // In dark mode, use black text on the light colored button for better contrast
  const activeTextColor = themeMode === 'dark' ? '#000505' : theme.text;
  
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {periods.map((period) => {
        // Don't highlight Month button if calendar view is active
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
    borderRadius: 12,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    borderRadius: 8,
    marginLeft: 4,
  },
});

