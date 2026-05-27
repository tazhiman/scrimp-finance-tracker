import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { useTheme } from '@/context/ThemeContext';
import { BankAccount } from '@/types';
import { LinkAccountResult } from '@/components/onboarding/LinkAccountStep';

export type GoalAccountLinkMode = 'none' | 'existing' | 'new';

export interface GoalAccountLinkState {
  existingSavings: string;
  linkEnabled: boolean;
  mode: GoalAccountLinkMode;
  selectedAccountId: string | null;
  newAccountName: string;
  newAccountBalance: string;
}

export function createDefaultLinkState(
  initial?: Partial<GoalAccountLinkState>
): GoalAccountLinkState {
  return {
    existingSavings: initial?.existingSavings ?? '0',
    linkEnabled: initial?.linkEnabled ?? false,
    mode: initial?.mode ?? 'none',
    selectedAccountId: initial?.selectedAccountId ?? null,
    newAccountName: initial?.newAccountName ?? '',
    newAccountBalance: initial?.newAccountBalance ?? '',
  };
}

export function linkStateFromGoal(
  goal: {
    currentAmount: number;
    linkedAccountId?: string;
  },
  accounts: BankAccount[]
): GoalAccountLinkState {
  const linked = goal.linkedAccountId
    ? accounts.find(a => a.id === goal.linkedAccountId)
    : undefined;
  return createDefaultLinkState({
    existingSavings: String(goal.currentAmount || 0),
    linkEnabled: Boolean(goal.linkedAccountId),
    mode: goal.linkedAccountId
      ? linked
        ? 'existing'
        : 'new'
      : 'none',
    selectedAccountId: goal.linkedAccountId ?? null,
    newAccountName: linked?.name ?? '',
    newAccountBalance: linked != null ? String(linked.balance) : '',
  });
}

interface GoalAccountLinkSectionProps {
  goalName: string;
  accounts: BankAccount[];
  state: GoalAccountLinkState;
  onChange: (state: GoalAccountLinkState) => void;
}

export function GoalAccountLinkSection({
  goalName,
  accounts,
  state,
  onChange,
}: GoalAccountLinkSectionProps) {
  const { theme, themeMode } = useTheme();
  const buttonTextColor = themeMode === 'dark' ? '#000505' : '#FEFCFD';

  const patch = (partial: Partial<GoalAccountLinkState>) => {
    onChange({ ...state, ...partial });
  };

  const toggleLink = () => {
    if (state.linkEnabled) {
      patch({ linkEnabled: false, mode: 'none', selectedAccountId: null });
    } else {
      const firstId = accounts[0]?.id ?? null;
      patch({
        linkEnabled: true,
        mode: firstId ? 'existing' : 'new',
        selectedAccountId: firstId,
      });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
        Already saved toward goal
      </Text>
      <View
        style={[
          styles.currencyRow,
          { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
        <TextInput
          style={[styles.currencyValue, { color: theme.text }]}
          value={state.existingSavings}
          onChangeText={v => patch({ existingSavings: v })}
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
        />
      </View>
      <Text style={[styles.hint, { color: theme.textTertiary }]}>
        Money you have already put aside for this goal.
      </Text>

      <TouchableOpacity
        style={[styles.linkToggle, { borderColor: theme.cardBorder }]}
        onPress={toggleLink}
        activeOpacity={0.7}
      >
        <Icon
          name={state.linkEnabled ? 'checkbox' : 'square-outline'}
          size={22}
          color={state.linkEnabled ? theme.primary : theme.textTertiary}
        />
        <Text style={[styles.linkToggleText, { color: theme.text }]}>
          Link a bank account
        </Text>
      </TouchableOpacity>

      {state.linkEnabled && (
        <View style={[styles.linkCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}>
          {goalName ? (
            <View style={[styles.goalBadge, { backgroundColor: theme.primary + '14', borderColor: theme.primary + '30' }]}>
              <Icon name="flag" size={16} color={theme.primary} />
              <Text style={[styles.goalBadgeText, { color: theme.primary }]} numberOfLines={1}>
                {goalName}
              </Text>
            </View>
          ) : null}

          {accounts.length > 0 && (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Choose account</Text>
              {accounts.map(acct => {
                const selected = state.mode === 'existing' && state.selectedAccountId === acct.id;
                return (
                  <TouchableOpacity
                    key={acct.id}
                    style={[
                      styles.accountRow,
                      {
                        borderColor: selected ? theme.primary : theme.cardBorder,
                        backgroundColor: selected ? theme.primary + '12' : theme.backgroundSecondary,
                      },
                    ]}
                    onPress={() =>
                      patch({
                        mode: 'existing',
                        selectedAccountId: acct.id,
                        newAccountName: acct.name,
                        newAccountBalance: String(acct.balance),
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.accountRowName, { color: theme.text }]}>{acct.name}</Text>
                    <Text style={[styles.accountRowBalance, { color: theme.textSecondary }]}>
                      ${acct.balance.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.addNewRow}
                onPress={() =>
                  patch({
                    mode: 'new',
                    selectedAccountId: null,
                    newAccountName: '',
                    newAccountBalance: '',
                  })
                }
                activeOpacity={0.7}
              >
                <Icon name="add-circle-outline" size={20} color={theme.primary} />
                <Text style={[styles.addNewText, { color: theme.primary }]}>Add new account</Text>
              </TouchableOpacity>
            </>
          )}

          {(state.mode === 'new' || accounts.length === 0) && (
            <>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>
                {accounts.length > 0 ? 'New account' : 'Account details'}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
                ]}
                value={state.newAccountName}
                onChangeText={v => patch({ newAccountName: v, mode: 'new', selectedAccountId: null })}
                placeholder="e.g. DBS Savings, UOB"
                placeholderTextColor={theme.textTertiary}
              />
              <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
                Current account balance
              </Text>
              <View
                style={[
                  styles.currencyRow,
                  { borderColor: theme.cardBorder, backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <Text style={[styles.currencySign, { color: theme.textSecondary }]}>$</Text>
                <TextInput
                  style={[styles.currencyValue, { color: theme.text }]}
                  value={state.newAccountBalance}
                  onChangeText={v => patch({ newAccountBalance: v })}
                  placeholder="0.00"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

/** Validate and build link result for save; returns null if link disabled */
export function resolveGoalAccountLink(
  state: GoalAccountLinkState,
  accounts: BankAccount[]
): { result: LinkAccountResult | null; error?: string } {
  const savings = parseFloat(state.existingSavings) || 0;
  if (savings < 0) {
    return { result: null, error: 'Existing savings cannot be negative.' };
  }

  if (!state.linkEnabled) {
    return { result: null };
  }

  if (state.mode === 'existing' && state.selectedAccountId) {
    const acct = accounts.find(a => a.id === state.selectedAccountId);
    if (!acct) {
      return { result: null, error: 'Selected account not found.' };
    }
    const bal = parseFloat(state.newAccountBalance);
    const balance = !state.newAccountBalance || isNaN(bal) ? acct.balance : bal;
    return {
      result: {
        account: { id: acct.id, name: acct.name, balance },
        existingSavings: savings,
      },
    };
  }

  const trimmedName = state.newAccountName.trim();
  if (!trimmedName) {
    return { result: null, error: 'Please enter an account name.' };
  }
  const bal = parseFloat(state.newAccountBalance);
  if (!state.newAccountBalance || isNaN(bal)) {
    return { result: null, error: 'Please enter the current account balance.' };
  }

  return {
    result: {
      account: {
        id: `acct-${Date.now()}`,
        name: trimmedName,
        balance: bal,
      },
      existingSavings: savings,
    },
  };
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  currencySign: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  currencyValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  linkToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    marginBottom: 12,
  },
  linkToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 16,
    maxWidth: '100%',
  },
  goalBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  accountRowName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  accountRowBalance: {
    fontSize: 14,
    fontWeight: '600',
  },
  addNewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  addNewText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
