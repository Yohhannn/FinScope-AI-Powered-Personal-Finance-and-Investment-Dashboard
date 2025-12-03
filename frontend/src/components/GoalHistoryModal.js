import React, { useEffect, useState } from 'react';
import { X, Trash2, Calendar, Wallet, ArrowRight } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function GoalHistoryModal({ isOpen, onClose, goal, onRefresh }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && goal) {
            fetchHistory();
        }
    }, [isOpen, goal]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/dashboard/goal/${goal.goal_id}/transactions`, {
                headers: { Authorization: token }
            });
            const data = await res.json();
            setTransactions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevert = async (txId) => {
        if (!window.confirm("Are you sure you want to revert this contribution? Funds will return to the wallet.")) return;

        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/dashboard/goal/transaction/${txId}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
                // Refresh list and Parent Data
                fetchHistory();
                if (onRefresh) onRefresh();
            } else {
                alert("Failed to revert transaction.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (!isOpen || !goal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                        <p className="text-xs text-gray-500">Transaction History</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading history...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No transactions found.</div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx.transaction_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:border-gray-300 transition group">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${parseFloat(tx.amount) > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            <Wallet size={18} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {parseFloat(tx.amount) > 0 ? "Contribution" : "Withdrawal"}
                                                </span>
                                                <span className="text-xs text-gray-400">• {new Date(tx.transaction_date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                                                {tx.wallet_name || 'Unknown Wallet'} <ArrowRight size={10} className="mx-1"/> Goal
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`font-bold ${parseFloat(tx.amount) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {parseFloat(tx.amount) > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                                        </span>
                                        <button
                                            onClick={() => handleRevert(tx.transaction_id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                            title="Revert Transaction"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}