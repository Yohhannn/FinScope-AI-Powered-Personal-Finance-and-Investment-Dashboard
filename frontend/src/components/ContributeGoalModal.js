import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ContributeGoalModal({ isOpen, onClose, goal, onSuccess }) {
    const [walletId, setWalletId] = useState('');
    const [amount, setAmount] = useState('');
    const [wallets, setWallets] = useState([]);
    const [mode, setMode] = useState('add'); // 'add' or 'deduct'

    useEffect(() => {
        if (isOpen) {
            const fetchWallets = async () => {
                const token = localStorage.getItem("token");
                try {
                    const res = await fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } });
                    if (res.ok) {
                        const data = await res.json();
                        setWallets(data.wallets);
                        if(data.wallets.length > 0) setWalletId(data.wallets[0].wallet_id);
                    }
                } catch(e) { console.error(e); }
            };
            fetchWallets();
            setAmount('');
            setMode('add'); // Default to Add
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 🟢 Handle Negative Amount for Deduction
        const finalAmount = mode === 'add' ? parseFloat(amount) : -parseFloat(amount);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/goal/${goal.goal_id}/contribute`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                // We send 'skip_wallet_check' for deductions if we want to bypass wallet balance checks
                // For now, assuming normal allocation logic
                body: JSON.stringify({ wallet_id: walletId, amount: finalAmount })
            });

            const data = await res.json();

            if (res.ok) {
                alert(mode === 'add' ? "Funds Allocated!" : "Funds Removed!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(data.error || "Failed.");
            }
        } catch (e) { console.error(e); }
    };

    if (!isOpen || !goal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Update Savings</h3>
                <p className="text-sm text-gray-500 mb-4">Goal: {goal.name}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* 🟢 Mode Toggle */}
                    <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
                        <button type="button" onClick={() => setMode('add')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition ${mode === 'add' ? 'bg-green-500 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>Add (+)</button>
                        <button type="button" onClick={() => setMode('deduct')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition ${mode === 'deduct' ? 'bg-red-500 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>Deduct (-)</button>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reference Wallet</label>
                        <select
                            value={walletId}
                            onChange={(e) => setWalletId(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-transparent"
                        >
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id}>
                                    {w.name} (${Number(w.balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                            placeholder="0.00"
                            required
                        />
                    </div>

                    <button type="submit" className={`w-full text-white p-3 rounded-lg font-medium transition ${mode === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {mode === 'add' ? 'Allocate Funds' : 'Remove Funds'}
                    </button>
                </form>
            </div>
        </div>
    );
}