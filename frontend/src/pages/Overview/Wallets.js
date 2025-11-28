import React, { useState, useEffect } from 'react';
import {
    Wallet, Plus, Pencil, CreditCard, Banknote, Coins,
    ArrowUpRight, ArrowDownRight, Search, Filter
} from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';
import EditWalletModal from '../../components/EditWalletModal';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';
import WalletDetailsModal from '../../components/WalletDetailsModal';

const getWalletStyle = (type) => {
    const t = type?.toLowerCase();
    if (t === 'crypto') return { icon: Coins, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    if (t === 'bank') return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (t === 'stocks') return { icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' };
    return { icon: Banknote, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
};

export default function Wallets({ onAddTransaction, onAddWallet, refreshTrigger, onTriggerRefresh }) {
    const [wallets, setWallets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [showFilter, setShowFilter] = useState(false);

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);
    const [detailWalletId, setDetailWalletId] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
    }, [refreshTrigger]);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch =
            tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tx.category_name && tx.category_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (tx.wallet_name && tx.wallet_name.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesSearch && (filterType === 'all' || tx.type === filterType);
    });

    const handleEditWallet = (wallet) => { setSelectedWallet(wallet); setIsEditModalOpen(true); };
    const handleTxClick = (tx) => { setSelectedTx(tx); setIsTxModalOpen(true); };
    const handleWalletClick = (id) => { setDetailWalletId(id); setIsDetailModalOpen(true); };

    if (loading) return <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">Loading wallets...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><h2 className="text-3xl font-bold text-gray-900 dark:text-white">My Assets</h2><p className="text-gray-500 dark:text-gray-400 mt-1">Manage your wallets and view recent activity.</p></div>
                <div className="flex gap-3">
                    <button onClick={onAddWallet} className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"><Wallet size={18} className="mr-2" /> New Wallet</button>
                    <button onClick={onAddTransaction} className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md shadow-blue-600/20"><Plus size={18} className="mr-2" /> Add Transaction</button>
                </div>
            </div>

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {wallets.map(wallet => {
                    const style = getWalletStyle(wallet.type);
                    return (
                        <div key={wallet.wallet_id} onClick={() => handleWalletClick(wallet.wallet_id)} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200 cursor-pointer">
                            <button onClick={(e) => { e.stopPropagation(); handleEditWallet(wallet); }} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Edit Wallet"><Pencil size={16} /></button>
                            <div className="flex items-start justify-between mb-6">
                                <div className={`p-3.5 rounded-xl ${style.bg} ${style.color}`}><style.icon size={24} /></div>
                                {wallet.purpose && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg">{wallet.purpose}</span>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 capitalize">{wallet.type}</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{wallet.name}</h3>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>
                    );
                })}
                {wallets.length === 0 && <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50"><div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"><Wallet className="text-gray-400" size={32} /></div><p className="text-gray-500 dark:text-gray-400 font-medium">No wallets created yet.</p><button onClick={onAddWallet} className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">Create your first wallet</button></div>}
            </div>

            {/* Transactions List */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center px-3 py-2 border rounded-xl text-sm font-medium transition ${showFilter || filterType !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}><Filter size={16} className="mr-2" /> {filterType === 'all' ? 'Filter' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}</button>
                            {showFilter && <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-10">{['all', 'income', 'expense'].map((type) => (<button key={type} onClick={() => { setFilterType(type); setShowFilter(false); }} className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-50 dark:hover:bg-gray-700/50 ${filterType === type ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}>{type}</button>))}</div>}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    {filteredTransactions.length === 0 ? <div className="p-12 text-center"><div className="inline-flex p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 mb-3"><Search size={24} /></div><p className="text-gray-500 dark:text-gray-400">{transactions.length === 0 ? "No transactions found." : "No matches found for your search."}</p></div> :
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTransactions.map(tx => {
                                const isIncome = tx.type === 'income';
                                return (
                                    <div key={tx.transaction_id} onClick={() => handleTxClick(tx)} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${isIncome ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>{isIncome ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}</div>
                                            <div><p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tx.name}</p><div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-0.5"><span className="font-medium">{tx.category_name || 'Uncategorized'}</span><span className="mx-1.5">•</span><span>{new Date(tx.transaction_date).toLocaleDateString()}</span><span className="mx-1.5">•</span><span>{tx.wallet_name}</span></div></div>
                                        </div>
                                        <div className={`text-right font-bold text-base ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </div>
            </div>

            <EditWalletModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} wallet={selectedWallet} onSuccess={onTriggerRefresh} />
            <TransactionDetailsModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} transaction={selectedTx} onSuccess={onTriggerRefresh} />
            {/* 🟢 WALLET DETAILS MODAL */}
            <WalletDetailsModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} walletId={detailWalletId} />
        </div>
    );
}