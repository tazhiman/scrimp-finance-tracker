import React, { useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { Icon } from '@/components/ui/Icon';
import { abbreviateNumber } from '@/utils/dateHelpers';

type Props = {
  /** Any transactions already filtered to the month being displayed */
  monthTransactions: Transaction[];
  monthDate: Date; // any date within the target month
  onMonthChange: (nextMonthDate: Date) => void;
  onSelectDate?: (date: Date) => void;
};

const toYMD = (d: Date) => format(d, 'yyyy-MM-dd');

const formatMoneyCompact = (amount: number) => {
  if (!Number.isFinite(amount)) return '$0';
  const abs = Math.abs(amount);
  if (abs >= 1000) return `$${abbreviateNumber(abs, 1)}`;
  return `$${abs.toFixed(0)}`;
};

export function TransactionCalendarMonth({
  monthTransactions,
  monthDate,
  onMonthChange,
  onSelectDate,
}: Props) {
  const { theme } = useTheme();

  const today = useMemo(() => new Date(), []);
  const swipeLockedRef = useRef(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gesture) => {
          // Only capture clear horizontal swipes
          const dx = Math.abs(gesture.dx);
          const dy = Math.abs(gesture.dy);
          if (dx < 15) return false;
          return dx > dy * 1.4;
        },
        onPanResponderMove: () => {},
        onPanResponderRelease: (_evt, gesture) => {
          if (swipeLockedRef.current) return;
          const dx = gesture.dx;
          const dy = Math.abs(gesture.dy);
          const adx = Math.abs(dx);
          if (dy > 70) return; // ignore diagonal/vertical drags

          if (adx > 90) {
            swipeLockedRef.current = true;
            if (dx < 0) {
              // Swipe left -> next month
              onMonthChange(addMonths(monthDate, 1));
            } else {
              // Swipe right -> prev month
              onMonthChange(subMonths(monthDate, 1));
            }
            setTimeout(() => {
              swipeLockedRef.current = false;
            }, 300);
          }
        },
      }),
    [monthDate, onMonthChange]
  );

  const totalsByDay = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of monthTransactions) {
      const key = t.date;
      const curr = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === 'income') curr.income += t.amount;
      else curr.expense += t.amount;
      map.set(key, curr);
    }
    return map;
  }, [monthTransactions]);

  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfMonth(monthDate);

  const days: Date[] = [];
  // 6 weeks grid (42 cells) for consistent layout
  for (let i = 0; i < 42; i++) {
    days.push(addDays(start, i));
  }

  const monthLabel = format(monthDate, 'MMMM yyyy');

  return (
    <View
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => onMonthChange(subMonths(monthDate, 1))}
          activeOpacity={0.7}
        >
          <Icon name="chevron-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
          style={styles.monthTitleButton}
        >
          <Text style={[styles.monthTitle, { color: theme.text }]}>{monthLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => onMonthChange(addMonths(monthDate, 1))}
          activeOpacity={0.7}
        >
          <Icon name="chevron-forward" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || monthDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              onMonthChange(date);
            }
          }}
        />
      )}

      <View style={styles.weekHeader}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, idx) => (
          <Text key={`${d}-${idx}`} style={[styles.weekHeaderText, { color: theme.textTertiary }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((d) => {
          const key = toYMD(d);
          const totals = totalsByDay.get(key) ?? { income: 0, expense: 0 };
          const inMonth = isSameMonth(d, monthDate);
          const isToday = isSameDay(d, today);
          const isSelected = selectedDate && isSameDay(d, selectedDate);

          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.cell,
                isToday && { borderColor: theme.primary },
                isSelected && { backgroundColor: theme.primary + '20', borderColor: theme.primary, borderWidth: 2 },
                !inMonth && { opacity: 0.35 },
              ]}
              onPress={() => {
                setSelectedDate(d);
                onSelectDate?.(d);
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.dayNumber, { color: theme.text }]}>
                {format(d, 'd')}
              </Text>
              <View style={styles.amounts}>
                {totals.income > 0 ? (
                  <Text style={[styles.incomeText, { color: theme.primary }]} numberOfLines={1}>
                    +{formatMoneyCompact(totals.income)}
                  </Text>
                ) : (
                  <Text style={styles.placeholderLine} />
                )}
                {totals.expense > 0 ? (
                  <Text style={[styles.expenseText, { color: theme.error }]} numberOfLines={1}>
                    -{formatMoneyCompact(totals.expense)}
                  </Text>
                ) : (
                  <Text style={styles.placeholderLine} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    padding: 6,
  },
  monthTitleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  weekHeaderText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayNumber: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  amounts: {
    alignItems: 'center',
    gap: 2,
  },
  incomeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  expenseText: {
    fontSize: 9,
    fontWeight: '700',
  },
  placeholderLine: {
    height: 11,
  },
});

