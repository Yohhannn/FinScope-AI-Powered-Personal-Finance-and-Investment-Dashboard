import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, Sparkles,
    BarChart3, Settings as SettingsIcon, Sun, Moon, Plus, Bell, User,
    ChevronDown, Lightbulb, ArrowRight, ArrowUpRight, ArrowDownRight,
    CreditCard, LogOut, X, Target, Star, Loader2, RotateCw
} from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

// --- Placeholder Components for Runnability ---
// Replace these with your actual imported components in your final project structure.
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);
const ProgressBar = ({ current, total, color = 'blue' }) => {
    const percentage = Math.min((current / total) * 100, 100);
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
            <div className={`h-2 rounded-full bg-${color}-600`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};
const MockModal = ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-lg w-full">
                <h3 className="text-xl font-bold mb-4">Mock Modal</h3>
                <p className="text-gray-500">This is a placeholder modal.</p>
                <button onClick={() => { onSuccess(); onClose(); }} className="mt-4 bg-blue-500 text-white p-2 rounded-lg">Done</button>
                <button onClick={onClose} className="ml-2 mt-4 bg-red-500 text-white p-2 rounded-lg">Close</button>
            </div>
        </div>
    );
};
const AddTransactionModal = MockModal;
const AddWalletModal = MockModal;
const TransactionDetailsModal = MockModal;

// Mock Page Components
const Wallets = () => <div className="text-center py-24 text-gray-500">Wallets Page Content</div>;
const BudgetGoals = () => <div className="text-center py-24 text-gray-500">Budget/Goals Page Content</div>;
const AIAdvisor = () => <div className="text-center py-24 text-gray-500">AI Advisor Page Content</div>;
const Analytics = () => <div className="text-center py-24 text-gray-500">Analytics Page Content</div>;
const Settings = () => <div className="text-center py-24 text-gray-500">Settings Page Content</div>;
// --- End Placeholder Components ---

// Helper function
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// 🟢 DASHBOARD HOME COMPONENT
const DashboardHome = ({ setCurrentPage, user, refreshTrigger, onTriggerRefresh }) => {
    const [data, setData] = useState({ netWorth: 0, netWorthChange: 0, wallets: [], recentTransactions: [], budgets: [], goals: [] });
    const [loading, setLoading] = useState(true);

    // 🟢 AI States: Initialize aiInsight from localStorage for persistence
    const [aiInsight, setAiInsight] = useState(() => localStorage.getItem('aiInsight') || '');
    const [aiLoading, setAiLoading] = useState(false);

    const [selectedTx, setSelectedTx] = useState(null);
    const [isTxModalOpen, setIsTxModalOpen] = useState(false);

    // Function to fetch AI Insight on demand (or initial load)
    const generateInsight = async () => {
        setAiLoading(true);
        setAiInsight(''); // Clear old insight display while loading new one

        if (!BASE_URL) {
            setAiInsight("API Configuration Error: BASE_URL is not set.");
            setAiLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            // ✅ Use BASE_URL here
            const res = await fetch(`${BASE_URL}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    // Simple prompt for the card insight
                    message: "Look at my dashboard data. Give me a 2-sentence summary of my financial health and 1 actionable tip."
                })
            });
            const result = await res.json();

            if (res.ok) {
                // Set state AND persist to localStorage
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

    // 1. Main Dashboard Data Fetching
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
                // ✅ Use BASE_URL here
                const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });

                if (res.ok) {
                    const dashData = await res.json();
                    setData({
                        netWorth: dashData.netWorth,
                        netWorthChange: dashData.netWorthChange || 0,
                        wallets: dashData.wallets,
                        recentTransactions: dashData.recentTransactions,
                        budgets: dashData.budgets.filter(b => b.is_pinned), // Filter pinned budgets
                        goals: dashData.goals.filter(g => g.is_pinned) // Filter pinned goals
                    });
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchDashboard();
    }, [refreshTrigger]); // Data refreshes when a transaction/wallet is added

    // 2. AI Insight Initial Load (Runs only once on mount IF localStorage is empty)
    useEffect(() => {
        // Only run if aiInsight state (loaded from localStorage) is empty
        if (!aiInsight) {
            generateInsight();
        }
    }, []); // Empty dependency array ensures it runs only once

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

                {/* 🟢 Net Worth Card (Dynamic) */}
                <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-100 mb-2">
                            <Sparkles size={18} /> <span>Total Net Worth</span>
                        </div>

                        <h2 className="text-4xl font-bold tracking-tight mb-4">
                            ${Number(data.netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </h2>

                        <div className={`inline-flex items-center px-3 py-1 rounded-full backdrop-blur-sm text-sm font-medium ${
                            parseFloat(data.netWorthChange) >= 0
                                ? 'bg-white/20 text-white'
                                : 'bg-red-500/30 text-white'
                        }`}>
                            {parseFloat(data.netWorthChange) >= 0 ? (
                                <ArrowUpRight size={16} className="mr-1" />
                            ) : (
                                <ArrowDownRight size={16} className="mr-1" />
                            )}
                            {Math.abs(data.netWorthChange)}% this month
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* 🟢 AI Insight Card */}
                <Card className="md:col-span-2 border-l-4 border-l-blue-500 flex flex-col justify-center relative">
                    {/* Manual Refresh Button */}
                    <button
                        onClick={generateInsight}
                        disabled={aiLoading}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition disabled:opacity-50"
                        title="Refresh Insight"
                    >
                        {aiLoading ? <Loader2 size={18} className="animate-spin"/> : <RotateCw size={18}/>}
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400"><Lightbulb size={24} /></div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">AI Financial Insight</h3>
                            {aiLoading ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">Analyzing your latest transactions...</p>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                    {aiInsight || "Click refresh to generate an insight based on your current data."}
                                </p>
                            )}
                            <button onClick={() => setCurrentPage('advisor')} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center group">
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

            <TransactionDetailsModal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} onSuccess={onTriggerRefresh} selectedTx={selectedTx} />
        </div>
    );
};

// 🔵 DASHBOARD MAIN COMPONENT
export default function Dashboard() {
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

    // 🟢 NEW STATE for AI-Generated Notifications
    const [aiNotifications, setAiNotifications] = useState(() => {
        const storedNotifs = localStorage.getItem('aiNotifications');
        return storedNotifs ? JSON.parse(storedNotifs) : [];
    });

    // 🟢 CONSTANT: Define the minimum interval between AI checks (5 minutes)
    const ALERT_CHECK_INTERVAL_MS = 5 * 60 * 1000;

    // 🟢 Function to call AI for Smart Notifications
    const fetchAINotifications = async () => {
        if (!BASE_URL) {
            console.error("Configuration Error: BASE_URL is not set. Skipping AI notification check.");
            return;
        }

        // 1. Check if the time limit has passed
        const lastCheckTime = parseInt(localStorage.getItem('lastAlertCheckTime') || '0', 10);
        const currentTime = Date.now();

        if (currentTime - lastCheckTime < ALERT_CHECK_INTERVAL_MS) {
            console.log("AI alert check skipped: Too soon since last check.");
            return; // Skip if it hasn't been 5 minutes
        }

        try {
            const token = localStorage.getItem("token");
            // ✅ Use BASE_URL here
            const res = await fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } });
            const data = await res.json();

            if (res.ok) {
                // 2. Update the last check time *before* calling the AI
                localStorage.setItem('lastAlertCheckTime', currentTime.toString());

                // --- Prepare Context & Prompt for Deduplication ---
                const lastAIAlertMessage = localStorage.getItem('lastAIAlertMessage') || '';

                // Format critical data points for AI analysis
                const context = {
                    latestTransaction: data.recentTransactions[0],
                    budgets: data.budgets.map(b => ({ name: b.category_name, spent: parseFloat(b.spent), limit: parseFloat(b.limit_amount) })),
                    goals: data.goals.map(g => ({ name: g.name, current: parseFloat(g.current_amount), target: parseFloat(g.target_amount) })),
                    netWorth: data.netWorth
                };

                // 🟢 UPDATED MESSAGE for deduplication
                const message = `Analyze the following real-time financial data. Identify only ONE critical or actionable alert for the user. Compare the new alert against the LAST ALERT MESSAGE: "${lastAIAlertMessage}".
                If the current critical condition is the SAME as the last alert, respond ONLY with the exact text "NO_CHANGE".
                Otherwise, respond ONLY with the NEW alert text, prefixed by an emoji (e.g., ⚠️, 💡, 📈). Do not provide any other dialogue. Data: ${JSON.stringify(context)}`;

                // ✅ Use BASE_URL here
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

                        // 🟢 Update last AI Alert message storage
                        localStorage.setItem('lastAIAlertMessage', newAlertText);

                        // Add the new notification to the existing list (keeping maximum 5)
                        setAiNotifications(prev => {
                            const updated = [newNotification, ...prev].slice(0, 5);
                            localStorage.setItem('aiNotifications', JSON.stringify(updated));
                            return updated;
                        });
                    } else {
                        console.log("AI alert check skipped: No change in critical financial status.");
                    }
                }
            }
        } catch (e) {
            console.error("AI Notification Error:", e);
            // Optionally reset the last check time if the API call failed (to try again sooner)
            localStorage.setItem('lastAlertCheckTime', '0');
        }
    };

    // 🟢 EFFECT 1: Trigger AI notification check only when refreshTrigger changes
    useEffect(() => {
        fetchAINotifications();
    }, [refreshTrigger]);

    // 🟢 Helper to clear AI notifications
    const clearNotification = (id) => {
        setAiNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            localStorage.setItem('aiNotifications', JSON.stringify(updated));
            return updated;
        });
    };

    // Standard useEffects
    useEffect(() => { localStorage.setItem("lastPage", currentPage); }, [currentPage]);
    useEffect(() => { const storedUser = localStorage.getItem("user"); if (storedUser) { try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); } } }, []);
    const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem("theme"); return saved ? JSON.parse(saved) : true; });
    useEffect(() => { const root = window.document.documentElement; if (isDarkMode) { root.classList.add('dark'); localStorage.setItem("theme", "true"); } else { root.classList.remove('dark'); localStorage.setItem("theme", "false"); } }, [isDarkMode]);
    useEffect(() => { const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false); if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []);

    // 🟢 UPDATED handleLogout to clear new storage item
    const handleLogout = () => { localStorage.clear(); localStorage.removeItem('aiInsight'); localStorage.removeItem('aiNotifications'); localStorage.removeItem('lastAlertCheckTime'); localStorage.removeItem('lastAIAlertMessage'); navigate("/login"); };

    const unreadCount = aiNotifications.filter(n => n.isNew).length;

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
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col p-4 fixed z-20">
                <div className="flex items-center gap-3 px-4 py-6 mb-2"><div className="p-2 bg-blue-600 rounded-xl"><Sparkles size={24} className="text-white" /></div><h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">FinScope</h1></div>
                <nav className="flex-1 space-y-1.5">{[{ id: 'dashboard', icon: LayoutDashboard, label: 'Overview' }, { id: 'wallets', icon: Wallet, label: 'Wallets' }, { id: 'budgets', icon: PiggyBank, label: 'Budgets' }, { id: 'advisor', icon: Sparkles, label: 'AI Advisor' }, { id: 'analytics', icon: BarChart3, label: 'Analytics' }].map(item => (<button key={item.id} onClick={() => setCurrentPage(item.id)} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all font-medium ${currentPage === item.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}><item.icon size={20} className="mr-3" />{item.label}</button>))}</nav>
                <div className="mt-auto space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4"><button onClick={() => setCurrentPage('settings')} className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium"><SettingsIcon size={20} className="mr-3" /> Settings</button><button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition font-medium"><LogOut size={20} className="mr-3" /> Sign Out</button><button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium transition mt-2">{isDarkMode ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}</button></div>
            </div>
            <div className="flex-1 flex flex-col ml-64 h-screen overflow-y-auto">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-8 py-4 flex justify-end items-center gap-6">
                    <div className="relative" ref={notifRef}>
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition relative p-1">
                            <Bell size={22} />
                            {/* 🟢 Display unread count bubble */}
                            {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>}
                        </button>

                        {/* 🟢 AI Notification Popover */}
                        {isNotifOpen && (
                            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50">
                                <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">AI Alerts ({aiNotifications.length})</h4>
                                    <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-500"><X size={16}/></button>
                                </div>
                                <div className="py-2">
                                    {aiNotifications.length === 0 ? (
                                        <div className="px-4 py-3 text-center text-gray-500 text-sm">No new alerts.</div>
                                    ) : (
                                        // Map through AI notifications
                                        aiNotifications.map((notif) => (
                                            <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded-lg transition relative">
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{notif.message}</p>
                                                <p className="text-xs text-gray-500 mt-1">{notif.timestamp}</p>
                                                {/* Button to clear individual notification */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                                                    className="absolute top-1 right-2 text-gray-300 hover:text-red-500 transition"
                                                    title="Dismiss Alert"
                                                >
                                                    <X size={12}/>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
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