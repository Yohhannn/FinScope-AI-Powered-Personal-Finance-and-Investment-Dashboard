import React, { useEffect, useState } from 'react';
import { X, Trash2, Wallet, ArrowRight, CheckCircle, RotateCcw } from 'lucide-react';

// Define the base API URL
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function GoalHistoryModal({ isOpen, onClose, goal, onRefresh }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (isOpen && goal) {
            fetchHistory();
        }
    }, [isOpen, goal]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

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

    // 🟢 Handle Marking Goal as Complete (With Wallet Deduction)
    const toggleGoalStatus = async () => {
        const newStatus = goal.status === 'completed' ? 'active' : 'completed';

        // Custom warning message based on action
        const warningMsg = newStatus === 'completed'
            ? `Marking this as complete will DEDUCT the target amount ($${parseFloat(goal.target_amount).toLocaleString()}) from your wallet. Continue?`
            : "Are you sure you want to reactivate this goal?";

        if (!window.confirm(warningMsg)) return;

        try {
            setUpdating(true);
            const token = localStorage.getItem("token");

            const res = await fetch(`${BASE_URL}/dashboard/goal/${goal.goal_id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();

            if (res.ok) {
                if (onRefresh) onRefresh(); // Refresh parent data (balances etc)
                onClose(); // Close modal
            } else {
                alert(data.error || "Failed to update goal status.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while communicating with the server.");
        } finally {
            setUpdating(false);
        }
    };

    const handleRevert = async (txId) => {
        if (!window.confirm("Are you sure you want to revert this contribution? Funds will return to the wallet.")) return;

        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${BASE_URL}/dashboard/goal/transaction/${txId}`, {
                method: 'DELETE',
                headers: { Authorization: token }
            });

            if (res.ok) {
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

    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
    const isCompleted = goal.status === 'completed';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                            {isCompleted && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-medium border border-green-200">
                                    Completed
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">Transaction History</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Toggle Status Button */}
                        <button
                            onClick={toggleGoalStatus}
                            disabled={updating}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition border
                                ${isCompleted
                                ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            }`}
                        >
                            {updating ? (
                                <span>Processing...</span>
                            ) : isCompleted ? (
                                <>
                                    <RotateCcw size={14} /> Reactivate
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={14} /> Mark Complete
                                </>
                            )}
                        </button>

                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Goal Progress Context */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Current Progress</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                ${parseFloat(goal.current_amount).toLocaleString()}
                                <span className="text-sm font-normal text-gray-400"> / ${parseFloat(goal.target_amount).toLocaleString()}</span>
                            </p>
                        </div>
                        <div className="text-right">
                             <span className={`text-sm font-bold ${progress >= 100 ? 'text-green-500' : 'text-blue-500'}`}>
                                {progress.toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Transactions</h4>

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
                                        {!isCompleted && (
                                            <button
                                                onClick={() => handleRevert(tx.transaction_id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                                title="Revert Transaction"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
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