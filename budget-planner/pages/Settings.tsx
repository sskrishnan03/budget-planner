import React, { useRef, useState } from 'react';
import type { Theme, AccentColor, Currency, FontSize } from '../types';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { ACCENT_COLORS } from '../constants';
import { TrashIcon } from '../components/icons/TrashIcon';
import { MoonIcon } from '../components/icons/MoonIcon';
import { SunIcon } from '../components/icons/SunIcon';

interface SettingsProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  incomeCategories: string[];
  setIncomeCategories: (categories: string[]) => void;
  expenseCategories: string[]; // for display only, budget page handles this
  onExport: () => void;
  onImport: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ theme, setTheme, accentColor, setAccentColor, currency, setCurrency, fontSize, setFontSize, incomeCategories, setIncomeCategories, expenseCategories, onExport, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newIncomeCategory, setNewIncomeCategory] = useState('');

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (window.confirm("Importing data will overwrite all current data, including settings. Are you sure you want to proceed?")) {
        onImport(file);
      }
    }
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleAddIncomeCategory = () => {
    if (newIncomeCategory && !incomeCategories.includes(newIncomeCategory)) {
        setIncomeCategories([...incomeCategories, newIncomeCategory]);
        setNewIncomeCategory('');
    }
  };

  const handleDeleteIncomeCategory = (categoryToDelete: string) => {
    setIncomeCategories(incomeCategories.filter(c => c !== categoryToDelete));
  };
  
  const accentColorKeys = Object.keys(ACCENT_COLORS) as AccentColor[];
  const fontSizes: { id: FontSize; label: string }[] = [
      { id: 'sm', label: 'Small' },
      { id: 'md', label: 'Medium' },
      { id: 'lg', label: 'Large' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Manage your application preferences and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Appearance</h2>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-6">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-slate-800 dark:text-slate-100">Theme</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark mode.</p>
                    </div>
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 ${theme === 'dark' ? 'bg-primary-600' : 'bg-slate-300'}`}>
                        <span className="sr-only">Toggle Theme</span>
                        <span className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform duration-300 ${theme === 'dark' ? 'translate-x-9' : 'translate-x-1'}`}/>
                        <div className="absolute inset-0 flex items-center justify-between px-2">
                          <SunIcon className={`h-4 w-4 text-yellow-400 transition-opacity ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`} />
                          <MoonIcon className={`h-4 w-4 text-white transition-opacity ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                    </button>
                </div>
                
                <div className="flex items-center justify-between">
                     <div>
                        <h3 className="font-medium text-slate-800 dark:text-slate-100">Font Size</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Adjust the application's font size.</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                        {fontSizes.map(({id, label}) => (
                            <button key={id} onClick={() => setFontSize(id)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${fontSize === id ? 'bg-white shadow text-primary-600 dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

              <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium text-slate-800 dark:text-slate-100">Accent Color</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Choose the main highlight color.</p>
                </div>
                <div className="flex items-center gap-3">
                  {accentColorKeys.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setAccentColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${accentColor === color ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900 ring-primary-500' : ''}`}
                      style={{ backgroundColor: ACCENT_COLORS[color]['500'] }}
                      aria-label={`Set accent color to ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Preferences</h2>
            <div className="flex items-center justify-between">
              <label htmlFor="currency-select" className="text-slate-700 dark:text-slate-200 font-medium">
                Currency
              </label>
              <select id="currency-select" value={currency} onChange={e => setCurrency(e.target.value as Currency)} className="p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Data Management</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Export all your data into a single CSV file. You can import this file later to restore your state.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <DownloadIcon /> Export All Data
              </button>
              <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <UploadIcon /> Import Data
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Category Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Income Categories</h3>
                    <div className="space-y-2">
                        {incomeCategories.map(cat => (
                            <div key={cat} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                                <span className="text-sm">{cat}</span>
                                <button onClick={() => handleDeleteIncomeCategory(cat)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <input 
                            type="text" 
                            value={newIncomeCategory} 
                            onChange={e => setNewIncomeCategory(e.target.value)} 
                            placeholder="New category..." 
                            className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700"
                        />
                        <button onClick={handleAddIncomeCategory} className="px-3 py-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-md text-sm font-semibold">+</button>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Expense Categories</h3>
                     <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Expense categories are managed on the Budget page to link them with spending limits.</p>
                    <div className="space-y-2">
                        {expenseCategories.map(cat => (
                             <div key={cat} className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                                <span className="text-sm">{cat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;