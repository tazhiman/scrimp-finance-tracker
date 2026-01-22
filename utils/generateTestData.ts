import { Transaction, SavingsGoal } from '@/types';
import { subMonths, subDays, startOfMonth, addDays, format } from 'date-fns';

// Helper to generate random number in range
const randomInRange = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper to generate random float in range
const randomFloatInRange = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

// Helper to get random item from array
const randomItem = <T,>(array: T[]): T => {
  return array[randomInRange(0, array.length - 1)];
};

// Generate a date within a specific month
const generateDateInMonth = (year: number, month: number, dayRange: { min: number; max: number }): string => {
  const day = randomInRange(dayRange.min, dayRange.max);
  const date = new Date(year, month, day);
  return format(date, 'yyyy-MM-dd');
};

// Transaction templates with realistic amounts
const TRANSACTION_TEMPLATES = {
  income: [
    { category: 'salary', amount: { min: 3000, max: 5000 }, dayRange: { min: 1, max: 5 }, description: 'Monthly salary' },
    { category: 'freelance', amount: { min: 500, max: 1500 }, dayRange: { min: 10, max: 25 }, description: 'Freelance project', probability: 0.3 },
    { category: 'investment', amount: { min: 100, max: 500 }, dayRange: { min: 1, max: 28 }, description: 'Investment returns', probability: 0.2 },
  ],
  expenses: [
    // Fixed expenses
    { category: 'bills', amount: { min: 1150, max: 1250 }, dayRange: { min: 1, max: 5 }, description: 'Rent', probability: 1.0 },
    { category: 'bills', amount: { min: 120, max: 180 }, dayRange: { min: 15, max: 20 }, description: 'Utilities', probability: 1.0 },
    { category: 'bills', amount: { min: 50, max: 70 }, dayRange: { min: 10, max: 15 }, description: 'Internet', probability: 1.0 },
    { category: 'bills', amount: { min: 40, max: 60 }, dayRange: { min: 5, max: 10 }, description: 'Phone bill', probability: 1.0 },
    
    // Variable expenses - Food
    { category: 'food', amount: { min: 40, max: 120 }, dayRange: { min: 1, max: 28 }, description: 'Groceries', probability: 0.8 },
    { category: 'food', amount: { min: 15, max: 50 }, dayRange: { min: 1, max: 28 }, description: 'Restaurant', probability: 0.6 },
    { category: 'food', amount: { min: 5, max: 15 }, dayRange: { min: 1, max: 28 }, description: 'Coffee', probability: 0.5 },
    
    // Transportation
    { category: 'transport', amount: { min: 30, max: 80 }, dayRange: { min: 1, max: 28 }, description: 'Gas', probability: 0.7 },
    { category: 'transport', amount: { min: 10, max: 30 }, dayRange: { min: 1, max: 28 }, description: 'Public transit', probability: 0.4 },
    { category: 'transport', amount: { min: 20, max: 60 }, dayRange: { min: 1, max: 28 }, description: 'Uber/Lyft', probability: 0.3 },
    
    // Shopping
    { category: 'shopping', amount: { min: 30, max: 200 }, dayRange: { min: 1, max: 28 }, description: 'Clothing', probability: 0.3 },
    { category: 'shopping', amount: { min: 20, max: 100 }, dayRange: { min: 1, max: 28 }, description: 'Online shopping', probability: 0.4 },
    { category: 'shopping', amount: { min: 50, max: 300 }, dayRange: { min: 1, max: 28 }, description: 'Electronics', probability: 0.15 },
    
    // Entertainment
    { category: 'entertainment', amount: { min: 15, max: 50 }, dayRange: { min: 1, max: 28 }, description: 'Movies/Events', probability: 0.4 },
    { category: 'entertainment', amount: { min: 10, max: 30 }, dayRange: { min: 1, max: 28 }, description: 'Streaming services', probability: 0.3 },
    { category: 'entertainment', amount: { min: 30, max: 100 }, dayRange: { min: 1, max: 28 }, description: 'Concert/Show', probability: 0.2 },
    
    // Health
    { category: 'health', amount: { min: 20, max: 80 }, dayRange: { min: 1, max: 28 }, description: 'Pharmacy', probability: 0.3 },
    { category: 'health', amount: { min: 30, max: 100 }, dayRange: { min: 1, max: 28 }, description: 'Gym membership', probability: 0.4 },
    { category: 'health', amount: { min: 50, max: 200 }, dayRange: { min: 1, max: 28 }, description: 'Doctor visit', probability: 0.15 },
    
    // Education
    { category: 'education', amount: { min: 20, max: 100 }, dayRange: { min: 1, max: 28 }, description: 'Books', probability: 0.2 },
    { category: 'education', amount: { min: 30, max: 150 }, dayRange: { min: 1, max: 28 }, description: 'Online course', probability: 0.15 },
    
    // Other
    { category: 'other', amount: { min: 20, max: 150 }, dayRange: { min: 1, max: 28 }, description: 'Misc expense', probability: 0.3 },
  ],
};

// Generate transactions for a specific month
const generateMonthTransactions = (year: number, month: number, isHolidayMonth: boolean = false): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Generate income
  TRANSACTION_TEMPLATES.income.forEach(template => {
    const shouldGenerate = !template.probability || Math.random() < template.probability;
    if (shouldGenerate) {
      const date = generateDateInMonth(year, month, template.dayRange);
      transactions.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'income',
        category: template.category,
        amount: randomFloatInRange(template.amount.min, template.amount.max),
        date,
        createdAt: new Date(`${date}T${String(randomInRange(8, 20)).padStart(2, '0')}:${String(randomInRange(0, 59)).padStart(2, '0')}:00.000Z`).toISOString(),
        description: template.description,
      });
    }
  });
  
  // Generate expenses
  TRANSACTION_TEMPLATES.expenses.forEach(template => {
    let shouldGenerate = !template.probability || Math.random() < template.probability;
    
    // Increase holiday spending
    if (isHolidayMonth && (template.category === 'shopping' || template.category === 'food' || template.category === 'entertainment')) {
      shouldGenerate = true;
    }
    
    if (shouldGenerate) {
      let amount = randomFloatInRange(template.amount.min, template.amount.max);
      
      // Increase amounts in holiday months
      if (isHolidayMonth && template.category === 'shopping') {
        amount *= 1.5;
      }
      
      const date = generateDateInMonth(year, month, template.dayRange);
      transactions.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'expense',
        category: template.category,
        amount: Math.round(amount * 100) / 100,
        date,
        createdAt: new Date(`${date}T${String(randomInRange(8, 20)).padStart(2, '0')}:${String(randomInRange(0, 59)).padStart(2, '0')}:00.000Z`).toISOString(),
        description: template.description,
      });
    }
  });
  
  return transactions;
};

// Generate 2 years of transactions
export const generateTransactions = (): Transaction[] => {
  const allTransactions: Transaction[] = [];
  const today = new Date();
  
  // Generate for last 24 months
  for (let i = 23; i >= 0; i--) {
    const date = subMonths(today, i);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // November and December are holiday months
    const isHolidayMonth = month === 10 || month === 11;
    
    const monthTransactions = generateMonthTransactions(year, month, isHolidayMonth);
    allTransactions.push(...monthTransactions);
  }
  
  // Sort by date
  return allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Generate savings goals with realistic progress
export const generateGoals = (): SavingsGoal[] => {
  const today = new Date();
  
  const goals: SavingsGoal[] = [
    // Completed vacation fund
    {
      id: `goal-${Date.now()}-1`,
      name: 'Vacation Fund',
      targetAmount: 3000,
      currentAmount: 3000, // Completed
      contributionAmount: 250,
      frequency: 'monthly',
      startDate: format(subMonths(today, 18), 'yyyy-MM-dd'),
      endDate: format(subMonths(today, 6), 'yyyy-MM-dd'),
      lastContributionDate: format(subMonths(today, 6), 'yyyy-MM-dd'), // Completed 6 months ago
    },
    // In-progress emergency fund - paid this month (completed status)
    {
      id: `goal-${Date.now()}-2`,
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentAmount: 6000, // 60% complete
      contributionAmount: 500,
      frequency: 'monthly',
      startDate: format(subMonths(today, 15), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 180), 'yyyy-MM-dd'), // 6 months from now
      lastContributionDate: format(subDays(today, 3), 'yyyy-MM-dd'), // Contributed 3 days ago (this month)
    },
    // Recently started laptop fund - overdue (no contribution this month)
    {
      id: `goal-${Date.now()}-3`,
      name: 'New Laptop',
      targetAmount: 2000,
      currentAmount: 400, // Just started
      contributionAmount: 150,
      frequency: 'monthly',
      startDate: format(subMonths(today, 3), 'yyyy-MM-dd'),
      endDate: format(addDays(today, 360), 'yyyy-MM-dd'), // ~1 year from now
      lastContributionDate: format(subMonths(today, 2), 'yyyy-MM-dd'), // Last contribution 2 months ago (overdue)
    },
  ];
  
  return goals;
};

// Main function to generate all test data
export const generateTestData = (): { transactions: Transaction[]; goals: SavingsGoal[] } => {
  console.log('Generating 2 years of test data...');
  
  const transactions = generateTransactions();
  const goals = generateGoals();
  
  console.log(`Generated ${transactions.length} transactions and ${goals.length} goals`);
  
  return {
    transactions,
    goals,
  };
};
