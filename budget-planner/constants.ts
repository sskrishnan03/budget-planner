import type { Page } from './types';

export const NAV_LINKS: { name: Page; href: string }[] = [
  { name: 'Dashboard', href: '#dashboard' },
  { name: 'Budget', href: '#budget' },
  { name: 'Expenses', href: '#expenses' },
  { name: 'Savings', href: '#savings' },
  { name: 'Settings', href: '#settings'},
];

export const CATEGORY_COLORS = [
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // violet-500
  '#3b82f6', // blue-500
  '#6b7280', // gray-500
  '#d946ef', // fuchsia-500
  '#10b981', // emerald-500
];

export const SAVINGS_GOAL_CATEGORIES = ['Emergency', 'Travel', 'Transportation', 'Home', 'Investment', 'Other'];

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gifts', 'Other'];

export const ACCENT_COLORS = {
  red: {
    '50': '#fef2f2', '100': '#fee2e2', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c',
    'secondary-500': '#f97316', 'secondary-600': '#ea580c',
  },
  blue: {
    '50': '#eff6ff', '100': '#dbeafe', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
    'secondary-500': '#0ea5e9', 'secondary-600': '#0284c7',
  },
  green: {
    '50': '#f0fdf4', '100': '#dcfce7', '500': '#22c55e', '600': '#16a34a', '700': '#15803d',
    'secondary-500': '#10b981', 'secondary-600': '#059669',
  },
  purple: {
    '50': '#f5f3ff', '100': '#ede9fe', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9',
    'secondary-500': '#a855f7', 'secondary-600': '#9333ea',
  },
};