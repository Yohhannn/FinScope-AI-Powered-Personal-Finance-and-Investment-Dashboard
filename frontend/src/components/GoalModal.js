import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Lock } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function GoalModal({ isOpen, onClose, onSuccess, goal }) {
    const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', wallet_id: '' });
    const [wallets, setWallets] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen) {
            setError('');
            const fetchWallets = async () => {
                const token = localStorage.getItem("token");
                try {
                    // 🟢 UPDATED: Using BASE_URL
                    const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
                    if(res.ok) {
                        const data = await res.json();
                        setWallets(data.wallets || []);

                        // Set default wallet if creating new and not set
                        if(!goal && data.wallets.length > 0) {
                            setForm(f => ({ ...f, wallet_id: data.wallets[0].wallet_id }));
                        }
                    }
                } catch(e) { console.error(e); }
            };
            fetchWallets();

            if (goal) {
                setForm({
                    name: goal.name,
                    target_amount: goal.target_amount,
                    current_amount: goal.current_amount,
                    wallet_id: goal.wallet_id || ''
                });
            } else {
                setForm({ name: '', target_amount: '', current_amount: '0', wallet_id: '' });
            }
        }
    }, [isOpen, goal]);

    const getDisplayBalance = (walletId) => {
        const w = wallets.find(w => String(w.wallet_id) === String(walletId));
        if (!w) return 0;
        return parseFloat(w.available_balance ?? w.balance);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const initialSave = parseFloat(form.current_amount || 0);

        // 🟢 VALIDATION: Only check balance if CREATING a new goal
        if (!goal && initialSave > 0 && form.wallet_id) {
            const available = getDisplayBalance(form.wallet_id);
            if (initialSave > available) {
                setError(`Insufficient available funds. You only have ₱${available.toLocaleString()} available.`);
                setLoading(false);
                return;
            }
        }

        const token = localStorage.getItem("token");

        // 🟢 UPDATED: Using BASE_URL
        const url = goal ? `${BASE_URL}/dashboard/goal/${goal.goal_id}` : `${BASE_URL}/dashboard/goal`;
        const method = goal ? "PUT" : "POST";

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
                setError(data.error || "Failed to save goal.");
            }
        } catch (e) {
            console.error(e);
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if(!window.confirm("Delete this goal?")) return;
        const token = localStorage.getItem("token");

        // 🟢 UPDATED: Using BASE_URL
        await fetch(`${BASE_URL}/dashboard/goal/${goal.goal_id}`, { method: "DELETE", headers: { Authorization: token } });
        onSuccess(); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{goal ? 'Edit Goal' : 'Create Goal'}</h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Goal Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="e.g. New Laptop" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Source Wallet</label>
                        <select
                            value={form.wallet_id}
                            onChange={e => setForm({...form, wallet_id: e.target.value})}
                            className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">Select a Wallet</option>
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id}>
                                    {w.name} (₱{parseFloat(w.available_balance ?? w.balance).toLocaleString()} Avail)
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Funds are soft-allocated from this wallet.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Target (₱)</label>
                            <input type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none" required placeholder="0.00" />
                        </div>

                        {/* 🟢 INITIAL SAVE: Disabled when Editing */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {goal ? "Current Balance" : "Initial Save (₱)"}
                            </label>
                            <input
                                type="number"
                                value={form.current_amount}
                                onChange={e => setForm({...form, current_amount: e.target.value})}
                                className={`w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none ${goal ? 'bg-gray-200 dark:bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-700 dark:text-white'}`}
                                placeholder="0.00"
                                disabled={!!goal} // 🟢 Disable if goal exists (Edit Mode)
                            />
                            {goal && <Lock size={14} className="absolute right-3 top-[38px] text-gray-400" />}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {goal && (
                            <button type="button" onClick={handleDelete} className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-xl transition">
                                <Trash2 size={18}/>
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-green-600/20 transition disabled:opacity-70"
                        >
                            {loading ? 'Saving...' : (goal ? 'Update Goal' : 'Create Goal')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}