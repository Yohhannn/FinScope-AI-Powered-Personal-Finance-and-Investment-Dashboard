import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function GoalModal({ isOpen, onClose, onSuccess, goal }) {
    const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', wallet_id: '' });
    const [wallets, setWallets] = useState([]);

    // Fetch Wallets for Dropdown
    useEffect(() => {
        if(isOpen) {
            const fetchWallets = async () => {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } });
                if(res.ok) {
                    const data = await res.json();
                    setWallets(data.wallets);
                    // Set default wallet if creating new
                    if(!goal && data.wallets.length > 0) setForm(f => ({ ...f, wallet_id: data.wallets[0].wallet_id }));
                }
            };
            fetchWallets();

            if (goal) {
                setForm({
                    name: goal.name,
                    target_amount: goal.target_amount,
                    current_amount: goal.current_amount,
                    wallet_id: goal.wallet_id || '' // 🟢 Pre-fill wallet
                });
            } else {
                setForm({ name: '', target_amount: '', current_amount: '0', wallet_id: '' });
            }
        }
    }, [isOpen, goal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const url = goal ? `http://localhost:5000/api/dashboard/goal/${goal.goal_id}` : "http://localhost:5000/api/dashboard/goal";
        const method = goal ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                alert("Goal Saved!");
                onSuccess();
                onClose();
            } else {
                // 🟢 Show Validation Error
                alert(data.error || "Failed to save goal.");
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if(!window.confirm("Delete this goal?")) return;
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/dashboard/goal/${goal.goal_id}`, { method: "DELETE", headers: { Authorization: token } });
        onSuccess(); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{goal ? 'Edit Goal' : 'Create Goal'}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Goal Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required />
                    </div>

                    {/* 🟢 NEW: Source Wallet Dropdown */}
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Source Wallet</label>
                        <select
                            value={form.wallet_id}
                            onChange={e => setForm({...form, wallet_id: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-transparent"
                            required
                        >
                            <option value="">Select a Wallet</option>
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id}>{w.name} (${Number(w.balance).toLocaleString()})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-400 mt-1">Allocations will be checked against this wallet.</p>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Target Amount</label>
                        <input type="number" value={form.target_amount} onChange={e => setForm({...form, target_amount: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Current Saved Amount</label>
                        <input type="number" value={form.current_amount} onChange={e => setForm({...form, current_amount: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" />
                    </div>

                    <div className="flex gap-2 pt-2">
                        {goal && <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Trash2 size={18}/></button>}
                        <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-medium">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}