import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { AISparkleIcon } from './icons/AISparkleIcon';
import Modal from './Modal';

interface GlobalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}

type Message = {
  role: 'user' | 'model';
  text: string;
};

const GlobalAIAssistant: React.FC<GlobalAIAssistantProps> = ({ isOpen, onClose, data }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currency = data.currency || 'USD';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const generateSystemInstruction = () => {
    const { transactions, budget, savingsGoals, monthlyIncome, budgetGoals, settings } = data;
    const commonInstructions = `You are 'Apex AI', an expert financial advisor integrated into the 'Budget Planner' app. You have access to the user's complete financial data. Your goal is to provide insightful, clear, and encouraging answers to their questions. Format your responses using clean markdown for readability. The user's currently selected currency is ${currency}.`;

    const contextData = `
      **User Settings:**
      - Theme: ${settings.theme}
      - Accent Color: ${settings.accentColor}
      - Font Size: ${settings.fontSize}
      - Currency: ${settings.currency}

      **Financial Overview:**
      - Stated Monthly Income: ${formatCurrency(monthlyIncome)}

      **Budget Details (${budget.length} categories):**
      - Total Budgeted Amount: ${formatCurrency(budget.reduce((acc: number, b: any) => acc + b.amount, 0))}
      - Budget Categories: ${JSON.stringify(budget.map((b: any) => ({ name: b.name, allocated: formatCurrency(b.amount) })))}

      **Spending Goals (${budgetGoals.length} goals):**
      - ${JSON.stringify(budgetGoals.slice(0, 5).map((g: any) => ({ title: g.title, target: formatCurrency(g.targetAmount), deadline: g.deadline })))}

      **Savings Goals (${savingsGoals.length} goals):**
      - Total Savings Target: ${formatCurrency(savingsGoals.reduce((acc: number, g: any) => acc + g.targetAmount, 0))}
      - Current Amount Saved: ${formatCurrency(savingsGoals.reduce((acc: number, g: any) => acc + g.currentAmount, 0))}
      - Goals: ${JSON.stringify(savingsGoals.map((g: any) => ({ title: g.title, target: formatCurrency(g.targetAmount), current: formatCurrency(g.currentAmount), deadline: g.deadline })))}

      **Recent Transactions (last 20 of ${transactions.length} total):**
      - ${JSON.stringify(transactions.slice(0, 20).map((t: any) => ({ type: t.type, desc: t.description, amount: formatCurrency(t.amount), cat: t.category, date: t.date })))}
    `;

    return `${commonInstructions}\n\nHere is a snapshot of the user's current financial data for your context:\n${contextData}\n\nNow, begin the conversation and answer the user's questions comprehensively.`;
  };

  useEffect(() => {
    // Initialize or re-initialize only when the modal opens and isn't already initialized
    if (isOpen && !isInitialized) {
      try {
        if (typeof process === 'undefined' || !process.env.API_KEY) {
          throw new Error("API key is not configured.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = generateSystemInstruction();
        
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: { systemInstruction },
        });
        
        setMessages([{ role: 'model', text: "Hello! I'm your comprehensive AI Financial Assistant. Ask me anything about your dashboard, budget, expenses, or savings goals." }]);
        setError('');
        setIsInitialized(true);
      } catch (e: any) {
        setError(e.message || "Failed to initialize AI Assistant.");
        console.error(e);
        setIsInitialized(false);
      }
    } else if (!isOpen) {
        // Reset initialization state when modal is closed to allow re-initialization with fresh data
        setIsInitialized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading || !chatRef.current) return;

    const userMessage: Message = { role: 'user', text: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError('');

    try {
      const response = await chatRef.current.sendMessage({ message: userInput });
      const modelMessage: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (e: any) {
      console.error(e);
      const errorMessage: Message = { role: 'model', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Financial Assistant">
        <div className="flex flex-col h-[60vh]">
            <div className="flex-grow p-4 overflow-y-auto space-y-4 -mx-4">
                {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"><AISparkleIcon/></div>}
                    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-br-lg' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-lg'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"><AISparkleIcon/></div>
                        <div className="max-w-xs md:max-w-md px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-lg">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            {error && <p className="px-4 pb-2 text-sm text-red-500">{error}</p>}
            <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={isInitialized ? "Ask about your finances..." : "Initializing AI..."}
                    className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    disabled={isLoading || !isInitialized}
                />
                <button type="submit" disabled={isLoading || !isInitialized || !userInput.trim()} className="p-2 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-lg disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </button>
                </div>
            </form>
        </div>
    </Modal>
  );
};

export default GlobalAIAssistant;
