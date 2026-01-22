export type TransactionType = 'income' | 'expense';

export type TimePeriod = 'day' | 'week' | 'month';

export type ContributionFrequency = 'weekly' | 'monthly';

export type ContributionStatus = 'completed' | 'due' | 'overdue';

export type RecurrenceFrequency = 'weekly' | 'monthly';

export type RecurringKind = 'recurring' | 'installment';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // ISO date string
  createdAt: string; // ISO date-time string - when added to this app
  description?: string;
}

export interface GoalContribution {
  date: string; // ISO date string
  amount: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  contributionAmount: number;
  frequency: ContributionFrequency;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string (optional)
  lastContributionDate?: string; // ISO date string - tracks when last contribution was made
  contributions?: GoalContribution[]; // History of all contributions
}

export interface RecurringExpense {
  id: string;
  kind: RecurringKind;
  title: string;
  amount: number; // per occurrence
  category: string; // expense category id
  startDate: string; // ISO date string (yyyy-mm-dd)
  frequency: RecurrenceFrequency;
  endDate?: string; // optional stop date
  totalInstallments?: number; // for installment plans
  createdAt: string; // ISO date string
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string; // ISO date string
  unlocked: boolean;
}

export interface UserProgress {
  level: number;
  xp: number;
  totalSaved: number;
  totalSpent: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string; // ISO date string
  badges: Badge[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

