import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Pencil } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';
import EditWalletModal from '../../components/EditWalletModal';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';

export default function Wallets({ onAddTransaction, onAddWallet }) {
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for Edit Wallet
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);

    // State for Transaction Details
    const [selectedTx, setSelectedTx] = useState(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } });
                const data = await res.json();
                if (res.ok) {
                    setWallets(data.wallets);
                    setTransactions(data.recentTransactions);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    // Handlers
    const handleEditWallet = (wallet) => {
        setSelectedWallet(wallet);
        setIsEditModalOpen(true);
    };

    const handleTxClick = (tx) => {
        setSelectedTx(tx);
        setIsTxModalOpen(true);
    };

    if (loading) return <div className="text-center dark:text-white p-10">Loading...</div>;

    return (
        <div>
            <SectionHeader
                title="Wallets"
                actions={
                    <div className="flex gap-2">
                        <button onClick={onAddWallet} className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition">
                            <Plus size={18} className="mr-2" /> Add Wallet
                        </button>
                        <button onClick={onAddTransaction} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition">
                            <Plus size={18} className="mr-2" /> Add Transaction
                        </button>
                    </div>
                }
            />

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {wallets.map(wallet => (
                    <Card key={wallet.wallet_id} className="relative group">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleEditWallet(wallet); }}
                            className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 dark:text-white"
                            title="Edit Wallet"
                        >
                            <Pencil size={16} />
                        </button>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{wallet.type}</div>
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{wallet.name}</div>
                                {wallet.purpose && <div className="text-xs text-gray-400 dark:text-gray-500 italic">{wallet.purpose}</div>}
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Wallet size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                            ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Transactions List */}
            <SectionHeader title="Recent Transactions" />
            <Card>
                <div className="space-y-4">
                    {transactions.length === 0 ? <p className="text-gray-500">No transactions found.</p> :
                        transactions.map(tx => (
                            <div
                                key={tx.transaction_id}
                                onClick={() => handleTxClick(tx)}
                                className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition"
                            >
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{tx.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {tx.wallet_name} • {tx.category_name || 'Uncategorized'}
                                    </div>
                                </div>
                                <div className={`text-lg font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                    {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                </div>
            </Card>

            {/* Modals */}
            <EditWalletModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                wallet={selectedWallet}
            />
            <TransactionDetailsModal
                isOpen={isTxModalOpen}
                onClose={() => setIsTxModalOpen(false)}
                transaction={selectedTx}
            />
        </div>
    );
}