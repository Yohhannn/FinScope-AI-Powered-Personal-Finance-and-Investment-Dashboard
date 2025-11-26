import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, TrendingUp, Sparkles, BarChart3, Settings,
    Sun, Moon, ChevronDown, ArrowRight, Plus, Bell, User, ExternalLink, Download,
    AlertTriangle, Lightbulb, X, Send
} from 'lucide-react';

// --- Components ---

// 1. Card Component
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${className}`}>
        {children}
    </div>
);

// 2. Section Header
const SectionHeader = ({ title, actions }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
);

// 3. Progress Bar (Static for now)
const ProgressBar = ({ current, total, color = 'blue' }) => {
    const percentage = Math.min((current / total) * 100, 100);
    const colorClasses = {
        blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600', yellow: 'bg-yellow-500',
    };
    return (
        <div>
            <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                <span>${current.toLocaleString()}</span>
                <span>${total.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className={`${colorClasses[color]} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

// 4. Modal Component
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

// --- SUB-PAGES ---

// A. DASHBOARD HOME (Connected to Backend!)
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

    if (loading) return <div className="p-10 text-center text-white">Loading your finances...</div>;

    return (
        <div>
            <SectionHeader title="Dashboard" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {/* Net Worth */}
                <Card className="lg:col-span-2 xl:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                    <div className="text-sm font-medium opacity-80 mb-2">Total Net Worth</div>
                    <div className="text-4xl font-bold mb-4">${Number(data.netWorth).toLocaleString()}</div>
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
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Wallets</h3>
                    <div className="space-y-4">
                        {data.wallets.map(wallet => (
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
                                    ${Number(wallet.balance).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Transactions List */}
                <Card className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                    <div className="space-y-4">
                        {data.recentTransactions.map(tx => (
                            <div key={tx.transaction_id} className="flex justify-between items-center">
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-white">{tx.name}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{tx.wallet_name} • {new Date(tx.transaction_date).toLocaleDateString()}</div>
                                </div>
                                <div className={`text-lg font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                    {tx.type === 'income' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Placeholder Pages (You can expand these later)
const WalletsPage = () => <div className="text-white text-2xl">Manage your Wallets here (Coming Soon)</div>;
const BudgetsPage = () => <div className="text-white text-2xl">Budgets & Goals (Coming Soon)</div>;
const MarketsPage = () => <div className="text-white text-2xl">Market Data (Coming Soon)</div>;
const AIAdvisorPage = () => <div className="text-white text-2xl">AI Chat (Coming Soon)</div>;
const AnalyticsPage = () => <div className="text-white text-2xl">Analytics Charts (Coming Soon)</div>;
const SettingsPage = () => <div className="text-white text-2xl">Settings (Coming Soon)</div>;

// --- MAIN LAYOUT ---

export default function Dashboard() {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isDarkMode, setIsDarkMode] = useState(true);
    const navigate = useNavigate();

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardHome setCurrentPage={setCurrentPage} />;
            case 'wallets': return <WalletsPage />;
            case 'budgets': return <BudgetsPage />;
            case 'markets': return <MarketsPage />;
            case 'advisor': return <AIAdvisorPage />;
            case 'analytics': return <AnalyticsPage />;
            case 'settings': return <SettingsPage />;
            default: return <DashboardHome />;
        }
    };

    return (
        <div className={`flex h-screen font-sans ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen flex flex-col p-4 fixed">
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
                    <div className="flex items-center space-x-4">
                        <span className="font-medium text-gray-900 dark:text-white">Welcome back</span>
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <User size={20} />
                        </div>
                    </div>
                </header>
                <main className="p-10 pt-0">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}