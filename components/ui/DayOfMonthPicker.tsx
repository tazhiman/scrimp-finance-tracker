import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/design';
import { clampPayDay, payDayLabel } from '@/utils/payDay';

const ITEM_WIDTH = 52;
const ITEM_MARGIN = 4;
const CELL_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;
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
  const listRef = useRef<FlatList>(null);
  const clamped = clampPayDay(value);
  const programmaticScrollRef = useRef(false);

  // Scroll to keep selected day visible on initial render only
  useEffect(() => {
    const timer = setTimeout(() => {
      programmaticScrollRef.current = true;
      listRef.current?.scrollToIndex({
        index: clamped - 1,
        animated: false,
        viewPosition: 0.5,
      });
    }, 80);
    return () => clearTimeout(timer);
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CELL_WIDTH,
      offset: CELL_WIDTH * index,
      index,
    }),
    []
  );

  const handleScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      if (programmaticScrollRef.current) {
        programmaticScrollRef.current = false;
        return;
      }
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / CELL_WIDTH);
      const day = clampPayDay(index + 1);
      if (day !== clamped) onChange(day);
    },
    [clamped, onChange]
  );

  const renderItem = useCallback(
    ({ item: day }: { item: number }) => {
      const selected = day === clamped;
      return (
        <TouchableOpacity
          style={[
            styles.dayItem,
            {
              backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
              borderColor: selected ? theme.primary : theme.cardBorder,
            },
          ]}
          onPress={() => {
            if (day !== clamped) {
              programmaticScrollRef.current = true;
              listRef.current?.scrollToIndex({
                index: day - 1,
                animated: true,
                viewPosition: 0.5,
              });
              onChange(day);
            }
          }}
          activeOpacity={0.75}
        >
          <Text style={[styles.dayText, { color: selected ? selectedTextColor : theme.text }]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    },
    [clamped, theme, selectedTextColor, onChange]
  );

  return (
    <View>
      <FlatList
        ref={listRef}
        data={DAYS}
        renderItem={renderItem}
        keyExtractor={(item) => String(item)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CELL_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.scrollContent}
        initialScrollIndex={Math.max(0, clamped - 3)}
        scrollEventThrottle={16}
        removeClippedSubviews={false}
      />
      <Text style={[styles.caption, { color: theme.textSecondary }]}>
        {hint ?? payDayLabel(clamped, frequency)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: Spacing.sm,
  },
  dayItem: {
    width: ITEM_WIDTH,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: ITEM_MARGIN,
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
});
