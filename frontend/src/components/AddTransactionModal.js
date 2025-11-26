import React, { useState } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
                {children}
            </div>
        </div>
    );
};

export default function AddTransactionModal({ isOpen, onClose }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('New Transaction:', { type, amount, name, date });
        onClose();
        setAmount('');
        setName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Transaction">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Toggle */}
                <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => setType('expense')} className={`w-1/2 p-2 rounded-md font-medium text-sm ${type === 'expense' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>Expense</button>
                    <button type="button" onClick={() => setType('income')} className={`w-1/2 p-2 rounded-md font-medium text-sm ${type === 'income' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>Income</button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <div className="relative">
             <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-medium ${type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
               {type === 'expense' ? '-' : '+'} $
             </span>
                        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Starbucks" />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition">Save Transaction</button>
            </form>
        </Modal>
    );
}