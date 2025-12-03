import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

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

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');

    // IDs
    const [walletId, setWalletId] = useState('');
    const [categoryId, setCategoryId] = useState(''); // We still save Category ID in the DB

    // Data Lists
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);

    // FETCH DATA
    useEffect(() => {
        if (isOpen) {
            const loadData = async () => {
                if (!BASE_URL) {
                    console.error("API Configuration Error: BASE_URL is not set.");
                    return;
                }
                const token = localStorage.getItem("token");
                try {
                    // ✅ Use BASE_URL here for all data fetches
                    const [wRes, cRes, bRes] = await Promise.all([
                        fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } }),
                        fetch(`${BASE_URL}/dashboard/categories`, { headers: { Authorization: token } }),
                        fetch(`${BASE_URL}/dashboard/budgets`, { headers: { Authorization: token } })
                    ]);

                    if (wRes.ok) {
                        const wData = await wRes.json();
                        setWallets(wData.wallets);
                        if(wData.wallets.length > 0 && !walletId) setWalletId(wData.wallets[0].wallet_id);
                    }

                    const cData = cRes.ok ? await cRes.json() : [];
                    const bData = bRes.ok ? await bRes.json() : { budgets: [] };

                    setCategories(cData);
                    setBudgets(bData.budgets || []);

                    // Default category
                    if(cData.length > 0 && !categoryId) setCategoryId(cData[0].category_id);

                } catch(e) { console.error(e); }
            };
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!BASE_URL) {
            alert("API Configuration Error: BASE_URL is not set.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            // ✅ Use BASE_URL here for the POST request
            const response = await fetch(`${BASE_URL}/dashboard/transaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    name,
                    amount: parseFloat(amount),
                    type,
                    date,
                    wallet_id: walletId,
                    category_id: categoryId,
                    description
                })
            });

            if(response.ok) {
                alert("Transaction Saved!");
                if (onSuccess) onSuccess();
                onClose();
                setName(''); setAmount(''); setDescription('');
            } else {
                alert("Failed to add transaction. Amount exceeds your wallet balance.");
            }
        } catch(err) { console.error(err); }
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
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0.00" />
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Starbucks" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Wallet Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet</label>
                        <select value={walletId} onChange={(e) => setWalletId(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* 🟢 SMART "BUDGET/CATEGORY" DROPDOWN */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {type === 'expense' ? 'Budget / Category' : 'Source'}
                        </label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            {categories.length === 0 && <option value="">No Categories</option>}

                            {categories.map(c => {
                                // Check if there is an active budget for this category
                                const activeBudget = budgets.find(b => b.category_id === c.category_id);

                                // Create the Label
                                let label = c.name;
                                if (activeBudget && type === 'expense') {
                                    const remaining = activeBudget.limit_amount - activeBudget.spent;
                                    label = `📉 ${c.name} ($${Math.max(0, remaining).toLocaleString()} left)`;
                                }

                                return <option key={c.category_id} value={c.category_id}>{label}</option>;
                            })}
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Optional notes..." />
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