import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, Sparkles,
    BarChart3, Settings as SettingsIcon, Sun, Moon, Plus, Bell, User,
    ChevronDown, Lightbulb, ArrowRight, ArrowUpRight, ArrowDownRight, CreditCard, LogOut, X, Target, Star
} from 'lucide-react';

import { Card, ProgressBar } from '../../components/DashboardUI';
import AddTransactionModal from '../../components/AddTransactionModal';
import AddWalletModal from '../../components/AddWalletModal';
import TransactionDetailsModal from '../../components/TransactionDetailsModal';

import Wallets from './Wallets';
import BudgetGoals from './Budget-Goals';
import AIAdvisor from './AIAdvisor';
import Analytics from './Analytics';
import Settings from './Settings';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

const DashboardHome = ({ setCurrentPage, user, refreshTrigger, onTriggerRefresh }) => {
    const [data, setData] = useState({ netWorth: 0, wallets: [], recentTransactions: [], budgets: [], goals: [] });
    const [loading, setLoading] = useState(true);
    const [selectedTx, setSelectedTx] = useState(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");
                const [dashRes] = await Promise.all([
                    fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } })
                ]);

                if (dashRes.ok) {
                    const dashData = await dashRes.json();
                    setData({
                        netWorth: dashData.netWorth,
                        wallets: dashData.wallets,
                        recentTransactions: dashData.recentTransactions,
                        budgets: dashData.budgets, // Pinned Only
                        goals: dashData.goals      // Pinned Only
                    });
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchDashboard();
    }, [refreshTrigger]);

    const handleTxClick = (tx) => { setSelectedTx(tx); setIsTxModalOpen(true); };

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">Loading your finances...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {user?.name || 'User'}</h1><p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your money today.</p></div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10"><div className="flex items-center gap-2 text-blue-100 mb-2"><Sparkles size={18} /> <span>Total Net Worth</span></div><h2 className="text-4xl font-bold tracking-tight mb-4">${Number(data.netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2><div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium"><ArrowUpRight size={16} className="mr-1" /> +2.4% this month</div></div><div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
                <Card className="md:col-span-2 border-l-4 border-l-blue-500 flex flex-col justify-center">
                    <div className="flex items-start gap-4"><div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400"><Lightbulb size={24} /></div><div className="flex-1"><h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">AI Financial Insight</h3><p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">Based on your spending, you've used <strong>80%</strong> of your Food budget. Consider cooking at home for the rest of the week.</p><button onClick={() => setCurrentPage('advisor')} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center group">Ask AI Advisor <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" /></button></div></div>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex justify-between items-end mb-4 px-1"><h3 className="text-xl font-bold text-gray-900 dark:text-white">My Wallets</h3><button onClick={() => setCurrentPage('wallets')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage All</button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.wallets.slice(0, 4).map(wallet => (
                                <div key={wallet.wallet_id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition flex items-center justify-between">
                                    <div className="flex items-center gap-4"><div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300"><CreditCard size={20} /></div><div><p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{wallet.type}</p><h4 className="font-bold text-gray-900 dark:text-white">{wallet.name}</h4></div></div><span className="font-semibold text-gray-900 dark:text-white">${Number(wallet.balance).toLocaleString()}</span>
                                </div>
                            ))}
                            {data.wallets.length === 0 && <p className="text-gray-500 p-4">No wallets added yet.</p>}
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-end mb-4 px-1"><h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Transactions</h3></div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            {data.recentTransactions.length === 0 ? <div className="p-8 text-center text-gray-500">No transactions yet.</div> : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {data.recentTransactions.map(tx => {
                                        const isIncome = tx.type === 'income';
                                        return (
                                            <div key={tx.transaction_id} onClick={() => handleTxClick(tx)} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition duration-150">
                                                <div className="flex items-center gap-4"><div className={`p-2.5 rounded-full ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</div><div><p className="font-semibold text-gray-900 dark:text-white">{tx.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{tx.category_name || 'Uncategorized'} • {new Date(tx.transaction_date).toLocaleDateString()}</p></div></div><span className={`font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>{isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Pinned Items */}
                <div className="lg:col-span-1 space-y-8">
                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2"><Star size={18} className="text-yellow-500" fill="currentColor" /><h3 className="text-xl font-bold text-gray-900 dark:text-white">Pinned Budgets</h3></div>
                            <button onClick={() => setCurrentPage('budgets')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                            {data.budgets.length === 0 ? <div className="text-center py-4"><p className="text-sm text-gray-500">No pinned budgets.</p><button onClick={() => setCurrentPage('budgets')} className="text-xs text-blue-500 hover:underline mt-1">Go pin some!</button></div> :
                                data.budgets.map(budget => (
                                    <div key={budget.budget_id}><div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{budget.category_name}</span><span className="text-gray-500">${parseFloat(budget.spent).toLocaleString()} / ${parseFloat(budget.limit_amount).toLocaleString()}</span></div><ProgressBar current={parseFloat(budget.spent)} total={parseFloat(budget.limit_amount)} color="blue" /></div>
                                ))
                            }
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2"><Star size={18} className="text-yellow-500" fill="currentColor" /><h3 className="text-xl font-bold text-gray-900 dark:text-white">Pinned Goals</h3></div>
                            <button onClick={() => setCurrentPage('budgets')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                            {data.goals.length === 0 ? <div className="text-center py-4"><p className="text-sm text-gray-500">No pinned goals.</p><button onClick={() => setCurrentPage('budgets')} className="text-xs text-green-500 hover:underline mt-1">Go pin some!</button></div> :
                                data.goals.map(goal => (
                                    <div key={goal.goal_id}><div className="flex justify-between text-sm mb-1.5"><div className="flex items-center gap-2"><Target size={14} className="text-green-500" /><span className="font-semibold text-gray-700 dark:text-gray-300">{goal.name}</span></div><span className="text-gray-500">${parseFloat(goal.current_amount).toLocaleString()} / ${parseFloat(goal.target_amount).toLocaleString()}</span></div><ProgressBar current={parseFloat(goal.current_amount)} total={parseFloat(goal.target_amount)} color="green" /></div>
                                ))
                            }
                        </div>
                    </section>
                </div>
            </div>

            <TransactionDetailsModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} transaction={selectedTx} onSuccess={onTriggerRefresh} />
        </div>
    );
};

export default function Dashboard() {
    // ... (Main Layout logic remains the same as previous step) ...
    const [currentPage, setCurrentPage] = useState(() => localStorage.getItem("lastPage") || 'dashboard');
    const navigate = useNavigate();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [user, setUser] = useState({ name: 'User' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => { localStorage.setItem("lastPage", currentPage); }, [currentPage]);
    useEffect(() => { const storedUser = localStorage.getItem("user"); if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); } } }, []);
    const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem("theme"); return saved ? JSON.parse(saved) : true; });
    useEffect(() => { const root = window.document.documentElement; if (isDarkMode) { root.classList.add('dark'); localStorage.setItem("theme", "true"); } else { root.classList.remove('dark'); localStorage.setItem("theme", "false"); } }, [isDarkMode]);
    useEffect(() => { const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false); if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);
    const handleLogout = () => { localStorage.clear(); navigate("/login"); };

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <DashboardHome setCurrentPage={setCurrentPage} user={user} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />;
            case 'wallets': return <Wallets onAddTransaction={() => setIsTransactionModalOpen(true)} onAddWallet={() => setIsWalletModalOpen(true)} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />;
            case 'budgets': return <BudgetGoals />;
            case 'advisor': return <AIAdvisor />;
            case 'analytics': return <Analytics />;
            case 'settings': return <Settings />;
            default: return <DashboardHome setCurrentPage={setCurrentPage} user={user} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />;
        }
    };

    return (
        <div className={`flex h-screen font-sans ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-950`}>
            <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col p-4 fixed z-20">
                <div className="flex items-center gap-3 px-4 py-6 mb-2"><div className="p-2 bg-blue-600 rounded-xl"><Sparkles size={24} className="text-white" /></div><h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FinScope</h1></div>
                <nav className="flex-1 space-y-1.5">{[{ id: 'dashboard', icon: LayoutDashboard, label: 'Overview' }, { id: 'wallets', icon: Wallet, label: 'Wallets' }, { id: 'budgets', icon: PiggyBank, label: 'Budgets' }, { id: 'advisor', icon: Sparkles, label: 'AI Advisor' }, { id: 'analytics', icon: BarChart3, label: 'Analytics' }].map(item => (<button key={item.id} onClick={() => setCurrentPage(item.id)} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all font-medium ${currentPage === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}><item.icon size={20} className="mr-3" />{item.label}</button>))}</nav>
                <div className="mt-auto space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4"><button onClick={() => setCurrentPage('settings')} className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium"><SettingsIcon size={20} className="mr-3" /> Settings</button><button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition font-medium"><ArrowRight size={20} className="mr-3 rotate-180" /> Sign Out</button><button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium transition mt-2">{isDarkMode ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}</button></div>
            </div>
            <div className="flex-1 flex flex-col ml-64 h-screen overflow-y-auto">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-end items-center gap-6">
                    <div className="relative" ref={notifRef}><button onClick={() => setIsNotifOpen(!isNotifOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition relative p-1"><Bell size={22} /><span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span></button>{isNotifOpen && (<div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"><div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800"><h4 className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</h4><button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-500"><X size={16}/></button></div><div className="py-2"><div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition"><p className="text-sm text-gray-800 dark:text-gray-200 font-medium">Budget Alert ⚠️</p><p className="text-xs text-gray-500 mt-1">You've reached 80% of your Food budget.</p></div></div></div>)}</div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <div className="relative" ref={profileRef}><button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition"><div className="text-right hidden sm:block"><p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p></div><div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md"><User size={20} /></div><ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} /></button>{isProfileOpen && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 z-50 animate-in fade-in slide-in-from-top-2"><button onClick={() => { setCurrentPage('settings'); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><SettingsIcon size={16} className="mr-2" /> Settings</button><div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div><button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"><LogOut size={16} className="mr-2" /> Sign Out</button></div>)}</div>
                </header>
                <main className="flex-1 p-8 pb-24">{renderPage()}</main>
            </div>
            <button onClick={() => setIsTransactionModalOpen(true)} className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 z-30 transition-transform hover:scale-110 active:scale-95" title="Add New Transaction"><Plus size={28} /></button>
            <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={triggerRefresh} />
            <AddWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onSuccess={triggerRefresh} />
        </div>
    );
}