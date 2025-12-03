import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Lock } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function ContributeGoalModal({ isOpen, onClose, goal, onSuccess }) {
    const [walletId, setWalletId] = useState('');
    const [amount, setAmount] = useState('');
    const [wallets, setWallets] = useState([]);
    const [selectedWalletData, setSelectedWalletData] = useState(null);
    const [mode, setMode] = useState('add');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setError('');
            setLoading(false);
            setMode('add');

            if (!BASE_URL) {
                setError("API Configuration Error: BASE_URL is not set.");
                return;
            }

            // 🟢 PRE-SET WALLET ID FROM GOAL
            if (goal && goal.wallet_id) {
                setWalletId(goal.wallet_id);
            }

            const fetchWallets = async () => {
                const token = localStorage.getItem("token");
                try {
                    // ✅ Use BASE_URL here for data fetching
                    const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
                    if (res.ok) {
                        const data = await res.json();
                        setWallets(data.wallets || []);

                        // Find the wallet data for the linked goal
                        if (goal && goal.wallet_id) {
                            const linkedWallet = data.wallets.find(w => String(w.wallet_id) === String(goal.wallet_id));
                            setSelectedWalletData(linkedWallet);
                        }
                    }
                } catch(e) { console.error(e); }
            };
            fetchWallets();
        }
    }, [isOpen, goal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!BASE_URL) {
            setError("API Configuration Error: BASE_URL is not set.");
            setLoading(false);
            return;
        }

        const parsedAmount = parseFloat(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            setError("Please enter a valid amount greater than 0.");
            setLoading(false);
            return;
        }

        // Check Available Balance
        if (mode === 'add' && selectedWalletData) {
            const avail = parseFloat(selectedWalletData.available_balance ?? selectedWalletData.balance);
            if (parsedAmount > avail) {
                setError(`Insufficient available funds. Only $${avail.toLocaleString()} available in ${selectedWalletData.name}.`);
                setLoading(false);
                return;
            }
        }

        const finalAmount = mode === 'add' ? parsedAmount : -parsedAmount;

        try {
            const token = localStorage.getItem("token");
            // ✅ Use BASE_URL here for the POST request
            const res = await fetch(`${BASE_URL}/dashboard/goal/${goal.goal_id}/contribute`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ wallet_id: walletId, amount: finalAmount })
            });

            const data = await res.json();

            if (res.ok) {
                if (onSuccess) onSuccess();
                onClose();
                // Using alert() here as per the original code's style
                setTimeout(() => alert(mode === 'add' ? "Funds Allocated Successfully!" : "Funds Removed Successfully!"), 300);
            } else {
                setError(data.error || "Failed to update funds.");
            }
        } catch (e) {
            console.error(e);
            setError("An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !goal) return null;

    const getDisplayBalance = (w) => parseFloat(w.available_balance ?? w.balance);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl">

                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition"><X size={20}/></button>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Update Savings</h3>
                <p className="text-sm text-gray-500 mb-5">Goal: <span className="font-semibold text-blue-600 dark:text-blue-400">{goal.name}</span></p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center">
                        <AlertTriangle size={14} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="flex w-full bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                        <button type="button" onClick={() => setMode('add')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'add' ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Add (+)</button>
                        <button type="button" onClick={() => setMode('deduct')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'deduct' ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Deduct (-)</button>
                    </div>

                    {/* 🟢 LOCKED WALLET SELECTION */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center">
                                Source Wallet <Lock size={10} className="ml-1 text-gray-400"/>
                            </label>
                            {selectedWalletData && (
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                    Avail: ${getDisplayBalance(selectedWalletData).toLocaleString()}
                                </span>
                            )}
                        </div>
                        <div className="relative">
                            <select
                                value={walletId}
                                disabled={true} // 🟢 DISABLE USER CHANGE
                                className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed appearance-none"
                            >
                                {wallets.map(w => (
                                    <option key={w.wallet_id} value={w.wallet_id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                            <Lock size={16} className="absolute right-3 top-3.5 text-gray-400" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Amount</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-7 pr-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-medium"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full text-white py-3.5 rounded-xl font-bold text-sm transition shadow-lg flex justify-center items-center ${mode === 'add' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing...' : (mode === 'add' ? 'Allocate Funds' : 'Remove Funds')}
                    </button>
                </form>
            </div>
        </div>
    );
}