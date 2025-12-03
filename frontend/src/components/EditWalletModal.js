import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">{title}</h3>
                {children}
            </div>
        </div>
    );
};

export default function EditWalletModal({ isOpen, onClose, wallet, onSuccess }) {
    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('bank');
    const [balance, setBalance] = useState('');
    const [purpose, setPurpose] = useState('');

    // 🟢 Pre-fill form when wallet data changes
    useEffect(() => {
        if (wallet) {
            setName(wallet.name);
            setType(wallet.type);
            setBalance(wallet.balance);
            setPurpose(wallet.purpose || '');
        }
    }, [wallet]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!wallet) return;

        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const response = await fetch(`${BASE_URL}/dashboard/wallet/${wallet.wallet_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    name,
                    type,
                    balance: parseFloat(balance),
                    purpose
                })
            });

            if(response.ok) {
                alert("Wallet Updated Successfully!");
                if (onSuccess) onSuccess(); // 🟢 Use success callback instead of reload
                onClose();
            } else {
                const err = await response.json();
                alert("Failed: " + (err.error || "Unknown error"));
            }
        } catch(err) { console.error(err); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Wallet">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wallet Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Balance</label>
                        <input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} required className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                    <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                </div>

                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition">Save Changes</button>
            </form>
        </Modal>
    );
}