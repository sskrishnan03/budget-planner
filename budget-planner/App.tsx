import React, { useState, useEffect } from 'react';
import type { Page, Transaction, BudgetCategory, SavingsGoal, BudgetGoal, Theme, AccentColor, Currency, FontSize } from './types';
import { CATEGORY_COLORS, INCOME_CATEGORIES, ACCENT_COLORS } from './constants';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Expenses from './pages/Expenses';
import Savings from './pages/Savings';
import Settings from './pages/Settings';
import GlobalAIAssistant from './components/GlobalAIAssistant';
import AIFloatingButton from './components/AIFloatingButton';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  
  const determineInitialState = <T,>(key: string, defaultValue: T): T => {
    const savedValue = localStorage.getItem(key);
    if (savedValue) {
        try {
            const parsed = JSON.parse(savedValue);
            // Basic type check to avoid assigning object to primitive type
            if (typeof parsed === typeof defaultValue) {
                return parsed;
            }
        } catch (e) {
            // if parsing fails, it might be a simple string like 'dark'
             if (typeof savedValue === typeof defaultValue) {
                return savedValue as unknown as T;
            }
        }
    }
    if (key === 'theme' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark' as T;
    }
    return defaultValue;
  };


  const [theme, setTheme] = useState<Theme>(() => determineInitialState('theme', 'light'));
  const [accentColor, setAccentColor] = useState<AccentColor>(() => determineInitialState('accentColor', 'red'));
  const [currency, setCurrency] = useState<Currency>(() => determineInitialState('currency', 'USD'));
  const [fontSize, setFontSize] = useState<FontSize>(() => determineInitialState('fontSize', 'md'));


  const [monthlyIncome, setMonthlyIncome] = useState<number>(() => determineInitialState('monthlyIncome', 0));
  const [budget, setBudget] = useState<BudgetCategory[]>(() => determineInitialState('budget', [{ id: 'default-other', name: 'Other', amount: 0, color: '#6b7280' }]));
  const [transactions, setTransactions] = useState<Transaction[]>(() => determineInitialState('transactions', []));
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => determineInitialState('savingsGoals', []));
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>(() => determineInitialState('budgetGoals', []));
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => determineInitialState('incomeCategories', INCOME_CATEGORIES));
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'sm') root.classList.add('text-sm');
    else if (fontSize === 'lg') root.classList.add('text-lg');
    else root.classList.add('text-base');
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = ACCENT_COLORS[accentColor];
    for (const [key, value] of Object.entries(colors)) {
        if (key.startsWith('secondary-')) {
            const secondaryKey = key.replace('secondary-', '');
            root.style.setProperty(`--color-secondary-${secondaryKey}`, value);
        } else {
            root.style.setProperty(`--color-primary-${key}`, value);
        }
    }
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);
  useEffect(() => { localStorage.setItem('monthlyIncome', JSON.stringify(monthlyIncome)); }, [monthlyIncome]);
  useEffect(() => { localStorage.setItem('budget', JSON.stringify(budget)); }, [budget]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('savingsGoals', JSON.stringify(savingsGoals)); }, [savingsGoals]);
  useEffect(() => { localStorage.setItem('budgetGoals', JSON.stringify(budgetGoals)); }, [budgetGoals]);
  useEffect(() => { localStorage.setItem('incomeCategories', JSON.stringify(incomeCategories)); }, [incomeCategories]);
  

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...transaction, id: new Date().toISOString() };
    setTransactions(prev => [newTransaction, ...prev]);
  };
  
  const handleAddMultipleTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const transactionsWithIds = newTransactions.map((transaction, index) => ({
      ...transaction,
      id: `${new Date().toISOString()}-${index}`,
    }));
    setTransactions(prev => [...transactionsWithIds, ...prev]);
  };

  const handleUpdateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };
  
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddSavingsGoal = (goal: Omit<SavingsGoal, 'id' | 'color'>) => {
    const newGoal: SavingsGoal = {
        ...goal,
        id: new Date().toISOString(),
        color: CATEGORY_COLORS[savingsGoals.length % CATEGORY_COLORS.length],
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const handleUpdateSavingsGoal = (updatedGoal: SavingsGoal) => {
    setSavingsGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteSavingsGoal = (id: string) => {
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleAddBudgetGoal = (goal: Omit<BudgetGoal, 'id'>) => {
    const newGoal = { ...goal, id: new Date().toISOString() };
    setBudgetGoals(prev => [...prev, newGoal]);
  };

  const handleUpdateBudgetGoal = (updatedGoal: BudgetGoal) => {
    setBudgetGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };

  const handleDeleteBudgetGoal = (id: string) => {
    setBudgetGoals(prev => prev.filter(g => g.id !== id));
  };

  const escapeCsvField = (field: any): string => {
      const stringField = String(field ?? '');
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
  };

  const handleExportData = () => {
    const appData = {
      theme,
      accentColor,
      currency,
      fontSize,
      monthlyIncome,
      budget: JSON.stringify(budget),
      transactions: JSON.stringify(transactions),
      savingsGoals: JSON.stringify(savingsGoals),
      budgetGoals: JSON.stringify(budgetGoals),
      incomeCategories: JSON.stringify(incomeCategories),
    };

    const csvRows = ["key,value"];
    for (const [key, value] of Object.entries(appData)) {
        csvRows.push(`${escapeCsvField(key)},${escapeCsvField(value)}`);
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-planner-backup-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('File content is not readable');
        }
        
        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length === 0 || lines[0].trim().toLowerCase() !== 'key,value') {
            throw new Error('Invalid CSV format. Header "key,value" not found.');
        }

        const rawData: { [key: string]: any } = {};
        lines.slice(1).forEach(line => {
            const separatorIndex = line.indexOf(',');
            if (separatorIndex === -1) return;
            
            const key = line.substring(0, separatorIndex).trim();
            let value = line.substring(separatorIndex + 1);

            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }
            rawData[key] = value;
        });
        
        const parsedData = {
          theme: rawData.theme || 'light',
          accentColor: rawData.accentColor || 'red',
          currency: rawData.currency || 'USD',
          fontSize: rawData.fontSize || 'md',
          monthlyIncome: parseFloat(rawData.monthlyIncome) || 0,
          budget: JSON.parse(rawData.budget || '[]'),
          transactions: JSON.parse(rawData.transactions || '[]'),
          savingsGoals: JSON.parse(rawData.savingsGoals || '[]'),
          budgetGoals: JSON.parse(rawData.budgetGoals || '[]'),
          incomeCategories: JSON.parse(rawData.incomeCategories || JSON.stringify(INCOME_CATEGORIES)),
        };
        
        if (typeof parsedData.monthlyIncome !== 'number' || !Array.isArray(parsedData.transactions)) {
            throw new Error('Data validation failed. Check file contents.');
        }

        setTheme(parsedData.theme as Theme);
        setAccentColor(parsedData.accentColor as AccentColor);
        setCurrency(parsedData.currency as Currency);
        setFontSize(parsedData.fontSize as FontSize);
        setMonthlyIncome(parsedData.monthlyIncome);
        setBudget(parsedData.budget);
        setTransactions(parsedData.transactions);
        setSavingsGoals(parsedData.savingsGoals);
        setBudgetGoals(parsedData.budgetGoals);
        setIncomeCategories(parsedData.incomeCategories);

        alert('Data imported successfully!');
        setActivePage('Dashboard');

      } catch (error) {
        console.error('Import failed:', error);
        alert(`Failed to import data. ${error instanceof Error ? error.message : ''}`);
      }
    };
    reader.readAsText(file);
  };

  const renderPage = () => {
    const pageProps = { transactions, budget, savingsGoals, monthlyIncome, budgetGoals, currency };
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard {...pageProps} />;
      case 'Budget':
        return <Budget 
                  budget={budget} 
                  setBudget={setBudget} 
                  monthlyIncome={monthlyIncome} 
                  setMonthlyIncome={setMonthlyIncome} 
                  transactions={transactions}
                  budgetGoals={budgetGoals}
                  onAddGoal={handleAddBudgetGoal}
                  onUpdateGoal={handleUpdateBudgetGoal}
                  onDeleteGoal={handleDeleteBudgetGoal}
                  currency={currency}
                />;
      case 'Expenses':
        return <Expenses 
                  transactions={transactions} 
                  onAddTransaction={handleAddTransaction}
                  onAddMultipleTransactions={handleAddMultipleTransactions}
                  onUpdateTransaction={handleUpdateTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                  expenseCategories={budget.map(b => b.name)} 
                  incomeCategories={incomeCategories}
                  currency={currency}
                />;
      case 'Savings':
        return <Savings 
                  savingsGoals={savingsGoals} 
                  onAddGoal={handleAddSavingsGoal}
                  onUpdateGoal={handleUpdateSavingsGoal}
                  onDeleteGoal={handleDeleteSavingsGoal}
                  currency={currency}
                />;
      case 'Settings':
        return <Settings
                  theme={theme}
                  setTheme={setTheme}
                  accentColor={accentColor}
                  setAccentColor={setAccentColor}
                  currency={currency}
                  setCurrency={setCurrency}
                  fontSize={fontSize}
                  setFontSize={setFontSize}
                  incomeCategories={incomeCategories}
                  setIncomeCategories={setIncomeCategories}
                  expenseCategories={budget.map(b => b.name)}
                  onExport={handleExportData}
                  onImport={handleImportData}
                />;
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  const aiAssistantData = {
    transactions,
    budget,
    savingsGoals,
    monthlyIncome,
    budgetGoals,
    currency,
    settings: { theme, accentColor, currency, fontSize }
  };


  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <Header activePage={activePage} setActivePage={setActivePage} />
      <main className="p-4 sm:p-6 lg:p-8 w-full">
        {renderPage()}
      </main>
      <AIFloatingButton onClick={() => setIsAiModalOpen(true)} />
      <GlobalAIAssistant 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        data={aiAssistantData}
      />
    </div>
  );
};

export default App;