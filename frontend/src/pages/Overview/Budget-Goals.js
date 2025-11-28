import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Tags, Pencil, Star, TrendingUp, Target,
    CreditCard, Wallet, Banknote, Coins, ArrowUpRight
} from 'lucide-react';
import { Card, SectionHeader, ProgressBar } from '../../components/DashboardUI';
import BudgetModal from '../../components/BudgetModal';
import GoalModal from '../../components/GoalModal';
import ManageCategoriesModal from '../../components/ManageCategoriesModal';
import ContributeGoalModal from '../../components/ContributeGoalModal';
import GoalHistoryModal from '../../components/GoalHistoryModal';
import BudgetHistoryModal from '../../components/BudgetHistoryModal'; // 🟢 NEW IMPORT

// Helper for Wallet Styles
const getWalletStyle = (type) => {
    const t = type?.toLowerCase();
    if (t === 'crypto') return { icon: Coins, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    if (t === 'bank') return { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (t === 'stocks') return { icon: ArrowUpRight, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' };
    return { icon: Banknote, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
};

export default function BudgetGoals({ setCurrentPage }) {
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [contributeModalOpen, setContributeModalOpen] = useState(false);
    const [goalHistoryOpen, setGoalHistoryOpen] = useState(false);
    const [budgetHistoryOpen, setBudgetHistoryOpen] = useState(false); // 🟢 NEW

    // Selected Items
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributeGoal, setContributeGoal] = useState(null);
    const [historyGoal, setHistoryGoal] = useState(null);
    const [historyBudget, setHistoryBudget] = useState(null); // 🟢 NEW

    // 🟢 Main Fetch Function
    const fetchAllData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            const [budgetRes, dashRes] = await Promise.all([
                fetch("http://localhost:5000/api/dashboard/budgets", { headers: { Authorization: token } }),
                fetch("http://localhost:5000/api/dashboard", { headers: { Authorization: token } })
            ]);

            const budgetData = await budgetRes.json();
            const dashData = await dashRes.json();

            if (budgetRes.ok) {
                setBudgets(budgetData.budgets);
                setGoals(budgetData.goals);
            }

            if (dashRes.ok) {
                setWallets(dashData.wallets);
            }

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const togglePin = async (type, id, currentStatus) => {
        const url = type === 'budget'
            ? `http://localhost:5000/api/dashboard/budget/${id}/pin`
            : `http://localhost:5000/api/dashboard/goal/${id}/pin`;

        const setState = type === 'budget' ? setBudgets : setGoals;
        const idKey = type === 'budget' ? 'budget_id' : 'goal_id';

        setState(prev => prev.map(item => item[idKey] === id ? { ...item, is_pinned: !currentStatus } : item));

        await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
            body: JSON.stringify({ is_pinned: !currentStatus })
        });
    };

    const openEditBudget = (b) => { setSelectedBudget(b); setBudgetModalOpen(true); };
    const openEditGoal = (g) => { setSelectedGoal(g); setGoalModalOpen(true); };
    const openNewBudget = () => { setSelectedBudget(null); setBudgetModalOpen(true); };
    const openNewGoal = () => { setSelectedGoal(null); setGoalModalOpen(true); };

    const openContribute = (goal) => {
        setContributeGoal(goal);
        setContributeModalOpen(true);
    };

    const openGoalHistory = (goal) => {
        setHistoryGoal(goal);
        setGoalHistoryOpen(true);
    };

    // 🟢 NEW: Handler for Budget History
    const openBudgetHistory = (budget) => {
        setHistoryBudget(budget);
        setBudgetHistoryOpen(true);
    };

    if (loading) return <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">Loading data...</div>;

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Plan & Save</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your monthly spending limits and savings targets.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => setCategoryModalOpen(true)} className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"><Tags size={18} className="mr-2"/> Categories</button>
                    <button onClick={openNewBudget} className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md"><Plus size={18} className="mr-2"/> Budget</button>
                    <button onClick={openNewGoal} className="flex items-center justify-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition shadow-md"><Plus size={18} className="mr-2"/> Goal</button>
                </div>
            </div>

            {/* WALLETS SECTION */}
            <section>
                <div className="flex justify-between items-end mb-5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400"><Wallet size={20} /></div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Available Funds</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Real-time balance</p>
                        </div>
                    </div>
                    {setCurrentPage && (
                        <button onClick={() => setCurrentPage('wallets')} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">Manage All</button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {wallets.slice(0, 4).map(wallet => {
                        const style = getWalletStyle(wallet.type);
                        return (
                            <div key={wallet.wallet_id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3.5 rounded-xl ${style.bg} ${style.color}`}>
                                        <style.icon size={24} />
                                    </div>
                                    {wallet.purpose && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg">{wallet.purpose}</span>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 capitalize">{wallet.type}</p>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{wallet.name}</h3>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${Number(wallet.available_balance ?? wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-gray-400 mt-1">of ${Number(wallet.balance).toLocaleString()} Total</p>
                                </div>
                            </div>
                        );
                    })}
                    {wallets.length === 0 && <p className="text-gray-500 col-span-full py-4 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No wallets found.</p>}
                </div>
            </section>

            {/* 🟢 BUDGETS SECTION WITH CLICKABLE HISTORY */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><TrendingUp size={20} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Budgets</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgets.map(budget => {
                        const spent = parseFloat(budget.spent) || 0;
                        const limit = parseFloat(budget.limit_amount);
                        const isOver = spent > limit;
                        const percentage = Math.min((spent / limit) * 100, 100);

                        return (
                            <div
                                key={budget.budget_id}
                                onClick={() => openBudgetHistory(budget)} // 🟢 CLICK TO OPEN HISTORY
                                className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200 cursor-pointer hover:border-blue-200 dark:hover:border-blue-800"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => togglePin('budget', budget.budget_id, budget.is_pinned)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${budget.is_pinned ? 'text-yellow-500' : 'text-gray-400'}`} title="Pin to Dashboard"><Star size={16} fill={budget.is_pinned ? "currentColor" : "none"} /></button>
                                    <button onClick={() => openEditBudget(budget)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16}/></button>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{budget.category_name}</h4>
                                        {budget.is_pinned && <Star size={14} className="text-yellow-500 absolute top-6 right-16 sm:right-20" fill="currentColor" />}
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${spent.toLocaleString()}<span className="text-base font-medium text-gray-400 dark:text-gray-500"> / ${limit.toLocaleString()}</span></p>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                                    <div className={`h-3 rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-blue-600'}`} style={{ width: `${percentage}%` }}></div>
                                </div>
                                <div className="flex justify-between items-center text-xs font-medium">
                                    <span className={`${isOver ? 'text-red-500' : 'text-green-500'}`}>{isOver ? `Over by $${(spent - limit).toLocaleString()}` : `$${(limit - spent).toLocaleString()} remaining`}</span>
                                    <span className="text-gray-400">{(percentage).toFixed(0)}%</span>
                                </div>
                            </div>
                        );
                    })}
                    {budgets.length === 0 && <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50"><div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"><TrendingUp className="text-gray-400" size={32} /></div><p className="text-gray-500 dark:text-gray-400 font-medium">No budgets created yet.</p><button onClick={openNewBudget} className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">Create a Budget</button></div>}
                </div>
            </section>

            {/* GOALS SECTION */}
            <section>
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Target size={20} /></div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Savings Goals</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.map(goal => {
                        const current = parseFloat(goal.current_amount);
                        const target = parseFloat(goal.target_amount);
                        const percentage = Math.min((current / target) * 100, 100);

                        return (
                            <div
                                key={goal.goal_id}
                                onClick={() => openGoalHistory(goal)}
                                className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200 cursor-pointer hover:border-blue-200 dark:hover:border-blue-800"
                            >
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => togglePin('goal', goal.goal_id, goal.is_pinned)} className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${goal.is_pinned ? 'text-yellow-500' : 'text-gray-400'}`}><Star size={16} fill={goal.is_pinned ? "currentColor" : "none"} /></button>
                                    <button onClick={() => openEditGoal(goal)} className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={16}/></button>
                                </div>
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{goal.name}</h4>
                                        {goal.is_pinned && <Star size={14} className="text-yellow-500 absolute top-6 right-16 sm:right-20" fill="currentColor" />}
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">${current.toLocaleString()}<span className="text-base font-medium text-gray-400 dark:text-gray-500"> / ${target.toLocaleString()}</span></p>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                                    <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-700/50">
                                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400"><span className="text-green-600 dark:text-green-400 mr-1">{(percentage).toFixed(0)}%</span> Achieved</div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openContribute(goal); }}
                                        className="flex items-center text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <Plus size={14} className="mr-1"/> Modify Funds
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {goals.length === 0 && <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50"><div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"><Target className="text-gray-400" size={32} /></div><p className="text-gray-500 dark:text-gray-400 font-medium">No savings goals yet.</p><button onClick={openNewGoal} className="mt-2 text-green-600 dark:text-green-400 hover:underline text-sm">Create a Goal</button></div>}
                </div>
            </section>

            {/* Modals */}
            <BudgetModal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} onSuccess={fetchAllData} budget={selectedBudget} />
            <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} onSuccess={fetchAllData} goal={selectedGoal} />
            <ManageCategoriesModal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />

            <ContributeGoalModal
                isOpen={contributeModalOpen}
                onClose={() => setContributeModalOpen(false)}
                goal={contributeGoal}
                onSuccess={fetchAllData}
            />

            <GoalHistoryModal
                isOpen={goalHistoryOpen}
                onClose={() => setGoalHistoryOpen(false)}
                goal={historyGoal}
                onRefresh={fetchAllData}
            />

            {/* 🟢 NEW Budget History Modal */}
            <BudgetHistoryModal
                isOpen={budgetHistoryOpen}
                onClose={() => setBudgetHistoryOpen(false)}
                budget={historyBudget}
            />
        </div>
    );
}