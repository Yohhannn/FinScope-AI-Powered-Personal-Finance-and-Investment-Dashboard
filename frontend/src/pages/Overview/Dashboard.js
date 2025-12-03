import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, PiggyBank, Sparkles,
    BarChart3, Settings as SettingsIcon, Sun, Moon, Plus, Bell, User,
    ChevronDown, Lightbulb, ArrowRight, ArrowUpRight, ArrowDownRight,
    CreditCard, LogOut, X, RotateCw, Menu
} from 'lucide-react';

// 🟢 CRITICAL IMPORTS: Import the modals to fix the "not defined" error
import AddTransactionModal from '../../components/AddTransactionModal';
import AddWalletModal from '../../components/AddWalletModal';

// 🟢 Import Sub-pages
import Wallets from './Wallets';
import BudgetGoals from './Budget-Goals';
import AIAdvisor from './AIAdvisor';
import Analytics from './Analytics';
import Settings from './Settings';

// 🟢 Define BASE_URL
const BASE_URL = process.env.REACT_APP_API_URL;

const APP_ROUTES = {
    HOME: '/',
    WALLETS: '/wallets',
    BUDGETS_GOALS: '/budgets',
    AI_ADVISOR: '/advisor',
    ANALYTICS: '/analytics',
    SETTINGS: '/settings',
};

// UI Components
const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

// Helper
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
};

// --- HOME COMPONENT ---
const DashboardHome = ({ user, refreshTrigger, onTriggerRefresh, navigate }) => {
    const [data, setData] = useState({ netWorth: 0, netWorthChange: 0, wallets: [], recentTransactions: [], budgets: [], goals: [] });
    const [loading, setLoading] = useState(true);
    const [aiInsight, setAiInsight] = useState(() => localStorage.getItem('aiInsight') || '');
    const [aiLoading, setAiLoading] = useState(false);

    const generateInsight = async () => {
        setAiLoading(true);
        setAiInsight('');
        if (!BASE_URL) return setAiLoading(false);

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
        } catch (e) { console.error("AI Error:", e); }
        finally { setAiLoading(false); }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            if (!BASE_URL) return setLoading(false);
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
                }
            } catch (error) { console.error("Fetch Error:", error); }
            finally { setLoading(false); }
        };
        fetchDashboard();
    }, [refreshTrigger]);

    useEffect(() => { if (!aiInsight) generateInsight(); }, []);

    if (loading) return <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400">Loading your finances...</div>;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {user?.name || 'User'}</h1><p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Here's what's happening with your money today.</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-blue-100 mb-2"><Sparkles size={18} /> <span>Total Net Worth</span></div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">₱{Number(data.netWorth).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full backdrop-blur-sm text-sm font-medium ${parseFloat(data.netWorthChange) >= 0 ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'}`}>
                            {parseFloat(data.netWorthChange) >= 0 ? (<ArrowUpRight size={16} className="mr-1" />) : (<ArrowDownRight size={16} className="mr-1" />)}
                            {Math.abs(data.netWorthChange)}% this month
                        </div>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <Card className="md:col-span-2 border-l-4 border-l-blue-500 flex flex-col justify-center relative">
                    <button onClick={generateInsight} disabled={aiLoading} className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 transition disabled:opacity-50"><RotateCw size={18} /></button>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0"><Lightbulb size={24} /></div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">AI Financial Insight</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{aiLoading ? "Analyzing..." : (aiInsight || "Click refresh for insights.")}</p>
                            <button onClick={() => navigate(APP_ROUTES.AI_ADVISOR)} className="mt-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center group">Ask AI Advisor <ArrowRight size={16} className="ml-1" /></button>
                        </div>
                    </div>
                </Card>
            </div>
            {/* ... Rest of Dashboard Grid (Transactions/Wallets) ... */}
        </div>
    );
};

// --- MAIN LAYOUT ---
export default function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState({ name: 'User' });
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(() => { const saved = localStorage.getItem("theme"); return saved ? JSON.parse(saved) : true; });
    const [aiNotifications, setAiNotifications] = useState([]);

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    // Handle Auth & AI Notifications (Shortened for brevity - reuse your existing logic here)
    // ...

    const handleLogout = () => { localStorage.clear(); navigate("/login"); };
    const handleNavClick = (path) => { navigate(path); setIsMobileMenuOpen(false); };
    const getActivePath = (path) => path === APP_ROUTES.HOME ? location.pathname === APP_ROUTES.HOME : location.pathname.startsWith(`/${path}`);

    return (
        <div className={`flex h-screen font-sans ${isDarkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-950 overflow-hidden`}>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full flex flex-col p-4 transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between px-4 py-6 mb-2">
                    <div className="flex items-center gap-3"><div className="p-2 bg-blue-600 rounded-xl"><Sparkles size={24} className="text-white" /></div><h1 className="text-xl font-bold text-gray-900 dark:text-white">FinScope</h1></div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500"><X size={24} /></button>
                </div>
                <nav className="flex-1 space-y-1.5">
                    {[
                        { id: 'dashboard', path: APP_ROUTES.HOME, icon: LayoutDashboard, label: 'Overview' },
                        { id: 'wallets', path: APP_ROUTES.WALLETS, icon: Wallet, label: 'Wallets' },
                        { id: 'budgets', path: APP_ROUTES.BUDGETS_GOALS, icon: PiggyBank, label: 'Budgets' },
                        { id: 'advisor', path: APP_ROUTES.AI_ADVISOR, icon: Sparkles, label: 'AI Advisor' },
                        { id: 'analytics', path: APP_ROUTES.ANALYTICS, icon: BarChart3, label: 'Analytics' }
                    ].map(item => (
                        <button key={item.id} onClick={() => handleNavClick(item.path)} className={`flex items-center w-full px-4 py-3 rounded-xl transition-all font-medium ${getActivePath(item.path) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <item.icon size={20} className="mr-3" />{item.label}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <button onClick={() => handleNavClick(APP_ROUTES.SETTINGS)} className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"><SettingsIcon size={20} className="mr-3" /> Settings</button>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-medium"><LogOut size={20} className="mr-3" /> Sign Out</button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center justify-center w-full py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium mt-2">{isDarkMode ? <Sun size={18} className="mr-2" /> : <Moon size={18} className="mr-2" />} Mode</button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col w-full h-screen overflow-hidden relative">
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-4 flex justify-between md:justify-end items-center gap-6">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-gray-600 dark:text-gray-300"><Menu size={24} /></button>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative text-gray-500 dark:text-gray-400"><Bell size={22} /></button>
                        <div className="relative">
                            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-xl transition">
                                <div className="text-right hidden sm:block"><p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p></div>
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><User size={20} /></div>
                                <ChevronDown size={16} />
                            </button>
                            {isProfileOpen && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-1 z-50">
                                <button onClick={() => { handleNavClick(APP_ROUTES.SETTINGS); setIsProfileOpen(false); }} className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><SettingsIcon size={16} className="mr-2" /> Settings</button>
                                <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={16} className="mr-2" /> Sign Out</button>
                            </div>)}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 pb-24 overflow-y-auto w-full">
                    <Routes>
                        <Route index element={<DashboardHome user={user} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} navigate={navigate} />} />
                        <Route path={APP_ROUTES.WALLETS} element={<Wallets onAddTransaction={() => setIsTransactionModalOpen(true)} onAddWallet={() => setIsWalletModalOpen(true)} refreshTrigger={refreshTrigger} onTriggerRefresh={triggerRefresh} />} />
                        <Route path={APP_ROUTES.BUDGETS_GOALS} element={<BudgetGoals />} />
                        <Route path={APP_ROUTES.AI_ADVISOR} element={<AIAdvisor />} />
                        <Route path={APP_ROUTES.ANALYTICS} element={<Analytics />} />
                        <Route path={APP_ROUTES.SETTINGS} element={<Settings />} />
                        <Route path="*" element={<Navigate to={APP_ROUTES.HOME} replace />} />
                    </Routes>
                </main>
            </div>

            <button onClick={() => setIsTransactionModalOpen(true)} className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl shadow-blue-600/30 z-30 transition-transform hover:scale-110 active:scale-95"><Plus size={28} /></button>

            {/* 🟢 MODALS ARE NOW IMPORTED AND RENDERED */}
            <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={triggerRefresh} />
            <AddWalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} onSuccess={triggerRefresh} />
        </div>
    );
}