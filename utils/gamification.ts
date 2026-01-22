import { UserProgress, Badge, Transaction, SavingsGoal } from '@/types';
import { calculateTotalExpenses, calculateTotalIncome, calculateNetSavings } from './calculations';
import { isDateInPeriod } from './dateHelpers';
import { TimePeriod } from '@/types';
import { startOfDay, isToday, parseISO } from 'date-fns';

const XP_PER_DOLLAR_SAVED = 1;
const XP_PER_GOAL_COMPLETED = 100;
const XP_PER_MONTH_STREAK = 50; // Changed from day to month
const XP_PER_TRANSACTION = 2;

const XP_PER_LEVEL = 1000; // Base XP needed per level (increases with level)

export const calculateLevel = (totalXP: number): number => {
  // Level formula: level = floor(sqrt(totalXP / XP_PER_LEVEL)) + 1
  return Math.floor(Math.sqrt(totalXP / XP_PER_LEVEL)) + 1;
};

export const calculateXPForLevel = (level: number): number => {
  // XP needed for a specific level
  return Math.pow(level - 1, 2) * XP_PER_LEVEL;
};

export const calculateXPProgress = (totalXP: number, level: number): number => {
  const xpForCurrentLevel = calculateXPForLevel(level);
  const xpForNextLevel = calculateXPForLevel(level + 1);
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  return xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : 0;
};

export const calculateXPFromSavings = (amount: number): number => {
  return Math.floor(amount * XP_PER_DOLLAR_SAVED);
};

export const calculateXPFromGoal = (): number => {
  return XP_PER_GOAL_COMPLETED;
};

export const calculateXPFromStreak = (streak: number): number => {
  return streak * XP_PER_MONTH_STREAK;
};

export const calculateXPFromTransaction = (): number => {
  return XP_PER_TRANSACTION;
};

export const updateStreak = (progress: UserProgress, transactions: Transaction[]): number => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Check if there are income transactions this month (representing monthly savings/paychecks)
  const hasIncomeThisMonth = transactions.some(t => {
    const transactionDate = parseISO(t.date);
    return (
      t.type === 'income' &&
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });
  
  if (!hasIncomeThisMonth) {
    // Check if streak should be reset
    if (progress.lastActivityDate) {
      const lastActivity = parseISO(progress.lastActivityDate);
      const lastMonth = lastActivity.getMonth();
      const lastYear = lastActivity.getFullYear();
      
      // Calculate months difference
      const monthsDiff = (currentYear - lastYear) * 12 + (currentMonth - lastMonth);
      
      if (monthsDiff > 1) {
        return 0; // Streak broken - missed a month
      }
    }
    return progress.currentStreak; // No income this month yet, but streak not broken
  }
  
  // There's income this month
  if (!progress.lastActivityDate) {
    return 1; // First month
  }
  
  const lastActivity = parseISO(progress.lastActivityDate);
  const lastMonth = lastActivity.getMonth();
  const lastYear = lastActivity.getFullYear();
  
  // Calculate months difference
  const monthsDiff = (currentYear - lastYear) * 12 + (currentMonth - lastMonth);
  
  if (monthsDiff === 0) {
    return progress.currentStreak; // Same month
  } else if (monthsDiff === 1) {
    return progress.currentStreak + 1; // Consecutive month
  } else {
    return 1; // Streak broken, start new streak
  }
};

// Badge definitions
export const BADGE_DEFINITIONS: Omit<Badge, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_goal',
    name: 'Goal Setter',
    description: 'Create your first savings goal',
    icon: '🎯',
  },
  {
    id: 'goal_completed',
    name: 'Goal Achiever',
    description: 'Complete your first savings goal',
    icon: '🏆',
  },
  {
    id: 'streak_3',
    name: 'Consistent Saver',
    description: 'Save income for 3 consecutive months',
    icon: '🔥',
  },
  {
    id: 'streak_6',
    name: 'Half-Year Hero',
    description: 'Save income for 6 consecutive months',
    icon: '💪',
  },
  {
    id: 'streak_12',
    name: 'Year-Long Champion',
    description: 'Save income for 12 consecutive months',
    icon: '🏆',
  },
  {
    id: 'saved_100',
    name: 'Century Saver',
    description: 'Save $100 total',
    icon: '💵',
  },
  {
    id: 'saved_1000',
    name: 'Thousandaire',
    description: 'Save $1,000 total',
    icon: '💰',
  },
  {
    id: 'saved_10000',
    name: 'Ten Thousandaire',
    description: 'Save $10,000 total',
    icon: '💎',
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    icon: '⭐',
  },
  {
    id: 'level_10',
    name: 'Finance Pro',
    description: 'Reach level 10',
    icon: '🌟',
  },
  {
    id: 'level_20',
    name: 'Finance Master',
    description: 'Reach level 20',
    icon: '👑',
  },
];

export const checkBadgeUnlocks = (
  progress: UserProgress,
  transactions: Transaction[],
  goals: SavingsGoal[]
): Badge[] => {
  const totalSaved = calculateNetSavings(transactions);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;
  
  const updatedBadges = progress.badges.map(badge => {
    if (badge.unlocked) return badge;
    
    let shouldUnlock = false;
    
    switch (badge.id) {
      case 'first_goal':
        shouldUnlock = goals.length > 0;
        break;
      case 'goal_completed':
        shouldUnlock = completedGoals > 0;
        break;
      case 'streak_3':
        shouldUnlock = progress.currentStreak >= 3;
        break;
      case 'streak_6':
        shouldUnlock = progress.currentStreak >= 6;
        break;
      case 'streak_12':
        shouldUnlock = progress.currentStreak >= 12;
        break;
      case 'saved_100':
        shouldUnlock = totalSaved >= 100;
        break;
      case 'saved_1000':
        shouldUnlock = totalSaved >= 1000;
        break;
      case 'saved_10000':
        shouldUnlock = totalSaved >= 10000;
        break;
      case 'level_5':
        shouldUnlock = progress.level >= 5;
        break;
      case 'level_10':
        shouldUnlock = progress.level >= 10;
        break;
      case 'level_20':
        shouldUnlock = progress.level >= 20;
        break;
    }
    
    if (shouldUnlock && !badge.unlocked) {
      return {
        ...badge,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      };
    }
    
    return badge;
  });
  
  return updatedBadges;
};

export const initializeBadges = (): Badge[] => {
  return BADGE_DEFINITIONS.map(badge => ({
    ...badge,
    unlocked: false,
  }));
};

