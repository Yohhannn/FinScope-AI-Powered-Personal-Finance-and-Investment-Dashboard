import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save } from 'lucide-react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
};

export default function TransactionDetailsModal({ isOpen, onClose, transaction }) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);

    // Reset state when modal opens with a new transaction
    useEffect(() => {
        if (transaction) {
            setForm({
                name: transaction.name,
                amount: Math.abs(transaction.amount),
                type: transaction.type,
                wallet_id: transaction.wallet_id,
                category_id: transaction.category_id || '',
                date: new Date(transaction.transaction_date).toISOString().split('T')[0],
                description: transaction.description || ''
            });
            setIsEditing(false);
        }
    }, [transaction, isOpen]);

    // Fetch Dropdown Data
    useEffect(() => {
        if (isEditing) {
            const fetchData = async () => {
                const token = localStorage.getItem("token");
                try {
                    const [wRes, cRes] = await Promise.all([
                        fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } }),
                        fetch("http://localhost:5000/api/dashboard/categories", { headers: { Authorization: token } })
                    ]);

                    if (wRes.ok) { const d = await wRes.json(); setWallets(d.wallets); }
                    if (cRes.ok) { const c = await cRes.json(); setCategories(c); }
                } catch(e) { console.error(e); }
            };
            fetchData();
        }
    }, [isEditing]);

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/transaction/${transaction.transaction_id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });
            if (res.ok) { onClose(); window.location.reload(); }
        } catch (e) { console.error(e); }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/transaction/${transaction.transaction_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });
            if (res.ok) { onClose(); window.location.reload(); }
        } catch (e) { console.error(e); }
    };

    if (!transaction) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

            {!isEditing ? (
                <>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{transaction.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{new Date(transaction.transaction_date).toLocaleDateString()}</p>

                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Amount</span>
                            <span className={`font-bold text-xl ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}
                </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Category</span>
                            <span className="text-gray-900 dark:text-white">{transaction.category_name || 'Uncategorized'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Wallet</span>
                            <span className="text-gray-900 dark:text-white">{transaction.wallet_name}</span>
                        </div>
                        {transaction.description && <div className="pt-2 border-t border-gray-200 dark:border-gray-700"><p className="text-sm text-gray-600 dark:text-gray-300 italic">{transaction.description}</p></div>}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setIsEditing(true)} className="flex-1 flex items-center justify-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"><Edit2 size={18} className="mr-2" /> Edit</button>
                        <button onClick={handleDelete} className="flex-1 flex items-center justify-center py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"><Trash2 size={18} className="mr-2" /> Delete</button>
                    </div>
                </>
            ) : (
                <form onSubmit={handleUpdate} className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Edit Transaction</h3>
                    <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button type="button" onClick={() => setForm({...form, type: 'expense'})} className={`w-1/2 p-2 rounded text-sm ${form.type === 'expense' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>Expense</button>
                        <button type="button" onClick={() => setForm({...form, type: 'income'})} className={`w-1/2 p-2 rounded text-sm ${form.type === 'income' ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>Income</button>
                    </div>
                    <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Name" />
                    <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Amount" />
                    <div className="grid grid-cols-2 gap-4">
                        <select value={form.wallet_id} onChange={e => setForm({...form, wallet_id: e.target.value})} className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-600">{wallets.map(w => <option key={w.wallet_id} value={w.wallet_id}>{w.name}</option>)}</select>
                        <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-600"><option value="">Uncategorized</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}</select>
                    </div>
                    <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Description"></textarea>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-500 text-white rounded-lg">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center"><Save size={18} className="mr-2"/> Save</button>
                    </div>
                </form>
            )}
        </Modal>
    );
}