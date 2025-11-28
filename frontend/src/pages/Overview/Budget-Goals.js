import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Lightbulb, Tags, Pencil, Star, TrendingUp, Target } from 'lucide-react';
import { Card, SectionHeader, ProgressBar } from '../../components/DashboardUI';
import BudgetModal from '../../components/BudgetModal';
import GoalModal from '../../components/GoalModal';
import ManageCategoriesModal from '../../components/ManageCategoriesModal';
import ContributeGoalModal from '../../components/ContributeGoalModal'; // 🟢 Import

export default function BudgetGoals() {
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [contributeModalOpen, setContributeModalOpen] = useState(false); // 🟢 New

    // Editing & Contribution States
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributeGoal, setContributeGoal] = useState(null); // 🟢 New

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/budgets", { headers: { Authorization: token } });
            const data = await res.json();
            if (res.ok) {
                setBudgets(data.budgets);
                setGoals(data.goals);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const togglePin = async (type, id, currentStatus) => {
        if (type === 'budget') {
            setBudgets(prev => prev.map(b => b.budget_id === id ? { ...b, is_pinned: !currentStatus } : b));
            await fetch(`http://localhost:5000/api/dashboard/budget/${id}/pin`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ is_pinned: !currentStatus })
            });
        } else {
            setGoals(prev => prev.map(g => g.goal_id === id ? { ...g, is_pinned: !currentStatus } : g));
            await fetch(`http://localhost:5000/api/dashboard/goal/${id}/pin`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': localStorage.getItem('token') },
                body: JSON.stringify({ is_pinned: !currentStatus })
            });
        }
    };

    const openEditBudget = (b) => { setSelectedBudget(b); setBudgetModalOpen(true); };
    const openEditGoal = (g) => { setSelectedGoal(g); setGoalModalOpen(true); };
    const openNewBudget = () => { setSelectedBudget(null); setBudgetModalOpen(true); };
    const openNewGoal = () => { setSelectedGoal(null); setGoalModalOpen(true); };

    // 🟢 Handler for Contribution
    const openContribute = (goal) => {
        setContributeGoal(goal);
        setContributeModalOpen(true);
    };

    if (loading) return <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">Loading data...</div>;

    return (
        <div className="space-y-10 max-w-7xl mx-auto">

            {/* 1. Header & Actions */}
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

            {/* 2. BUDGETS SECTION */}
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
                            <div key={budget.budget_id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200">
                                {/* Actions */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

                    {budgets.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"><TrendingUp className="text-gray-400" size={32} /></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No budgets created yet.</p>
                            <button onClick={openNewBudget} className="mt-2 text-blue-600 dark:text-blue-400 hover:underline text-sm">Create a Budget</button>
                        </div>
                    )}
                </div>
            </section>

            {/* 3. GOALS SECTION */}
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
                            <div key={goal.goal_id} className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition duration-200">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <div className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                        <span className="text-green-600 dark:text-green-400 mr-1">{(percentage).toFixed(0)}%</span> Achieved
                                    </div>
                                    {/* 🟢 ADD FUNDS BUTTON */}
                                    <button
                                        onClick={() => openContribute(goal)}
                                        className="flex items-center text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <Plus size={14} className="mr-1"/> Add Funds
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {goals.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3"><Target className="text-gray-400" size={32} /></div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No savings goals yet.</p>
                            <button onClick={openNewGoal} className="mt-2 text-green-600 dark:text-green-400 hover:underline text-sm">Create a Goal</button>
                        </div>
                    )}
                </div>
            </section>

            {/* Modals */}
            <BudgetModal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} onSuccess={fetchData} budget={selectedBudget} />
            <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} onSuccess={fetchData} goal={selectedGoal} />
            <ManageCategoriesModal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />

            {/* 🟢 Contribute Modal */}
            <ContributeGoalModal
                isOpen={contributeModalOpen}
                onClose={() => setContributeModalOpen(false)}
                goal={contributeGoal}
                onSuccess={fetchData}
            />
        </div>
    );
}