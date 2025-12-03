import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertTriangle } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function TransferModal({ isOpen, onClose, onSuccess }) {
    const [wallets, setWallets] = useState([]);
    const [sourceId, setSourceId] = useState('');
    const [destId, setDestId] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setAmount('');
            setSourceId('');
            setDestId('');

            if (!BASE_URL) {
                setError("API Configuration Error: BASE_URL is not set.");
                return;
            }

            const fetchWallets = async () => {
                const token = localStorage.getItem("token");
                try {
                    // ✅ Use BASE_URL here for data fetching
                    const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
                    const data = await res.json();
                    if (res.ok) {
                        setWallets(data.wallets || []);
                        // Set defaults if wallets exist
                        if (data.wallets.length >= 2) {
                            setSourceId(data.wallets[0].wallet_id);
                            setDestId(data.wallets[1].wallet_id);
                        }
                    }
                } catch (e) { console.error(e); }
            };
            fetchWallets();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!BASE_URL) {
            setError("API Configuration Error: BASE_URL is not set.");
            return;
        }

        if (sourceId === destId) {
            setError("Source and Destination wallets cannot be the same.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // ✅ Use BASE_URL here for the POST request
            const res = await fetch(`${BASE_URL}/dashboard/transfer`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({
                    source_wallet_id: sourceId,
                    dest_wallet_id: destId,
                    amount: parseFloat(amount),
                    date
                })
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Transfer failed");
            }
        } catch (e) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <ArrowRightLeft size={20} />
                    </div>
                    Transfer Funds
                </h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* From */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From</label>
                        <select
                            value={sourceId}
                            onChange={e => setSourceId(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Source Wallet</option>
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id} disabled={w.wallet_id == destId}>
                                    {w.name} (${Number(w.balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* To */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To</label>
                        <select
                            value={destId}
                            onChange={e => setDestId(e.target.value)}
                            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select Destination Wallet</option>
                            {wallets.map(w => (
                                <option key={w.wallet_id} value={w.wallet_id} disabled={w.wallet_id == sourceId}>
                                    {w.name} (${Number(w.balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-2"
                    >
                        {loading ? 'Processing...' : 'Transfer Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}