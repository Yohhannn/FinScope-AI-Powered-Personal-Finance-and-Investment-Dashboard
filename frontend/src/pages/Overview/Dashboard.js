import React, { useState, useEffect, useCallback, useRef } from 'react';
// 🟢 REQUIRED IMPORTS FOR ROUTING
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, Sparkles,
    BarChart3, Settings as SettingsIcon, Sun, Moon, Plus, Bell, User,
    ChevronDown, Lightbulb, ArrowRight, ArrowUpRight, ArrowDownRight,
    CreditCard, LogOut, X, Target, Star, Loader2, RotateCw, Menu
} from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

// 🟢 NEW: Define internal paths for routing
// ADDED SLASHES (/) TO MAKE PATHS ABSOLUTE
const APP_ROUTES = {
    HOME: '/',
    WALLETS: '/wallets',        // Changed from 'wallets' to '/wallets'
    BUDGETS_GOALS: '/budgets',  // Changed from 'budgets' to '/budgets'
    AI_ADVISOR: '/advisor',     // Changed from 'advisor' to '/advisor'
    ANALYTICS: '/analytics',    // Changed from 'analytics' to '/analytics'
    SETTINGS: '/settings',      // Changed from 'settings' to '/settings'
};

// =================================================================
// 🚨 CRITICAL FIX: Ensure these are actual imports from their files.
// REMOVED: Placeholder component definitions (e.g., const Wallets = ...)
// If you do not have these files, this WILL crash.
// Example Imports (Adjust paths as needed for your project structure):
import Wallets from './Wallets';
import BudgetGoals from './Budget-Goals';
import AIAdvisor from './AIAdvisor';
import Analytics from './Analytics';
import Settings from './Settings';
// =================================================================

// --- DUMMY PLACEHOLDERS (REPLACE WITH REAL IMPORTS IN YOUR PROJECT) ---
// *******************************************************************
// Keeping these as dummy definitions to make this file runnable,
// but in your project, they should be imports from separate files.
// *******************************************************************
// const Wallets = ({ onAddTransaction, onAddWallet, refreshTrigger, onTriggerRefresh }) => (
//     <div className="text-center py-24 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl m-4">
//         <p className="mb-4">Wallets Component Loaded Successfully</p>
//         <button onClick={onAddTransaction} className="text-blue-500 hover:underline mr-4">Add Transaction</button>
//         <button onClick={onAddWallet} className="text-blue-500 hover:underline">Add Wallet</button>
//     </div>
// );
//const BudgetGoals = () => <div className="text-center py-24 text-gray-500 dark:text-gray-400">Budget/Goals Component Loaded Successfully</div>;
//const AIAdvisor = () => <div className="text-center py-24 text-gray-500 dark:text-gray-400">AI Advisor Component Loaded Successfully</div>;
//const Analytics = () => <div className="text-center py-24 text-gray-500 dark:text-gray-400">Analytics Component Loaded Successfully</div>;
//const Settings = () => <div className="text-center py-24 text-gray-500 dark:text-gray-400">Settings Component Loaded Successfully</div>;
// --- END DUMMY PLACEHOLDERS ---

// --- UI Component Imports (Mocks) ---
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);
const ProgressBar = ({ current, total, color = 'blue' }) => {
    const percentage = Math.min((current / total) * 100, 100);
    const colorClasses = {
        blue: 'bg-blue-600', green: 'bg-green-600', purple: 'bg-purple-600', yellow: 'bg-yellow-500', red: 'bg-red-500',
    };
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className={`h-2 rounded-full ${colorClasses[color]}`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};
const MockModal = ({ isOpen, onClose, onSuccess, selectedTx }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-lg w-full">
                <h3 className="text-xl font-bold mb-4">Transaction/Wallet Mock Modal</h3>
                <p className="text-gray-500">{selectedTx ? `Selected TX: ${selectedTx.name}` : 'No transaction selected'}</p>
                <button onClick={() => { onSuccess(); onClose(); }} className="mt-4 bg-blue-500 text-white p-2 rounded-lg">Done</button>
            </div>
        </div>
    );
};
const AddTransactionModal = MockModal;
const AddWalletModal = MockModal;
const TransactionDetailsModal = MockModal;
// --- End UI Component Imports ---


// Helper function
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// 🟢 DASHBOARD HOME COMPONENT
const DashboardHome = ({ user, refreshTrigger, onTriggerRefresh }) => {
    const [data, setData] = useState({ netWorth: 0, netWorthChange: 0, wallets: [], recentTransactions: [], budgets: [], goals: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 🟢 AI States
    const [aiInsight, setAiInsight] = useState(() => localStorage.getItem('aiInsight') || '');
    const [aiLoading, setAiLoading] = useState(false);

    const [selectedTx, setSelectedTx] = useState(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    const generateInsight = async () => {
        setAiLoading(true);
        setAiInsight('');

        if (!BASE_URL) {
            setAiInsight("API Configuration Error: BASE_URL is not set.");
            setAiLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    message: "Look at my dashboard data. Give me a 2-sentence summary of my financial health and 1 actionable tip."
                })
            });
            const result = await res.json();

            if (res.ok) {
                setAiInsight(result.reply);
                localStorage.setItem('aiInsight', result.reply);
            }
        } catch (e) {
            console.error("AI Error:", e);
            setAiInsight("I couldn't analyze your data right now.");
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            if (!BASE_URL) {
                console.error("Configuration Error: API URL is missing. Cannot fetch data.");
                setLoading(false);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
                if (res.ok) {
                    const dashData = await res.json();
                    setData({
                        netWorth: dashData.netWorth,
                        netWorthChange: dashData.netWorthChange || 0,
                        wallets: dashData.wallets,
                        recentTransactions: dashData.recentTransactions,
                        budgets: dashData.budgets.filter(b => b.is_pinned),
                        goals: dashData.goals.filter(g => g.is_pinned)
                    });
                } else {
                    console.error(`Dashboard Data Fetch Failed: Status ${res.status}.`);
                }
            } catch (error) {
                console.error("Network or API Fetch Error:", error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [refreshTrigger]);

    useEffect(() => {
        if (!aiInsight) {
            generateInsight();
        }
    }, []);

    const handleTxClick = (tx) => { setSelectedTx(tx); setIsTxModalOpen(true); };

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">Loading your finances...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {user?.name || 'User'}</h1><p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your money today.</p></div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 🟢 Net Worth Card */}
                <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-100 mb-2">
                            <Sparkles size={18} /> <span>Total Net Worth</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                            ${Number(data.netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h2>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full backdrop-blur-sm text-sm font-medium ${parseFloat(data.netWorthChange) >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'}`}>
                            {parseFloat(data.netWorthChange) >= 0 ? (<ArrowUpRight size={16} className="mr-1" />) : (<ArrowDownRight size={16} className="mr-1" />)}
                            {Math.abs(data.netWorthChange)}% this month
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* AI Insight Card */}
                <Card className="md:col-span-2 border-l-4 border-l-blue-500 flex flex-col justify-center relative">
                    <button onClick={generateInsight} disabled={aiLoading} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition disabled:opacity-50" title="Refresh Insight">
                        {aiLoading ? <Loader2 size={18} className="animate-spin" /> : <RotateCw size={18} />}
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0"><Lightbulb size={24} /></div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">AI Financial Insight</h3>
                            {aiLoading ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">Analyzing your latest transactions...</p>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                    {aiInsight || "Click refresh to generate an insight based on your current data."}
                                </p>
                            )}
                            {/* 🟢 Use navigate */}
                            <button onClick={() => navigate(APP_ROUTES.AI_ADVISOR)} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center group">
                                Ask AI Advisor <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        {/* 🟢 Updated to use navigate */}
                        <div className="flex justify-between items-end mb-4 px-1"><h3 className="text-xl font-bold text-gray-900 dark:text-white">My Wallets</h3><button onClick={() => navigate(APP_ROUTES.WALLETS)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage All</button></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {data.wallets.slice(0, 4).map(wallet => (
                                <div key={wallet.wallet_id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition flex items-center justify-between">
                                    <div className="flex items-center gap-4"><div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300"><CreditCard size={20} /></div><div><p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{wallet.type}</p><h4 className="font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{wallet.name}</h4></div></div><span className="font-semibold text-gray-900 dark:text-white">${Number(wallet.balance).toLocaleString()}</span>
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
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-full shrink-0 ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 dark:text-white truncate">{tx.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tx.category_name || 'Uncategorized'} • {new Date(tx.transaction_date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold whitespace-nowrap ml-2 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>{isIncome ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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
                            <button onClick={() => navigate(APP_ROUTES.BUDGETS_GOALS)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                            {data.budgets.length === 0 ? <div className="text-center py-4"><p className="text-sm text-gray-500">No pinned budgets.</p><button onClick={() => navigate(APP_ROUTES.BUDGETS_GOALS)} className="text-xs text-blue-500 hover:underline mt-1">Go pin some!</button></div> :
                                data.budgets.map(budget => (
                                    <div key={budget.budget_id}><div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{budget.category_name}</span><span className="text-gray-500">${parseFloat(budget.spent).toLocaleString()} / ${parseFloat(budget.limit_amount).toLocaleString()}</span></div><ProgressBar current={parseFloat(budget.spent)} total={parseFloat(budget.limit_amount)} color="blue" /></div>
                                ))
                            }
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <div className="flex items-center gap-2"><Star size={18} className="text-yellow-500" fill="currentColor" /><h3 className="text-xl font-bold text-gray-900 dark:text-white">Pinned Goals</h3></div>
                            <button onClick={() => navigate(APP_ROUTES.BUDGETS_GOALS)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage</button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                            {data.goals.length === 0 ? <div className="text-center py-4"><p className="text-sm text-gray-500">No pinned goals.</p><button onClick={() => navigate(APP_ROUTES.BUDGETS_GOALS)} className="text-xs text-green-500 hover:underline mt-1">Go pin some!</button></div> :
                                data.goals.map(goal => (
                                    <div key={goal.goal_id}><div className="flex justify-between text-sm mb-1.5"><div className="flex items-center gap-2"><Target size={14} className="text-green-500" /><span className="font-semibold text-gray-700 dark:text-gray-300">{goal.name}</span></div><span className="text-gray-500">${parseFloat(goal.current_amount).toLocaleString()} / ${parseFloat(goal.target_amount).toLocaleString()}</span></div><ProgressBar current={parseFloat(goal.current_amount)} total={parseFloat(goal.target_amount)} color="green" /></div>
                                ))
                            }
                        </div>
                    </section>
                </div>
            </div>

            <TransactionDetailsModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSuccess={onTriggerRefresh} selectedTx={selectedTx} />
        </div>
    );
};

// 🔵 DASHBOARD MAIN COMPONENT
export default function Dashboard() {
    // ❌ REMOVED: currentPage state and associated useEffects/logic
    const navigate = useNavigate();
    const location = useLocation(); // 🟢 NEW: Get current path for active link styling

    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState({ name: 'User' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const profileRef = useRef(null);
    const notifRef = useRef(null);
    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const [aiNotifications, setAiNotifications] = useState(() => {
        const storedNotifs = localStorage.getItem('aiNotifications');
        return storedNotifs ? JSON.parse(storedNotifs) : [];
    });

    const ALERT_CHECK_INTERVAL_MS = 5 * 60 * 1000;

    const fetchAINotifications = async () => {
        if (!BASE_URL) return;

        const lastCheckTime = parseInt(localStorage.getItem('lastAlertCheckTime') || '0', 10);
        const currentTime = Date.now();

        if (currentTime - lastCheckTime < ALERT_CHECK_INTERVAL_MS) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('lastAlertCheckTime', currentTime.toString());
                const lastAIAlertMessage = localStorage.getItem('lastAIAlertMessage') || '';

                const context = {
                    latestTransaction: data.recentTransactions[0],
                    budgets: data.budgets.map(b => ({ name: b.category_name, spent: parseFloat(b.spent), limit: parseFloat(b.limit_amount) })),
                    goals: data.goals.map(g => ({ name: g.name, current: parseFloat(g.current_amount), target: parseFloat(g.target_amount) })),
                    netWorth: data.netWorth
                };

                const message = `Analyze the following real-time financial data. Identify only ONE critical or actionable alert for the user. Compare the new alert against the LAST ALERT MESSAGE: "${lastAIAlertMessage}".
                If the current critical condition is the SAME as the last alert, respond ONLY with the exact text "NO_CHANGE".
                Otherwise, respond ONLY with the NEW alert text, prefixed by an emoji (e.g., ⚠️, 💡, 📈). Do not provide any other dialogue. Data: ${JSON.stringify(context)}`;

                const aiRes = await fetch(`${BASE_URL}/ai/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": token },
                    body: JSON.stringify({ message })
                });

                const aiResult = await aiRes.json();

                if (aiRes.ok && aiResult.reply) {
                    const newAlertText = aiResult.reply.trim();

                    if (newAlertText !== "NO_CHANGE") {
                        const newNotification = {
                            id: Date.now(),
                            message: newAlertText,
                            isNew: true,
                            timestamp: new Date().toLocaleTimeString()
                        };

                        localStorage.setItem('lastAIAlertMessage', newAlertText);

                        setAiNotifications(prev => {
                            const updated = [newNotification, ...prev].slice(0, 5);
                            localStorage.setItem('aiNotifications', JSON.stringify(updated));
                            return updated;
                        });
                    }
                }
            }
        } catch (e) {
            console.error("AI Notification Error:", e);
            localStorage.setItem('lastAlertCheckTime', '0');
        }
    };

    useEffect(() => {
        fetchAINotifications();
    }, [refreshTrigger]);

    const clearNotification = (id) => {
        setAiNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            localStorage.setItem('aiNotifications', JSON.stringify(updated));
            return updated;
        });
    };

    // ❌ REMOVED: useEffect for currentPage (replaced by router logic)
    useEffect(() => { const storedUser = localStorage.getItem("user"); if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); } } }, []);
    const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem("theme"); return saved ? JSON.parse(saved) : true; });
    useEffect(() => { const root = window.document.documentElement; if (isDarkMode) { root.classList.add('dark'); localStorage.setItem("theme", "true"); } else { root.classList.remove('dark'); localStorage.setItem("theme", "false"); } }, [isDarkMode]);
    useEffect(() => { const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false); if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);

    const handleLogout = () => { localStorage.clear(); localStorage.removeItem('aiInsight'); localStorage.removeItem('aiNotifications'); localStorage.removeItem('lastAlertCheckTime'); localStorage.removeItem('lastAIAlertMessage'); navigate("/login"); };

    // Close mobile menu when page changes (using location to detect change)
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]); // 🟢 Check pathname instead of currentPage

    // 🟢 NEW/UPDATED: Use navigate for routing
    const handleNavClick = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const unreadCount = aiNotifications.filter(n => n.isNew).length;

    // ❌ REMOVED: renderPage function (replaced by <Routes> block)

    // Helper to determine active link path for sidebar styling
    const getActivePath = (path) => {
        // Special case: / is active for the root path and is the default when path is not found
        if (path === APP_ROUTES.HOME) {
            return location.pathname === APP_ROUTES.HOME;
        }
        return location.pathname.startsWith(`/${path}`);
    };

    return (
        <div className={`flex h-screen font-sans ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-950 overflow-hidden`}>

            {/* 🟢 Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar - Responsive */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col p-4 transition-transform duration-300 ease-in-out
                md:translate-x-0 md:static
                ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between px-4 py-6 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl"><Sparkles size={24} className="text-white" /></div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FinScope</h1>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 space-y-1.5">
                    {/* 🟢 Sidebar items use APP_ROUTES and handleNavClick */}
                    {[
                        { id: 'dashboard', path: APP_ROUTES.HOME, icon: LayoutDashboard, label: 'Overview' },
                        { id: 'wallets', path: APP_ROUTES.WALLETS, icon: Wallet, label: 'Wallets' },
                        { id: 'budgets', path: APP_ROUTES.BUDGETS_GOALS, icon: PiggyBank, label: 'Budgets' },
                        { id: 'advisor', path: APP_ROUTES.AI_ADVISOR, icon: Sparkles, label: 'AI Advisor' },
                        { id: 'analytics', path: APP_ROUTES.ANALYTICS, icon: BarChart3, label: 'Analytics' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all font-medium 
                                ${getActivePath(item.path) ?
                                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <item.icon size={20} className="mr-3" />{item.label}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {/* 🟢 Updated settings button */}
                    <button onClick={() => handleNavClick(APP_ROUTES.SETTINGS)} className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium"><SettingsIcon size={20} className="mr-3" /> Settings</button>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition font-medium"><LogOut size={20} className="mr-3" /> Sign Out</button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium transition mt-2">{isDarkMode ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col w-full h-screen overflow-hidden relative">
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-4 flex justify-between md:justify-end items-center gap-6">

                    {/* 🟢 Mobile Menu Toggle */}
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-600 dark:text-gray-300 hover:text-blue-600 p-1">
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative" ref={notifRef}>
                            {/* Notification Bell UI */}
                            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition relative p-1">
                                <Bell size={22} />
                                {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>}
                            </button>

                            {isNotifOpen && (
                                <div className="absolute right-0 mt-3 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50">
                                    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Alerts ({aiNotifications.length})</h4>
                                        <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-500"><X size={16} /></button>
                                    </div>
                                    <div className="py-2 max-h-[300px] overflow-y-auto">
                                        {aiNotifications.length === 0 ? (
                                            <div className="px-4 py-3 text-center text-gray-500 text-sm">No new alerts.</div>
                                        ) : (
                                            aiNotifications.map((notif) => (
                                                <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition relative">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium pr-6">{notif.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                                                    <button onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }} className="absolute top-3 right-2 text-gray-300 hover:text-red-500 transition" title="Dismiss Alert">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                        <div className="relative" ref={profileRef}>
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition">
                                <div className="text-right hidden sm:block"><p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p></div>
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md"><User size={20} /></div>
                                <ChevronDown size={16} className={`text-gray-400 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isProfileOpen && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 z-50 animate-in fade-in slide-in-from-top-2">
                                {/* 🟢 Updated settings button */}
                                <button onClick={() => { handleNavClick(APP_ROUTES.SETTINGS); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><SettingsIcon size={16} className="mr-2" /> Settings</button>
                                <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div><button onClick={handleLogout} className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition"><LogOut size={16} className="mr-2" /> Sign Out</button></div>)}
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto w-full">
                    {/* 🟢 CRITICAL FIX: Nested Routes replace renderPage() */}
                    <Routes>
                        {/* The index route (matches /) */}
                        <Route index element={<DashboardHome user={user} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />} />

                        {/* The rest match their sub-paths (wallets, budgets, etc.) */}
                        {/* 🚨 Ensure Wallets is imported/defined correctly in your environment, not using the local placeholder */}
                        <Route path={APP_ROUTES.WALLETS} element={<Wallets onAddTransaction={() => setIsTransactionModalOpen(true)} onAddWallet={() => setIsWalletModalOpen(true)} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />} />

                        {/* 🚨 Ensure BudgetGoals is imported/defined correctly */}
                        <Route path={APP_ROUTES.BUDGETS_GOALS} element={<BudgetGoals />} />

                        {/* 🚨 Ensure AIAdvisor is imported/defined correctly */}
                        <Route path={APP_ROUTES.AI_ADVISOR} element={<AIAdvisor />} />

                        {/* 🚨 Ensure Analytics is imported/defined correctly */}
                        <Route path={APP_ROUTES.ANALYTICS} element={<Analytics />} />

                        {/* 🚨 Ensure Settings is imported/defined correctly */}
                        <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />

                        {/* Fallback to home */}
                        <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
                    </Routes>
                </main>
            </div>

            <button onClick={() => setIsTransactionModalOpen(true)} className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 z-30 transition-transform hover:scale-110 active:scale-95" title="Add New Transaction">
                <Plus size={28} />
            </button>
            <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={triggerRefresh} />
            <AddWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onSuccess={triggerRefresh} />
        </div>
    );
}