import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/design';
import { clampPayDay, ordinalSuffix, payDayLabel } from '@/utils/payDay';

const ITEM_WIDTH = 52;
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

interface DayOfMonthPickerProps {
  value: number;
  onChange: (day: number) => void;
  frequency?: 'weekly' | 'monthly';
  hint?: string;
}

export function DayOfMonthPicker({
  value,
  onChange,
  frequency = 'monthly',
  hint,
}: DayOfMonthPickerProps) {
  const { theme, themeMode } = useTheme();
  const selectedTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';
  const scrollRef = useRef<ScrollView>(null);
  const clamped = clampPayDay(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: Math.max(0, (clamped - 1) * ITEM_WIDTH - ITEM_WIDTH * 2),
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [clamped]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const centerIndex = Math.round((offsetX + ITEM_WIDTH * 2) / ITEM_WIDTH);
    const day = clampPayDay(centerIndex + 1);
    if (day !== clamped) onChange(day);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
      >
        {DAYS.map((day) => {
          const selected = day === clamped;
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayItem,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
                  borderColor: selected ? theme.primary : theme.cardBorder,
                },
              ]}
              onPress={() => onChange(day)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: selected ? selectedTextColor : theme.text },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={[styles.caption, { color: theme.textSecondary }]}>
        {hint ?? payDayLabel(clamped, frequency)}
      </Text>
      <Text style={[styles.ordinalHint, { color: theme.textTertiary }]}>
        Selected: {ordinalSuffix(clamped)} of the month
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  dayItem: {
    width: ITEM_WIDTH - Spacing.sm,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.xs / 2,
  },
  dayText: {
    fontSize: 17,
    fontWeight: '700',
  },
  caption: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  ordinalHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
