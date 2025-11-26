import React from 'react';
import { Wallet, Plus } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI'; // Import shared components

const mockWallets = [
    { id: 1, name: 'Chase Checking', type: 'Bank', balance: 12450.75 },
    { id: 2, name: 'Coinbase', type: 'Crypto', balance: 8300.20 },
    { id: 3, name: 'Apple Pay', type: 'E-Wallet', balance: 750.00 },
    { id: 4, name: 'Robinhood', type: 'Stock', balance: 21500.00 },
];

const mockTransactions = [
    { id: 1, name: 'Starbucks', category: 'Food', amount: -6.50, wallet: 'Apple Pay' },
    { id: 2, name: 'Salary Deposit', category: 'Income', amount: 3500.00, wallet: 'Chase Checking' },
    { id: 3, name: 'BTC Purchase', category: 'Investment', amount: -1000.00, wallet: 'Coinbase' },
    { id: 4, name: 'Netflix Subscription', category: 'Bills', amount: -15.99, wallet: 'Chase Checking' },
    { id: 5, name: 'Whole Foods', category: 'Groceries', amount: -120.50, wallet: 'Apple Pay' },
];

export default function Wallets({ onAddTransaction }) {
    return (
        <div>
            <SectionHeader
                title="Wallets"
                actions={
                    <button className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition">
                        <Plus size={18} className="mr-2" /> Add New Wallet
                    </button>
                }
            />

            {/* Wallets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {mockWallets.map(wallet => (
                    <Card key={wallet.id}>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{wallet.type}</div>
                                <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{wallet.name}</div>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <Wallet size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                            ${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Transactions List */}
            <SectionHeader
                title="All Transactions"
                actions={
                    <button
                        onClick={onAddTransaction}
                        className="flex items-center text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-medium py-2 px-3 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                    >
                        <Plus size={16} className="mr-1.5" /> Add Transaction
                    </button>
                }
            />
            <Card>
                <div className="space-y-4">
                    {mockTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900 dark:text-white">{tx.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{tx.wallet} • {tx.category}</div>
                            </div>
                            <div className={`text-lg font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}