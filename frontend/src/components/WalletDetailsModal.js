import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Calendar, CreditCard, Banknote, Coins, TrendingUp } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

const getWalletIcon = (type) => {
    const t = type?.toLowerCase();
    if (t === 'crypto') return <Coins size={24} className="text-white" />;
    if (t === 'stocks') return <TrendingUp size={24} className="text-white" />;
    if (t === 'ewallet') return <CreditCard size={24} className="text-white" />;
    return <Banknote size={24} className="text-white" />;
};

const getGradient = (type) => {
    const t = type?.toLowerCase();
    if (t === 'crypto') return 'from-orange-500 to-red-500';
    if (t === 'stocks') return 'from-purple-600 to-blue-600';
    if (t === 'ewallet') return 'from-blue-500 to-cyan-500';
    return 'from-green-600 to-teal-500';
};

export default function WalletDetailsModal({ isOpen, onClose, walletId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && walletId) {
            setLoading(true);

            if (!BASE_URL) {
                console.error("API Configuration Error: BASE_URL is not set.");
                setLoading(false);
                return;
            }

            const fetchData = async () => {
                try {
                    const token = localStorage.getItem("token");
                    // ✅ Use BASE_URL here for the GET request
                    const res = await fetch(`${BASE_URL}/dashboard/wallet/${walletId}`, {
                        headers: { Authorization: token }
                    });
                    if (res.ok) {
                        setData(await res.json());
                    } else {
                        setData(null);
                    }
                } catch (e) { console.error(e); setData(null); }
                finally { setLoading(false); }
            };
            fetchData();
        } else {
            setData(null);
        }
    }, [isOpen, walletId, BASE_URL]); // Dependency added for BASE_URL

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Header / Card Visual */}
            <div className={`p-6 ${data ? getGradient(data.wallet.type) : 'bg-gray-200'} bg-gradient-to-br text-white relative shrink-0`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"><X size={20} /></button>

                {loading || !data ? (
                    <div className="animate-pulse h-32 flex items-center justify-center">
                        {loading ? "Loading..." : "Wallet not found"}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                {getWalletIcon(data.wallet.type)}
                            </div>
                            <span className="px-3 py-1 bg-black/20 rounded-full text-xs font-medium uppercase tracking-wider backdrop-blur-sm">
                            {data.wallet.type}
                        </span>
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">Current Balance</p>
                            <h2 className="text-4xl font-bold tracking-tight">${Number(data.wallet.balance).toLocaleString()}</h2>
                            <p className="text-white/60 text-sm mt-2">{data.wallet.name}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Transactions List */}
            <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">Transaction History</h3>

                {loading ? (
                    <div className="text-center py-10 text-gray-400">Loading history...</div>
                ) : !data ? (
                    <div className="text-center py-10 text-red-400">Failed to load data.</div>
                ) : data.transactions.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">No transactions yet.</div>
                ) : (
                    <div className="space-y-3">
                        {data.transactions.map(tx => {
                            const isIncome = tx.type === 'income';
                            return (
                                <div key={tx.transaction_id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{tx.name}</p>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                <Calendar size={10} className="mr-1"/>
                                                {new Date(tx.transaction_date).toLocaleDateString()}
                                                <span className="mx-1.5">•</span>
                                                <span>{tx.category_name || 'Uncategorized'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`font-bold text-sm ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                                </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}