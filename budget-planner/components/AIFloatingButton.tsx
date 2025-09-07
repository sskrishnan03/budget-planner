import React from 'react';
import { AISparkleIcon } from './icons/AISparkleIcon';

interface AIFloatingButtonProps {
  onClick: () => void;
}

const AIFloatingButton: React.FC<AIFloatingButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-gradient-to-r from-primary-600 to-secondary-500 text-white shadow-lg hover:from-primary-700 hover:to-secondary-600 flex items-center justify-center transform transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-500/50"
      aria-label="Open AI Financial Assistant"
    >
      <AISparkleIcon />
    </button>
  );
};

export default AIFloatingButton;
