import { useEffect, useRef, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/ui/Icon';
import { AppState, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { getPendingTransactions, clearPendingTransactions } from '@/utils/transactionSync';
import { loadMerchantCategoryMap } from '@/utils/storage';

function useSyncPendingTransactions() {
  const { addTransaction } = useFinance();
  const isSyncing = useRef(false);

  const sync = useCallback(async () => {
    if (Platform.OS !== 'ios' || isSyncing.current) return;
    isSyncing.current = true;
    try {
      console.log('[TransactionSync] Checking for pending transactions...');
      const pending = await getPendingTransactions();
      console.log(`[TransactionSync] Found ${pending.length} pending transaction(s)`);
      if (pending.length === 0) return;

      const merchantMap = await loadMerchantCategoryMap();
      const DEFAULT_CATEGORIES = new Set(['other', 'uncategorized']);

      for (const tx of pending) {
        let category = tx.category || 'other';
        const syncMerchantKey = (tx.merchant || tx.description || '').trim();
        if (DEFAULT_CATEGORIES.has(category) && syncMerchantKey) {
          const learned = merchantMap[syncMerchantKey.toLowerCase()];
          if (learned) {
            console.log(`[TransactionSync] Auto-categorized "${syncMerchantKey}" as "${learned}"`);
            category = learned;
          }
        }

        console.log(`[TransactionSync] Adding: $${tx.amount} - ${syncMerchantKey || tx.description} (${tx.type}) [${category}]`);
        addTransaction({
          type: tx.type,
          amount: tx.amount,
          category,
          merchant: tx.merchant?.trim() || undefined,
          time: tx.time,
          description: tx.description || '',
          date: tx.date,
        });
      }

      await clearPendingTransactions();
      console.log(`[TransactionSync] Synced ${pending.length} pending transaction(s) from Shortcuts`);
    } catch (error) {
      console.error('[TransactionSync] Error syncing pending transactions:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [addTransaction]);

  useEffect(() => {
    sync();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        sync();
      }
    });

    return () => subscription.remove();
  }, [sync]);
}

export default function TabLayout() {
  const { theme, themeMode } = useTheme();
  const router = useRouter();

  useSyncPendingTransactions();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' 
            ? (themeMode === 'dark' ? 'rgba(0, 5, 5, 0.7)' : 'rgba(254, 252, 253, 0.7)')
            : theme.tabBarBackground,
          borderTopColor: Platform.OS === 'ios' 
            ? (themeMode === 'dark' ? 'rgba(31, 36, 36, 0.3)' : 'rgba(212, 210, 211, 0.3)')
            : theme.tabBarBorder,
          borderTopWidth: Platform.OS === 'ios' ? 0.5 : 1,
          height: Platform.OS === 'ios' ? 92 : 76,
        },
        tabBarBackground: () => 
          Platform.OS === 'ios' ? (
            <BlurView 
              intensity={80} 
              tint={themeMode === 'dark' ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
              }}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => (
            <Icon name="flag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarLabel: '',
          tabBarButton: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add Transaction"
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/transactions?openForm=true')}
              style={styles.addButtonWrapper}
            >
              <View style={[styles.addButton, { backgroundColor: theme.primary }]}>
                <Icon name="add" size={30} color="#000505" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="manage-cards"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="faq"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: '100%',
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
});
