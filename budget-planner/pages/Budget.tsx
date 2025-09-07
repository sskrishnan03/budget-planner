import React, { useState, useMemo } from 'react';
import type { BudgetCategory, Transaction, BudgetGoal, Currency } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EditIcon } from '../components/icons/EditIcon';
import Modal from '../components/Modal';

interface BudgetProps {
  budget: BudgetCategory[];
  setBudget: React.Dispatch<React.SetStateAction<BudgetCategory[]>>;
  monthlyIncome: number;
  setMonthlyIncome: React.Dispatch<React.SetStateAction<number>>;
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  onAddGoal: (goal: Omit<BudgetGoal, 'id'>) => void;
  onUpdateGoal: (goal: BudgetGoal) => void;
  onDeleteGoal: (id: string) => void;
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const getDeadlineDisplay = (deadline: string) => {
  if (!deadline) {
    return { text: 'No deadline', className: 'text-slate-400' };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = deadline.split('-').map(part => parseInt(part, 10));
  const deadlineDate = new Date(parts[0], parts[1] - 1, parts[2]);
  
  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)} days overdue`, className: 'text-red-500 font-semibold' };
  } else if (diffDays === 0) {
    return { text: 'Due today', className: 'text-orange-500 font-semibold' };
  } else if (diffDays === 1) {
    return { text: 'Due tomorrow', className: 'text-yellow-600' };
  } else {
    return { text: `${diffDays} days left`, className: 'text-slate-500' };
  }
};


const Budget: React.FC<BudgetProps> = ({ budget, setBudget, monthlyIncome, setMonthlyIncome, transactions, budgetGoals, onAddGoal, onUpdateGoal, onDeleteGoal, currency }) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');


  const handleAddCategory = () => {
    if (newCategoryName.trim() && parseFloat(newCategoryAmount) > 0) {
      const newCategory: BudgetCategory = {
        id: new Date().toISOString(),
        name: newCategoryName.trim(),
        amount: parseFloat(newCategoryAmount),
        color: newCategoryColor,
      };
      setBudget([...budget, newCategory]);
      setNewCategoryName('');
      setNewCategoryAmount('');
      setNewCategoryColor(CATEGORY_COLORS[budget.length % CATEGORY_COLORS.length]);
    }
  };

  const handleUpdateCategory = (id: string, field: 'name' | 'amount' | 'color', value: string) => {
    setBudget(budget.map(cat => {
      if (cat.id === id) {
        if (field === 'name' && id === 'default-other') {
          return cat;
        }
        return { ...cat, [field]: field === 'amount' ? (parseFloat(value) || 0) : value };
      }
      return cat;
    }));
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'default-other') return;
    setBudget(budget.filter(cat => cat.id !== id));
  };
  
  const handleOpenAddModal = (categoryId: string) => {
    setEditingGoal(null);
    setCurrentCategoryId(categoryId);
    setGoalTitle('');
    setGoalTarget('');
    setGoalDeadline('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: BudgetGoal) => {
    setEditingGoal(goal);
    setCurrentCategoryId(goal.categoryId);
    setGoalTitle(goal.title);
    setGoalTarget(String(goal.targetAmount));
    setGoalDeadline(goal.deadline);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
    setCurrentCategoryId(null);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goalData = {
      title: goalTitle,
      targetAmount: parseFloat(goalTarget),
      deadline: goalDeadline,
    };
    if (editingGoal) {
      onUpdateGoal({ ...editingGoal, ...goalData });
    } else if (currentCategoryId) {
      onAddGoal({ ...goalData, categoryId: currentCategoryId });
    }
    handleCloseModal();
  };

  const { totalBudget, remaining, allocation } = useMemo(() => {
    const total = budget.reduce((sum, cat) => sum + cat.amount, 0);
    const alloc = budget.map(cat => ({
        name: cat.name,
        percentage: total > 0 ? ((cat.amount / total) * 100).toFixed(1) : '0.0'
    }));

    return {
        totalBudget: total,
        remaining: monthlyIncome - total,
        allocation: alloc
    };
  }, [budget, monthlyIncome]);

  const budgetVsActualData = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const actualSpending = transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'Expense' &&
                   tDate.getMonth() === currentMonth &&
                   tDate.getFullYear() === currentYear;
        })
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as { [key: string]: number });
    
    const allCategoryNames = new Set([...budget.map(b => b.name), ...Object.keys(actualSpending)]);

    const reportData = Array.from(allCategoryNames).map(categoryName => {
        const budgetCategory = budget.find(b => b.name === categoryName);
        const budgetedAmount = budgetCategory?.amount || 0;
        const actualAmount = actualSpending[categoryName] || 0;
        
        return {
            categoryName,
            color: budgetCategory?.color || '#6b7280', // default gray for categories with spending but no budget
            budgeted: budgetedAmount,
            actual: actualAmount,
            variance: budgetedAmount - actualAmount,
        };
    }).sort((a, b) => b.budgeted - a.budgeted);
    
    const totalBudgeted = reportData.reduce((sum, row) => sum + row.budgeted, 0);
    const totalActual = reportData.reduce((sum, row) => sum + row.actual, 0);

    return {
        rows: reportData,
        totals: {
            budgeted: totalBudgeted,
            actual: totalActual,
            variance: totalBudgeted - totalActual,
        }
    };
  }, [transactions, budget]);


  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Budget Planning</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Set up your monthly budget and spending goals</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Budget vs. Actual (Current Month)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-right">Budgeted</th>
                      <th className="p-3 text-right">Actual</th>
                      <th className="p-3 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgetVsActualData.rows.map(row => (
                      <tr key={row.categoryName} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-100 flex items-center">
                          <span className="w-3 h-3 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: row.color }}></span>
                          {row.categoryName}
                        </td>
                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(row.budgeted, currency)}</td>
                        <td className="p-3 text-right text-slate-600 dark:text-slate-300">{formatCurrency(row.actual, currency)}</td>
                        <td className={`p-3 text-right font-semibold ${row.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {row.variance < 0 ? '-' : ''}{formatCurrency(Math.abs(row.variance), currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-200 dark:border-slate-700">
                    <tr>
                        <td className="p-3">Total</td>
                        <td className="p-3 text-right">{formatCurrency(budgetVsActualData.totals.budgeted, currency)}</td>
                        <td className="p-3 text-right">{formatCurrency(budgetVsActualData.totals.actual, currency)}</td>
                        <td className={`p-3 text-right ${budgetVsActualData.totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {budgetVsActualData.totals.variance < 0 ? '-' : ''}{formatCurrency(Math.abs(budgetVsActualData.totals.variance), currency)}
                        </td>
                    </tr>
                  </tfoot>
                </table>
                 {budgetVsActualData.rows.length === 0 && <p className="text-center text-slate-500 py-8">No budget or spending data for the current month.</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Budget Categories & Goals</h2>
              <div className="space-y-4">
                {budget.map(cat => {
                  const isOtherCategory = cat.id === 'default-other';
                  const categoryGoals = budgetGoals.filter(g => g.categoryId === cat.id);
                  return (
                    <div key={cat.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={cat.color}
                          onChange={(e) => handleUpdateCategory(cat.id, 'color', e.target.value)}
                          className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                          aria-label={`Change color for ${cat.name}`}
                        />
                        <input 
                          type="text"
                          value={cat.name}
                          onChange={(e) => handleUpdateCategory(cat.id, 'name', e.target.value)}
                          className={`flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 ${isOtherCategory ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : ''}`}
                          disabled={isOtherCategory}
                          readOnly={isOtherCategory}
                        />
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                          <input 
                            type="number"
                            value={cat.amount}
                            onChange={(e) => handleUpdateCategory(cat.id, 'amount', e.target.value)}
                            className="w-32 p-2 pl-7 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                          />
                        </div>
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)} 
                          disabled={isOtherCategory} 
                          className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Spending Goals for {cat.name}</h4>
                          <button onClick={() => handleOpenAddModal(cat.id)} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 font-semibold dark:bg-slate-700 dark:text-primary-300 dark:hover:bg-slate-600">+ Add Goal</button>
                        </div>
                        {categoryGoals.length > 0 ? (
                          <div className="space-y-3 mt-2">
                            {categoryGoals.map(goal => {
                              const goalDate = new Date(goal.deadline);
                              const goalMonth = goalDate.getMonth();
                              const goalYear = goalDate.getFullYear();
                              const spent = transactions
                                .filter(t => {
                                    const tDate = new Date(t.date);
                                    return t.category === cat.name && t.type === 'Expense' && tDate.getMonth() === goalMonth && tDate.getFullYear() === goalYear;
                                })
                                .reduce((sum, t) => sum + t.amount, 0);
                              const progress = goal.targetAmount > 0 ? Math.min((spent / goal.targetAmount) * 100, 100) : 0;
                              const isOver = spent > goal.targetAmount;
                              const deadlineDisplay = getDeadlineDisplay(goal.deadline);
                              return (
                                <div key={goal.id} className="text-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-medium text-slate-800 dark:text-slate-100">{goal.title}</span>
                                      <div className={`flex items-center mt-1 text-xs ${deadlineDisplay.className}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{deadlineDisplay.text}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1 flex-shrink-0">
                                      <button onClick={() => handleOpenEditModal(goal)} className="p-1 text-slate-400 hover:text-blue-500"><EditIcon /></button>
                                      <button onClick={() => {if(window.confirm('Delete this goal?')) onDeleteGoal(goal.id)}} className="p-1 text-slate-400 hover:text-red-500"><TrashIcon /></button>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                      <div className={`h-2 rounded-full ${isOver ? 'bg-red-500' : ''}`} style={{ width: `${progress}%`, backgroundColor: isOver ? undefined : cat.color }}></div>
                                    </div>
                                    <span className="text-xs font-semibold" style={{ color: isOver ? '#ef4444' : cat.color }}>{progress.toFixed(0)}%</span>
                                  </div>
                                   <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                                      <span className="font-semibold" style={{ color: isOver ? '#ef4444' : cat.color }}>
                                          {formatCurrency(spent, currency)} spent
                                      </span>
                                      <span>Target: {formatCurrency(goal.targetAmount, currency)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 italic">No goals set for this category.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 border-t dark:border-slate-700 pt-4">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Add New Category</h3>
                <div className="flex items-center space-x-3 mt-2">
                   <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-8 h-8 p-0 border-none rounded-md cursor-pointer bg-transparent"
                      aria-label="Select color for new category"
                    />
                  <input 
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                    className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                  />
                   <div className="relative">
                     <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">$</span>
                    <input 
                      type="number"
                      value={newCategoryAmount}
                      onChange={(e) => setNewCategoryAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-32 p-2 pl-7 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                    />
                  </div>
                  <button onClick={handleAddCategory} className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md hover:from-primary-700 hover:to-secondary-600 font-semibold">
                    + Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md sticky top-24">
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
                    <span className="text-primary-500 text-2xl mr-2">$</span> Monthly Income
                  </h2>
                  <input 
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800"
                    placeholder="e.g., 6500"
                  />
                  <div className="space-y-4 mt-8">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Budget Summary</h2>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span>Total Income:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(monthlyIncome, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span>Total Budget:</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(totalBudget, currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t dark:border-slate-700 pt-2">
                          <span className="font-bold">Remaining:</span>
                          <span className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(remaining, currency)}</span>
                      </div>
                  </div>

                  <div className="mt-8">
                      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Budget Allocation</h2>
                      <div className="mt-4 space-y-2 text-sm">
                          {allocation.map(item => (
                              <div key={item.name} className="flex justify-between text-slate-600 dark:text-slate-300">
                                  <span>{item.name}:</span>
                                  <span className="font-medium text-slate-800 dark:text-slate-100">{item.percentage}%</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGoal ? 'Edit Spending Goal' : 'Add New Spending Goal'}>
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Goal Title</label>
            <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="e.g., Limit coffee runs" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Amount</label>
            <input type="number" step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="e.g., 75" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Deadline</label>
            <input type="date" value={goalDeadline} onChange={e => setGoalDeadline(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md hover:from-primary-700 hover:to-secondary-600">{editingGoal ? 'Save Changes' : 'Add Goal'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Budget;