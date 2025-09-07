import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import type { Transaction, BudgetCategory, SavingsGoal, Currency } from '../types';
import StatCard from '../components/StatCard';
import { TrendUpIcon } from '../components/icons/TrendUpIcon';
import { DollarIcon } from '../components/icons/DollarIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { CATEGORY_COLORS } from '../constants';

interface DashboardProps {
  transactions: Transaction[];
  budget: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  monthlyIncome: number;
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, savingsGoals, monthlyIncome, currency }) => {

  const { totalIncome, totalExpenses, savingsProgress, netBalance, expenseByCategory, incomeByCategory } = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const progress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    
    const byCategory = transactions
      .filter(t => t.type === 'Expense')
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { name: t.category, value: 0 };
        }
        acc[t.category].value += t.amount;
        return acc;
      }, {} as { [key: string]: { name: string, value: number } });

    const categoryData = Object.values(byCategory).map(c => {
        const budgetCategory = budget.find(b => b.name === c.name);
        return {...c, color: budgetCategory?.color || '#8884d8'};
    });
    
    const byIncomeCategory = transactions
      .filter(t => t.type === 'Income' && t.category)
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = { name: t.category, value: 0 };
        }
        acc[t.category].value += t.amount;
        return acc;
      }, {} as { [key: string]: { name: string, value: number } });

    const incomeCategoryData = Object.values(byIncomeCategory).map((c, index) => ({
      ...c,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));

    return {
      totalIncome: income,
      totalExpenses: expenses,
      savingsProgress: progress,
      netBalance: income - expenses,
      expenseByCategory: categoryData,
      incomeByCategory: incomeCategoryData,
    };
  }, [transactions, budget, savingsGoals]);

  const monthlyOverviewData = useMemo(() => {
    const months: { [key: string]: { name: string; income: number; expenses: number; year: number; month: number; } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    transactions.forEach(t => {
        const date = new Date(t.date);
        if (isNaN(date.getTime())) {
          return;
        }
        const year = date.getFullYear();
        const month = date.getMonth();
        const key = `${year}-${month}`;
        
        if (!months[key]) {
            const shortYear = year.toString().slice(-2);
            months[key] = { name: `${monthNames[month]} '${shortYear}`, income: 0, expenses: 0, year, month };
        }
        
        if (t.type === 'Income') {
            months[key].income += t.amount;
        } else {
            months[key].expenses += t.amount;
        }
    });

    const sortedData = Object.values(months).sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.month - b.month;
    });
    
    return sortedData.map(({name, income, expenses}) => ({name, income, expenses}));
}, [transactions]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-700 p-2 border border-slate-200 dark:border-slate-600 rounded shadow-sm">
          <p className="font-bold text-slate-800 dark:text-slate-100">{`${payload[0].name}: ${formatCurrency(payload[0].value, currency)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Financial Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">An overview of your financial health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Income" value={formatCurrency(totalIncome, currency)} icon={<DollarIcon />} />
        <StatCard title="Total Expenses" value={formatCurrency(totalExpenses, currency)} icon={<DollarIcon />} />
        <StatCard title="Net Balance" value={formatCurrency(netBalance, currency)} icon={<DollarIcon />} />
        <StatCard title="Savings Progress" value={`${savingsProgress.toFixed(1)}%`} icon={<TargetIcon />} />
      </div>
      
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Monthly Overview</h2>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyOverviewData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: 'rgb(100 116 139)' }} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} tick={{ fill: 'rgb(100 116 139)' }} />
              <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', border: '1px solid #e5e7eb', borderRadius: '0.5rem'}} />
              <Legend iconType="circle" />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-primary-500)" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center">
            <ClockIcon />
            <span className="ml-2">Expense Categories</span>
          </h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {expenseByCategory.map((entry) => (
              <div key={entry.name} className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
                <span className="font-medium ml-1 text-slate-800 dark:text-slate-100">{formatCurrency(entry.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center">
            <TrendUpIcon />
            <span className="ml-2">Income Categories</span>
          </h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#82ca9d" paddingAngle={5}>
                  {incomeByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {incomeByCategory.map((entry) => (
              <div key={entry.name} className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
                <span className="font-medium ml-1 text-slate-800 dark:text-slate-100">{formatCurrency(entry.value, currency)}</span>
              </div>
            ))}
             {incomeByCategory.length === 0 && <p className="col-span-2 text-slate-500 text-center">No categorized income this period.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;