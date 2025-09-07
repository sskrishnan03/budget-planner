import React, { useState, useMemo } from 'react';
import type { Transaction, TransactionType, Currency } from '../types';
import Modal from '../components/Modal';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';

interface ExpensesProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onAddMultipleTransactions: (newTransactions: Omit<Transaction, 'id'>[]) => void;
  onUpdateTransaction: (updatedTransaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  expenseCategories: string[];
  incomeCategories: string[];
  currency: Currency;
}

type SortKey = 'date' | 'description' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}


const formatCurrency = (amount: number, currency: Currency) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

const Expenses: React.FC<ExpensesProps> = ({
  transactions,
  onAddTransaction,
  onAddMultipleTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  expenseCategories,
  incomeCategories,
  currency,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [type, setType] = useState<TransactionType>('Expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [filter, setFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setType('Expense');
    setDescription('');
    setAmount('');
    setCategory('Other');
    setDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setType(transaction.type);
    setDescription(transaction.description);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setDate(transaction.date.split('T')[0]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      type,
      description,
      amount: parseFloat(amount),
      category: category || (type === 'Income' ? 'Other' : 'Other'),
      date,
    };

    if (editingTransaction) {
      onUpdateTransaction({ ...editingTransaction, ...transactionData });
    } else {
      onAddTransaction(transactionData);
    }
    handleCloseModal();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (typeof content !== 'string') throw new Error("File content is not a string.");
        
        const lines = content.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            throw new Error("CSV file must have a header and at least one data row.");
        }

        const headerLine = lines.shift() as string;
        const headers = headerLine.split(',').map(h => h.trim());

        const requiredCols = ['type', 'description', 'amount', 'category', 'date'];
        const colIndices: {[key: string]: number} = {};
        requiredCols.forEach(col => {
            const index = headers.indexOf(col);
            if (index === -1) throw new Error(`Missing required column in CSV: ${col}`);
            colIndices[col] = index;
        });
        
        const parseCsvLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i+1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current);
            return result.map(val => val.startsWith('"') && val.endsWith('"') ? val.slice(1, -1) : val);
        };

        const newTransactions: Omit<Transaction, 'id'>[] = lines.map((line, index) => {
            const values = parseCsvLine(line);
            const type = values[colIndices.type] as TransactionType;
            const amountStr = values[colIndices.amount];

            if (!['Income', 'Expense'].includes(type)) {
                console.warn(`Skipping row ${index + 2}: Invalid transaction type "${type}"`);
                return null;
            }
            if (isNaN(parseFloat(amountStr))) {
                console.warn(`Skipping row ${index + 2}: Invalid amount "${amountStr}"`);
                return null;
            }

            const rawCategory = (values[colIndices.category] || 'Other').trim();
            const categoriesForType = type === 'Income' ? incomeCategories : expenseCategories;
            const existingCategory = categoriesForType.find(bc => bc.toLowerCase() === rawCategory.toLowerCase());

            return {
                type: type,
                description: (values[colIndices.description] || '').trim(),
                amount: parseFloat(amountStr),
                category: existingCategory || rawCategory || 'Other',
                date: values[colIndices.date] || new Date().toISOString().split('T')[0],
            };
        }).filter((t): t is Omit<Transaction, 'id'> => t !== null);

        onAddMultipleTransactions(newTransactions);
        alert(`${newTransactions.length} transactions imported successfully!`);

      } catch (error) {
        console.error("Failed to parse transactions file:", error);
        alert(`Error importing transactions: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }

    const headers = ['id', 'type', 'description', 'amount', 'category', 'date'];
    
    const escapeCsvField = (field: any): string => {
        const stringField = String(field ?? '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
            return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
    };

    const csvRows = [
        headers.join(','),
        ...transactions.map(t =>
            [
                escapeCsvField(t.id),
                escapeCsvField(t.type),
                escapeCsvField(t.description),
                t.amount,
                escapeCsvField(t.category),
                escapeCsvField(t.date),
            ].join(',')
        ),
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', 'transactions.csv');
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };
  
  const availableCategories = useMemo(() => {
    const sourceCategories = type === 'Income' ? incomeCategories : expenseCategories;
    const allCats = new Set(sourceCategories);
    
    if (editingTransaction && editingTransaction.type === type && editingTransaction.category) {
      allCats.add(editingTransaction.category);
    }
    
    allCats.add('Other');
    
    return Array.from(allCats).sort();
  }, [expenseCategories, incomeCategories, editingTransaction, type]);

  const filteredAndSortedTransactions = useMemo(() => {
    const sortableItems = [...transactions].filter(t =>
      t.description.toLowerCase().includes(filter.toLowerCase())
    );

    sortableItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'date':
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);
          aValue = !isNaN(aDate.getTime()) ? aDate.getTime() : 0;
          bValue = !isNaN(bDate.getTime()) ? bDate.getTime() : 0;
          break;
        default:
          aValue = (a[sortConfig.key] || '').toLowerCase();
          bValue = (b[sortConfig.key] || '').toLowerCase();
          break;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortableItems;
  }, [transactions, filter, sortConfig]);

  const SortIndicator: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return <span className="text-xs ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Expense Tracker</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">Log and manage all your income and expenses</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800"
            />
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <DownloadIcon /> Export
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                <UploadIcon /> Import
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button onClick={handleOpenAddModal} className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-secondary-600 transition-colors">
                + Add Transaction
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b-2 border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>
                    <div className="flex items-center">Date <SortIndicator columnKey="date" /></div>
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => requestSort('description')}>
                     <div className="flex items-center">Description <SortIndicator columnKey="description" /></div>
                  </th>
                  <th className="p-3 cursor-pointer" onClick={() => requestSort('category')}>
                     <div className="flex items-center">Category <SortIndicator columnKey="category" /></div>
                  </th>
                  <th className="p-3 text-right cursor-pointer" onClick={() => requestSort('amount')}>
                     <div className="flex items-center justify-end">Amount <SortIndicator columnKey="amount" /></div>
                  </th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTransactions.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200">
                    <td className="p-3 text-sm text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{t.description}</td>
                    <td className="p-3"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">{t.category}</span></td>
                    <td className={`p-3 text-right font-semibold ${t.type === 'Income' ? 'text-green-600' : 'text-primary-600'}`}>
                      {t.type === 'Income' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleOpenEditModal(t)} className="p-2 text-slate-400 hover:text-blue-500 rounded-md"><EditIcon /></button>
                      <button onClick={() => { if (window.confirm('Delete this transaction?')) onDeleteTransaction(t.id) }} className="p-2 text-slate-400 hover:text-red-500 rounded-md"><TrashIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedTransactions.length === 0 && <p className="text-center text-slate-500 py-8">No transactions found.</p>}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTransaction ? "Edit Transaction" : "Add Transaction"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
            <select value={type} onChange={e => {
                setType(e.target.value as TransactionType);
                setCategory('');
              }} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700">
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Groceries" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 75.50" className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required>
              <option value="" disabled>Select a category</option>
              {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700" required />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-100 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md hover:from-primary-700 hover:to-secondary-600">{editingTransaction ? 'Save Changes' : 'Add Transaction'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default Expenses;