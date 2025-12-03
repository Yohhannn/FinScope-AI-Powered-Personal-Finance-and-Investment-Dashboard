import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_API_URL;

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
                {children}
            </div>
        </div>
    );
};

export default function AddWalletModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [type, setType] = useState('bank');
    const [balance, setBalance] = useState('');
    const [purpose, setPurpose] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const initialAmount = parseFloat(balance);

            // 🟢 STEP 1: Create Wallet with 0 Balance first
            // We do this so we can add the balance via a Transaction, making it appear in Analytics.
            const walletRes = await fetch(`${BASE_URL}/dashboard/wallet`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    name,
                    type,
                    balance: 0, // Start with 0
                    purpose
                })
            });

            if (!walletRes.ok) {
                const err = await walletRes.json();
                throw new Error(err.error || "Failed to create wallet");
            }

            const walletData = await walletRes.json();
            // Adjust 'wallet_id' or 'id' based on what your specific backend returns
            const newWalletId = walletData.wallet_id || walletData.id;

            // 🟢 STEP 2: Create an "Initial Deposit" Transaction
            // Only if the user entered a balance > 0
            if (initialAmount > 0 && newWalletId) {
                await fetch(`${BASE_URL}/dashboard/transaction`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": token },
                    body: JSON.stringify({
                        name: "Initial Deposit",
                        amount: initialAmount,
                        type: "income",
                        date: new Date().toISOString().split('T')[0],
                        wallet_id: newWalletId,
                        category_id: null,
                        description: `Initial balance for ${name}`
                    })
                });
            }

            alert("Wallet Added Successfully!");
            if (onSuccess) onSuccess();
            onClose();
            setName(''); setBalance(''); setPurpose('');

        } catch (err) {
            console.error(err);
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Wallet">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Chase Checking" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                            <option value="bank">Bank</option>
                            <option value="ewallet">E-Wallet</option>
                            <option value="crypto">Crypto</option>
                            <option value="stocks">Stocks</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Balance</label>
                        <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="0.00" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose (Optional)</label>
                    <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="e.g. Daily Expenses" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition flex items-center justify-center">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Wallet"}
                </button>
            </form>
        </Modal>
    );
}