import React, { useEffect, useState } from 'react';
import { X, Calendar, Wallet, TrendingDown } from 'lucide-react';

export default function BudgetHistoryModal({ isOpen, onClose, budget }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && budget) {
            fetchHistory();
        }
    }, [isOpen, budget]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/budget/${budget.budget_id}/transactions`, {
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

    if (!isOpen || !budget) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{budget.category_name} Budget</h3>
                        <p className="text-xs text-gray-500">Expense History</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-400">Loading expenses...</div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">No expenses found for this period.</div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map(tx => (
                                <div key={tx.transaction_id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            <TrendingDown size={18} />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {tx.name}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Calendar size={10} className="mr-1"/> {new Date(tx.transaction_date).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs text-gray-400">• {tx.wallet_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="font-bold text-red-600 dark:text-red-400">
                                        -${Math.abs(tx.amount).toLocaleString()}
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