import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default function TransactionDetailsModal({ isOpen, onClose, transaction, onSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});

    // Data for Dropdowns
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [selectedBudget, setSelectedBudget] = useState('');

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Reset state when modal opens
    useEffect(() => {
        if (transaction) {
            setForm({
                name: transaction.name,
                amount: Math.abs(transaction.amount),
                type: transaction.type,
                wallet_id: transaction.wallet_id,
                category_id: transaction.category_id || '',
                date: formatDate(transaction.transaction_date),
                description: transaction.description || ''
            });
            setIsEditing(false);
            setSelectedBudget('');
        }
    }, [transaction, isOpen]);

    // Fetch Data when entering Edit Mode
    useEffect(() => {
        if (isEditing) {
            const fetchData = async () => {
                const token = localStorage.getItem("token");
                try {
                    // 🟢 UPDATED: Using BASE_URL
                    const [wRes, cRes, bRes] = await Promise.all([
                        fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } }),
                        fetch(`${BASE_URL}/dashboard/categories`, { headers: { Authorization: token } }),
                        fetch(`${BASE_URL}/dashboard/budgets`, { headers: { Authorization: token } })
                    ]);

                    if (wRes.ok) { const d = await wRes.json(); setWallets(d.wallets); }
                    if (cRes.ok) { const c = await cRes.json(); setCategories(c); }

                    if (bRes.ok) {
                        const bData = await bRes.json();
                        setBudgets(bData.budgets);

                        // Auto-select budget if transaction category matches
                        if (transaction.category_id) {
                            const matchingBudget = bData.budgets.find(b => b.category_id === transaction.category_id);
                            if (matchingBudget) setSelectedBudget(matchingBudget.budget_id);
                        }
                    }
                } catch(e) { console.error(e); }
            };
            fetchData();
        }
    }, [isEditing, transaction]);

    // Handle Budget Change
    const handleBudgetChange = (e) => {
        const budgetId = e.target.value;
        setSelectedBudget(budgetId);
        const budget = budgets.find(b => b.budget_id.toString() === budgetId);
        if (budget) {
            setForm(prev => ({ ...prev, category_id: budget.category_id }));
        }
    };

    // Handle Manual Category Change
    const handleCategoryChange = (e) => {
        setForm(prev => ({ ...prev, category_id: e.target.value }));
        setSelectedBudget('');
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/dashboard/transaction/${transaction.transaction_id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });
            if (res.ok) {
                alert("Transaction Deleted");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert("Failed to delete.");
            }
        } catch (e) { console.error(e); }
    };


    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/dashboard/transaction/${transaction.transaction_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });

            const data = await res.json(); // 🟢 Parse JSON first

            if (res.ok) {
                alert("Transaction Updated");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                // 🟢 Show the specific "Insufficient funds" message from backend
                alert(data.error || "Failed to update transaction.");
            }
        } catch (e) {
            console.error(e);
            alert("Server Connection Error");
        }
    };

    if (!transaction) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

            {!isEditing ? (
                // VIEW MODE
                <>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 pr-8 truncate">{transaction.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{new Date(transaction.transaction_date).toLocaleDateString()}</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Amount</span>
                            <span className={`font-bold text-xl ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Category</span>
                            <span className="text-gray-900 dark:text-white">{transaction.category_name || 'Uncategorized'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Wallet</span>
                            <span className="text-gray-900 dark:text-white">{transaction.wallet_name}</span>
                        </div>
                        {transaction.description && (
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Description</label>
                                <div className="mt-1 max-h-32 overflow-y-auto">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap break-words">{transaction.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"><Edit2 size={18} className="mr-2" /> Edit</button>
                        <button onClick={handleDelete} className="flex-1 flex items-center justify-center py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"><Trash2 size={18} className="mr-2" /> Delete</button>
                    </div>
                </>
            ) : (
                // EDIT MODE
                <form onSubmit={handleUpdate} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Transaction</h3>

                    <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`w-1/2 p-2 rounded text-sm ${form.type === 'expense' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>Expense</button>
                        <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`w-1/2 p-2 rounded text-sm ${form.type === 'income' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>Income</button>
                    </div>

                    {/* Optional Budget Link */}


                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Title</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Amount</label>
                        <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Wallet</label>
                            <select value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})} className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-600">
                                {wallets.map(w => <option key={w.wallet_id} value={w.wallet_id}>{w.name}</option>)}
                            </select>
                        </div>

                        {/* 🟢 SMART CATEGORY DROPDOWN */}
                        <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">Category</label>
                            <select
                                value={form.category_id}
                                onChange={handleCategoryChange}
                                className="w-full p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-600"
                            >
                                <option value="">Uncategorized</option>
                                {categories.map(c => {
                                    // Smart Label Logic
                                    const activeBudget = budgets.find(b => b.category_id === c.category_id);
                                    let label = c.name;
                                    if (activeBudget && form.type === 'expense') {
                                        const remaining = activeBudget.limit_amount - activeBudget.spent;
                                        label = `📉 ${c.name} ($${Math.max(0, remaining).toLocaleString()} left)`;
                                    }
                                    return <option key={c.category_id} value={c.category_id}>{label}</option>;
                                })}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Date</label>
                        <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Description</label>
                        <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Description"></textarea>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center"><Save size={18} className="mr-2"/> Save</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}