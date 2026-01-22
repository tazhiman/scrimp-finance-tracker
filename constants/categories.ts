import { Category } from '@/types';

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#FFE66D' },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#95E1D3' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#F38181' },
  { id: 'health', name: 'Health & Fitness', icon: '💊', color: '#AA96DA' },
  { id: 'education', name: 'Education', icon: '📚', color: '#FCBAD3' },
  { id: 'other', name: 'Other', icon: '📦', color: '#95A5A6' },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: '💼', color: '#4CAF50' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#2196F3' },
  { id: 'investment', name: 'Investment', icon: '📈', color: '#FF9800' },
  { id: 'gift', name: 'Gift', icon: '🎁', color: '#E91E63' },
  { id: 'other', name: 'Other', icon: '💰', color: '#9E9E9E' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryById = (id: string): Category | undefined => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

