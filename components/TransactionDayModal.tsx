import React, { useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { GlassModal } from '@/components/ui/GlassModal';
import { Spacing, Radius } from '@/constants/design';
import { Transaction } from '@/types';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';
import { getTransactionRowLabels } from '@/utils/transactionDisplay';

type Props = {
  visible: boolean;
  date: Date;
  transactions: Transaction[];
  modalHeight: number;
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onPressTransaction: (tx: Transaction) => void;
};

export function TransactionDayModal({
  visible,
  date,
  transactions,
  modalHeight,
  onClose,
  onPrevDay,
  onNextDay,
  onPressTransaction,
}: Props) {
  const { theme } = useTheme();
  const { customCategories } = useFinance();
  const title = useMemo(() => format(date, 'EEEE, MMM d, yyyy'), [date]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category, customCategories);
    const isIncome = item.type === 'income';
    const categoryLabel = category?.name || item.category;
    const { primary, subtitle } = getTransactionRowLabels(item, categoryLabel);

    return (
      <TouchableOpacity
        style={[
          styles.transactionCard,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder },
        ]}
        onPress={() => onPressTransaction(item)}
        activeOpacity={0.7}
      >
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: (category?.color || theme.backgroundTertiary) + '20' },
            ]}
          >
            <Text style={styles.categoryEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionCategory, { color: theme.text }]}>{primary}</Text>
            {subtitle ? (
              <Text style={[styles.transactionDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>
              {formatDateShort(item.date)}
            </Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? theme.primary : theme.secondary }]}>
          {isIncome ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <GlassModal
      visible={visible}
      onClose={onClose}
      cardStyle={{ height: modalHeight }}
    >
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.headerCenter}>
            <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              {transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Icon name="close" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={styles.contentArea}>
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="calendar-outline" size={40} color={theme.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No transactions</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Nothing recorded for this date.
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(t) => t.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={[styles.footerNav, { borderTopColor: theme.cardBorder }]}>
          <TouchableOpacity
            onPress={onPrevDay}
            style={[styles.footerButton, { backgroundColor: theme.backgroundSecondary }]}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={20} color={theme.textSecondary} />
            <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>Prev</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNextDay}
            style={[styles.footerButton, { backgroundColor: theme.backgroundSecondary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>Next</Text>
            <Icon name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </GlassModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    padding: Spacing.xl,
  },
  contentArea: {
    flex: 1,
    marginBottom: 56,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  headerCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  footerNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.lg,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    flex: 1,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    width: '100%',
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.lg,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '600',
  },
  transactionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: Spacing.xs,
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
