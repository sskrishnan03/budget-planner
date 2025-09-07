import React, { useState, useMemo } from 'react';
import type { SavingsGoal, Currency } from '../types';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import { DollarIcon } from '../components/icons/DollarIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { TrendUpIcon } from '../components/icons/TrendUpIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { SAVINGS_GOAL_CATEGORIES } from '../constants';


interface SavingsProps {
  savingsGoals: SavingsGoal[];
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'color'>) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  currency: Currency;
}

const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const AddGoalForm: React.FC<{
  onAddGoal: (goal: Omit<SavingsGoal, 'id' | 'color'>) => void;
  onCancel: () => void;
}> = ({ onAddGoal, onCancel }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(SAVINGS_GOAL_CATEGORIES[0]);
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(title && parseFloat(targetAmount) > 0) {
        onAddGoal({
            title, category,
            targetAmount: parseFloat(targetAmount),
            currentAmount: parseFloat(currentAmount) || 0,
            deadline
        });
        setTitle(''); setCategory(SAVINGS_GOAL_CATEGORIES[0]); setTargetAmount(''); setCurrentAmount(''); setDeadline('');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md mb-8">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Add New Goal</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Goal title" className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required/>
        <select value={category} onChange={e => setCategory(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
            {SAVINGS_GOAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="Target amount" className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required/>
        <input type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="Current amount (optional)" className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md md:col-span-2 bg-white dark:bg-slate-700" required/>
        <div className="md:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md hover:from-primary-700 hover:to-secondary-600">Add Goal</button>
        </div>
      </form>
    </div>
  );
};


const Savings: React.FC<SavingsProps> = ({ savingsGoals, onAddGoal, onUpdateGoal, onDeleteGoal, currency }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const { totalSaved, totalTarget, overallProgress } = useMemo(() => {
    const saved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const target = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const progress = target > 0 ? (saved / target) * 100 : 0;
    return { totalSaved: saved, totalTarget: target, overallProgress: progress };
  }, [savingsGoals]);
  
  const handleAddGoal = (goal: Omit<SavingsGoal, 'id' | 'color'>) => {
    onAddGoal(goal);
    setShowAddForm(false);
  };
  
  const handleEditClick = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      onDeleteGoal(id);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGoal) {
      onUpdateGoal(editingGoal);
      setIsEditModalOpen(false);
      setEditingGoal(null);
    }
  };

  const daysOverdue = (deadline: string) => {
    if (!deadline) return 0;

    const today = new Date();
    today.setHours(0,0,0,0);
    const parts = deadline.split('-').map(part => parseInt(part, 10));
    const deadDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    if (today <= deadDate) return 0;
    
    const diffTime = today.getTime() - deadDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Track your progress towards financial goals</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Saved" value={formatCurrency(totalSaved, currency)} icon={<DollarIcon />} />
          <StatCard title="Total Target" value={formatCurrency(totalTarget, currency)} icon={<TargetIcon />} />
          <StatCard title="Overall Progress" value={`${overallProgress.toFixed(1)}%`} icon={<TrendUpIcon />} />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Goals</h2>
          {!showAddForm && <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-600">+ Add Goal</button>}
        </div>

        {showAddForm && <AddGoalForm onAddGoal={handleAddGoal} onCancel={() => setShowAddForm(false)} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savingsGoals.map((goal, index) => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const overdue = daysOverdue(goal.deadline);
              const progressBarColor = overdue > 0 ? '#ef4444' : goal.color;

              return (
            <div key={goal.id} 
                 className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md space-y-4 flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                 style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both` }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full" style={{backgroundColor: goal.color}}></span>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{goal.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{goal.category}</p>
                </div>
                <div className="flex space-x-2 text-slate-400">
                  <button onClick={() => handleEditClick(goal)} className="hover:text-slate-600"><EditIcon /></button>
                  <button onClick={() => handleDeleteClick(goal.id)} className="hover:text-red-500"><TrashIcon /></button>
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between text-sm font-medium mb-1 dark:text-slate-300"><span>Progress</span><span>{progress.toFixed(1)}%</span></div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressBarColor }}>
                  </div>
                </div>
              </div>
              <div className="text-sm space-y-2 text-slate-600 dark:text-slate-300 pt-2">
                <div className="flex justify-between"><span>Current:</span> <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(goal.currentAmount, currency)}</span></div>
                <div className="flex justify-between"><span>Target:</span> <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(goal.targetAmount, currency)}</span></div>
                <div className="flex justify-between"><span>Remaining:</span> <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), currency)}</span></div>
              </div>
              {overdue > 0 && <div className="text-xs text-red-500 font-semibold text-right">{overdue} days overdue</div>}
            </div>
          )})}
        </div>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Savings Goal">
          {editingGoal && (
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
               <input type="text" value={editingGoal.title} onChange={e => setEditingGoal({...editingGoal, title: e.target.value})} placeholder="Goal title" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required/>
               <select value={editingGoal.category} onChange={e => setEditingGoal({...editingGoal, category: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
                   {SAVINGS_GOAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
               </select>
               <input type="number" step="0.01" value={editingGoal.targetAmount} onChange={e => setEditingGoal({...editingGoal, targetAmount: parseFloat(e.target.value) || 0})} placeholder="Target amount" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required/>
               <input type="number" step="0.01" value={editingGoal.currentAmount} onChange={e => setEditingGoal({...editingGoal, currentAmount: parseFloat(e.target.value) || 0})} placeholder="Current amount" className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" />
               <input type="date" value={editingGoal.deadline} onChange={e => setEditingGoal({...editingGoal, deadline: e.target.value})} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required/>
               <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md hover:from-primary-700 hover:to-secondary-600">Save Changes</button>
              </div>
            </form>
          )}
      </Modal>
    </>
  );
};

export default Savings;