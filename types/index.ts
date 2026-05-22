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
  date: string; // ISO date (yyyy-mm-dd) for the transaction day
  /** Local time of transaction, 24h "HH:mm". If omitted, UI may fall back to createdAt for display. */
  time?: string;
  createdAt: string; // ISO date-time string - when added to this app
  merchant?: string; // Store / payee name (optional)
  description?: string;
  cardId?: string; // Optional credit card used for this transaction
  accountId?: string; // Optional bank account linked to this transaction
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
  category: string; // category id (expense or income)
  transactionType?: TransactionType; // omit = expense for legacy rules
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

export interface UserCard {
  id: string;
  name: string;
  currentSpend: number; // Current month spend on this card
  lastUpdated?: string; // ISO date string
  isCustom?: boolean; // Flag for custom user-added cards
  minSpend?: number; // Custom minimum spend for custom cards
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  lastUpdated?: string; // ISO date-time; set only on explicit user confirm/edit
}