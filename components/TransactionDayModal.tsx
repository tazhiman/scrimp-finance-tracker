import React, { useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types';
import { formatCurrency, formatDateShort } from '@/utils/dateHelpers';
import { getCategoryById } from '@/constants/categories';

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
  const title = useMemo(() => format(date, 'EEEE, MMM d, yyyy'), [date]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const category = getCategoryById(item.category);
    const isIncome = item.type === 'income';

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
              { backgroundColor: category?.color + '20' || theme.backgroundTertiary },
            ]}
          >
            <Text style={styles.categoryEmoji}>{category?.icon || '💰'}</Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionCategory, { color: theme.text }]}>
              {category?.name || item.category}
            </Text>
            {item.description ? (
              <Text style={[styles.transactionDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>
              {formatDateShort(item.date)}
            </Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color: isIncome ? theme.primary : theme.error }]}>
          {isIncome ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.cardBorder,
              height: modalHeight,
            },
          ]}
        >
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
            style={[styles.closeButton, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={styles.contentArea}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={40} color={theme.textTertiary} />
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
              style={[styles.footerButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={theme.textSecondary} />
              <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNextDay}
              style={[styles.footerButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerButtonText, { color: theme.textSecondary }]}>Next</Text>
              <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  contentArea: {
    flex: 1,
    marginBottom: 60,
  },
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 10,
  },
  headerCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 10,
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 8,
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
    padding: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    width: '100%',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

