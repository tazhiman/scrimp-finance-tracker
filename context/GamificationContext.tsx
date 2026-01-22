import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProgress, Transaction, SavingsGoal } from '@/types';
import {
  loadUserProgress,
  saveUserProgress,
} from '@/utils/storage';
import {
  calculateLevel,
  calculateXPProgress,
  calculateXPFromSavings,
  calculateXPFromGoal,
  calculateXPFromTransaction,
  updateStreak,
  checkBadgeUnlocks,
  initializeBadges,
} from '@/utils/gamification';
import { useFinance } from './FinanceContext';
import { calculateNetSavings } from '@/utils/calculations';

interface GamificationContextType {
  progress: UserProgress;
  addXP: (amount: number) => void;
  refreshProgress: () => void;
  loading: boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

const initialProgress: UserProgress = {
  level: 1,
  xp: 0,
  totalSaved: 0,
  totalSpent: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: initializeBadges(),
};

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { transactions, goals } = useFinance();
  const [progress, setProgress] = useState<UserProgress>(initialProgress);
  const [loading, setLoading] = useState(true);

  // Load progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const loadedProgress = await loadUserProgress();
        if (loadedProgress) {
          setProgress(loadedProgress);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (!loading) {
      saveUserProgress(progress).catch(console.error);
    }
  }, [progress, loading]);

  // Refresh progress when transactions or goals change
  useEffect(() => {
    if (!loading) {
      refreshProgress();
    }
  }, [transactions, goals, loading]);

  const refreshProgress = () => {
    setProgress(prev => {
      // Calculate totals
      const netSavings = calculateNetSavings(transactions);
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Update streak
      const newStreak = updateStreak(prev, transactions);
      const longestStreak = Math.max(prev.longestStreak, newStreak);

      // Check for completed goals (newly completed)
      const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);
      const previouslyCompleted = prev.badges.find(b => b.id === 'goal_completed')?.unlocked || false;
      const newlyCompleted = completedGoals.length > 0 && !previouslyCompleted;

      // Calculate XP
      let newXP = prev.xp;
      
      // Add XP for new savings (if net savings increased)
      if (netSavings > prev.totalSaved) {
        const savingsIncrease = netSavings - prev.totalSaved;
        newXP += calculateXPFromSavings(savingsIncrease);
      }

      // Add XP for newly completed goal
      if (newlyCompleted) {
        newXP += calculateXPFromGoal();
      }

      // Add XP for streak (50 XP per month instead of 10 per day)
      if (newStreak > prev.currentStreak) {
        newXP += (newStreak - prev.currentStreak) * 50;
      }

      // Calculate level
      const newLevel = calculateLevel(newXP);
      const xpProgress = calculateXPProgress(newXP, newLevel);

      // Check badge unlocks
      const updatedBadges = checkBadgeUnlocks(
        { ...prev, level: newLevel, xp: newXP, currentStreak: newStreak },
        transactions,
        goals
      );

      // Update last activity date if there are transactions today
      const today = new Date().toISOString().split('T')[0];
      const hasActivityToday = transactions.some(t => t.date.startsWith(today));
      const lastActivityDate = hasActivityToday ? new Date().toISOString() : prev.lastActivityDate;

      return {
        level: newLevel,
        xp: newXP,
        totalSaved: netSavings,
        totalSpent: totalExpenses,
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate,
        badges: updatedBadges,
      };
    });
  };

  const addXP = (amount: number) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = calculateLevel(newXP);
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
      };
    });
  };

  return (
    <GamificationContext.Provider
      value={{
        progress,
        addXP,
        refreshProgress,
        loading,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

