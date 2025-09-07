import React from 'react';
import type { Page } from '../types';
import { NAV_LINKS } from '../constants';
import { LogoIcon } from './icons/LogoIcon';
import { DashboardIcon } from './icons/DashboardIcon';
import { BudgetIcon } from './icons/BudgetIcon';
import { ExpensesIcon } from './icons/ExpensesIcon';
import { SavingsIcon } from './icons/SavingsIcon';
import { SettingsIcon } from './icons/SettingsIcon';


interface HeaderProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavIcon: React.FC<{ name: Page }> = ({ name }) => {
  switch (name) {
    case 'Dashboard':
      return <DashboardIcon />;
    case 'Budget':
      return <BudgetIcon />;
    case 'Expenses':
      return <ExpensesIcon />;
    case 'Savings':
      return <SavingsIcon />;
    case 'Settings':
      return <SettingsIcon />;
    default:
      return null;
  }
};

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md sticky top-0 z-20">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex items-center space-x-4">
            <LogoIcon />
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">
              Budget Planner
            </span>
          </div>
          <nav className="flex space-x-1 sm:space-x-2">
            {NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => setActivePage(link.name)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  activePage === link.name
                    ? 'bg-primary-50 text-primary-600 dark:bg-slate-800'
                    : 'text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
                aria-current={activePage === link.name ? 'page' : undefined}
              >
                <NavIcon name={link.name} />
                <span className="hidden sm:inline">{link.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;