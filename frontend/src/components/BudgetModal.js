import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function BudgetModal({ isOpen, onClose, onSuccess, budget }) {
    const [form, setForm] = useState({ category_id: '', limit_amount: '', start_date: '', end_date: '' });
    const [categories, setCategories] = useState([]);
    const [existingBudgets, setExistingBudgets] = useState([]); // 🟢 To track duplicates
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if(isOpen) {
            setError('');
            const fetchData = async () => {
                const token = localStorage.getItem("token");
                try {
                    // Fetch Categories AND Existing Budgets
                    // 🟢 UPDATED: Using BASE_URL
                    const [catRes, budgetRes] = await Promise.all([
                        fetch(`${BASE_URL}/dashboard/categories`, { headers: { Authorization: token } }),
                        fetch(`${BASE_URL}/dashboard/budgets`, { headers: { Authorization: token } })
                    ]);

                    if (catRes.ok && budgetRes.ok) {
                        const catData = await catRes.json();
                        const budgetData = await budgetRes.json();
                        setCategories(catData);
                        setExistingBudgets(budgetData.budgets || []); // Store existing budgets
                    }
                } catch(e) { console.error(e); }
            };
            fetchData();

            if (budget) {
                // Formatting date for input type="date" (YYYY-MM-DD)
                const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
                setForm({
                    category_id: budget.category_id,
                    limit_amount: budget.limit_amount,
                    start_date: formatDate(budget.start_date),
                    end_date: formatDate(budget.end_date)
                });
            } else {
                // Default dates: First and Last day of current month
                const date = new Date();
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

                setForm({ category_id: '', limit_amount: '', start_date: firstDay, end_date: lastDay });
            }
        }
    }, [isOpen, budget]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem("token");

        // 🟢 UPDATED: Using BASE_URL
        const url = budget ? `${BASE_URL}/dashboard/budget/${budget.budget_id}` : `${BASE_URL}/dashboard/budget`;
        const method = budget ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to save budget.");
            }
        } catch (e) {
            console.error(e);
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if(!window.confirm("Delete this budget?")) return;
        const token = localStorage.getItem("token");

        // 🟢 UPDATED: Using BASE_URL
        await fetch(`${BASE_URL}/dashboard/budget/${budget.budget_id}`, { method: "DELETE", headers: { Authorization: token } });
        onSuccess(); onClose();
    };

    if (!isOpen) return null;

    // 🟢 FILTER LOGIC:
    // Show category IF:
    // 1. It is NOT in existingBudgets list
    // OR
    // 2. We are editing, and it matches the current budget's category
    const availableCategories = categories.filter(cat => {
        const isTaken = existingBudgets.some(b => b.category_id === cat.category_id);
        const isCurrent = budget && parseInt(budget.category_id) === cat.category_id;
        return !isTaken || isCurrent;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{budget ? 'Edit Budget' : 'Create Budget'}</h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* 🟢 CATEGORY SELECT (Filtered) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            value={form.category_id}
                            onChange={e => setForm({...form, category_id: e.target.value})}
                            className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">Select Category</option>
                            {availableCategories.map(c => (
                                <option key={c.category_id} value={c.category_id}>{c.name}</option>
                            ))}
                        </select>
                        {availableCategories.length === 0 && (
                            <p className="text-xs text-orange-500 mt-1">All categories already have budgets.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Limit ($)</label>
                        <input type="number" value={form.limit_amount} onChange={e => setForm({...form, limit_amount: e.target.value})} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                            <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                            <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {budget && (
                            <button type="button" onClick={handleDelete} className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl transition">
                                <Trash2 size={18}/>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : (budget ? 'Update Budget' : 'Create Budget')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}