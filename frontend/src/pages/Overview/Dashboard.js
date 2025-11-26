import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, TrendingUp, Sparkles,
    BarChart3, Settings as SettingsIcon, Sun, Moon, Plus, Bell, User,
    ChevronDown, Lightbulb, ArrowRight
} from 'lucide-react';

// 1. Import Shared Components
import { Card, SectionHeader } from '../../components/DashboardUI';
import AddTransactionModal from '../../components/AddTransactionModal';

// 2. Import Your Sub-Pages
import Wallets from './Wallets';
import BudgetGoals from './Budget-Goals';
import Market from './Market';
import AIAdvisor from './AIAdvisor';
import Analytics from './Analytics';
import Settings from './Settings';

// 3. Dashboard Home Component (The "Overview" view)
const DashboardHome = ({ setCurrentPage }) => {
    const [data, setData] = useState({ netWorth: 0, wallets: [], recentTransactions: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch("http://localhost:5000/api/dashboard", {
                    headers: { Authorization: token }
                });
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="p-10 text-center text-gray-500 dark:text-gray-400">Loading your finances...</div>;

    return (
        <div>
            <SectionHeader title="Dashboard" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Net Worth */}
                <Card className="lg:col-span-2 xl:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <div className="text-sm font-medium opacity-80 mb-2">Total Net Worth</div>
                    <div className="text-4xl font-bold mb-4">${Number(data.netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="flex items-center text-sm">
                        <TrendingUp size={18} className="text-green-300 mr-1" />
                        <span className="text-green-300 font-medium">+ 2.9%</span>
                        <span className="opacity-80 ml-1">this month</span>
                    </div>
                </Card>

                {/* AI Insight */}
                <Card className="lg:col-span-2 xl:col-span-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center mb-3">
                        <Lightbulb className="text-blue-600 dark:text-blue-400 mr-3" size={24} />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Quick Insight</h3>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Your spending on "Food" is trending higher. Check your budgets tab.
                    </p>
                    <button onClick={() => setCurrentPage('advisor')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                        Ask AI Advisor for tips <ArrowRight size={16} className="ml-1" />
                    </button>
                </Card>

                {/* Wallets List */}
                <Card className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Wallets</h3>
                        <button onClick={() => setCurrentPage('wallets')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage Wallets</button>
                    </div>
                    <div className="space-y-4">
                        {data.wallets.length === 0 ? <p className="text-gray-500">No wallets connected.</p> :
                            data.wallets.map(wallet => (
                                <div key={wallet.wallet_id} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                                            <Wallet size={20} className="text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">{wallet.name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{wallet.type}</div>
                                        </div>
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>

                {/* Transactions List */}
                <Card className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                        {data.recentTransactions.length === 0 ? <p className="text-gray-500">No transactions yet.</p> :
                            data.recentTransactions.map(tx => (
                                <div key={tx.transaction_id} className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white">{tx.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{tx.wallet_name} • {new Date(tx.transaction_date).toLocaleDateString()}</div>
                                    </div>
                                    <div className={`text-lg font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                        {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// 4. MAIN LAYOUT
export default function Dashboard() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // The Switcher Logic
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardHome setCurrentPage={setCurrentPage} />;
            case 'wallets': return <Wallets onAddTransaction={() => setIsTransactionModalOpen(true)} />;
            case 'budgets': return <BudgetGoals />;
            case 'markets': return <Market />;
            case 'advisor': return <AIAdvisor />;
            case 'analytics': return <Analytics />;
            case 'settings': return <Settings />;
            default: return <DashboardHome setCurrentPage={setCurrentPage} />;
        }
    };

    return (
        <div className={`flex h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
            <style>{`body { background-color: ${isDarkMode ? '#030712' : '#f9fafb'}; }`}</style>

            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen flex flex-col p-4 fixed z-20">
                <div className="flex items-center p-4 mb-6">
                    <Sparkles size={32} className="text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">FinScope</h1>
                </div>

                <nav className="flex-1 space-y-1">
                    {[
                        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                        { id: 'wallets', icon: Wallet, label: 'Wallets' },
                        { id: 'budgets', icon: PiggyBank, label: 'Budgets' },
                        { id: 'markets', icon: TrendingUp, label: 'Markets' },
                        { id: 'advisor', icon: Sparkles, label: 'AI Advisor' },
                        { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setCurrentPage(item.id)}
                            className={`flex items-center w-full p-3 my-1 rounded-lg transition-colors ${
                                currentPage === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <item.icon size={20} className="mr-4" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto space-y-2">
                    <button onClick={() => setCurrentPage('settings')} className={`flex items-center w-full p-3 rounded-lg transition-colors ${currentPage === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        <SettingsIcon size={20} className="mr-4" />
                        <span className="font-medium">Settings</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-red-900/20">
                        <span className="font-medium">Sign Out</span>
                    </button>
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="flex items-center w-full p-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        {isDarkMode ? <Sun size={20} className="mr-4" /> : <Moon size={20} className="mr-4" />}
                        <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col ml-64 bg-gray-50 dark:bg-gray-950 h-screen overflow-y-auto">
                <header className="flex justify-end items-center p-8">
                    <div className="flex items-center space-x-6">
                        <button className="text-gray-500 dark:text-gray-400 hover:text-white relative">
                            <Bell size={24} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                <User size={20} />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">User</span>
                            <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                </header>
                <main className="p-10 pt-0">
                    {renderPage()}
                </main>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsTransactionModalOpen(true)}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg z-30 transition-transform hover:scale-110"
                title="Add New Transaction"
            >
                <Plus size={28} />
            </button>

            {/* Modal */}
            <AddTransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
            />
        </div>
    );
}