import React, { useState, useEffect, useCallback } from 'react';
import { Plus, AlertTriangle, Lightbulb, Tags, Pencil } from 'lucide-react';
import { Card, SectionHeader, ProgressBar } from '../../components/DashboardUI';
import BudgetModal from '../../components/BudgetModal'; // Renamed
import GoalModal from '../../components/GoalModal'; // Renamed
import ManageCategoriesModal from '../../components/ManageCategoriesModal';

export default function BudgetGoals() {
    const [budgets, setBudgets] = useState([]);
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [budgetModalOpen, setBudgetModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    // Selected Items for Editing
    const [selectedBudget, setSelectedBudget] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/budgets", { headers: { Authorization: token } });
            const data = await res.json();
            if (res.ok) { setBudgets(data.budgets); setGoals(data.goals); }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const openEditBudget = (b) => { setSelectedBudget(b); setBudgetModalOpen(true); };
    const openEditGoal = (g) => { setSelectedGoal(g); setGoalModalOpen(true); };
    const openNewBudget = () => { setSelectedBudget(null); setBudgetModalOpen(true); };
    const openNewGoal = () => { setSelectedGoal(null); setGoalModalOpen(true); };

    if (loading) return <div className="text-center dark:text-white p-10">Loading...</div>;

    return (
        <div>
            <SectionHeader title="Budgets & Goals" />

            <div className="flex flex-wrap gap-4 mb-8">
                <button onClick={openNewBudget} className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"><Plus size={18} className="mr-2"/> New Budget</button>
                <button onClick={openNewGoal} className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md"><Plus size={18} className="mr-2"/> New Goal</button>
                <button onClick={() => setCategoryModalOpen(true)} className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md"><Tags size={18} className="mr-2"/> Manage Categories</button>
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Budgets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {budgets.map(budget => {
                    const spent = parseFloat(budget.spent) || 0;
                    const limit = parseFloat(budget.limit_amount);
                    const isOver = spent > limit;
                    return (
                        <Card key={budget.budget_id} className="relative group">
                            <button onClick={() => openEditBudget(budget)} className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition"><Pencil size={16}/></button>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">{budget.category_name}</span>
                                <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isOver && <AlertTriangle size={14} className="inline mr-1" />}
                                    ${Math.abs(limit - spent).toLocaleString()} {isOver ? 'over' : 'left'}
                  </span>
                            </div>
                            <ProgressBar current={spent} total={limit} color={isOver ? 'red' : 'blue'} />
                        </Card>
                    );
                })}
                {budgets.length === 0 && <div className="col-span-full text-center py-4 text-gray-500 italic">No budgets found.</div>}
            </div>

            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Savings Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goals.map(goal => (
                    <Card key={goal.goal_id} className="relative group">
                        <button onClick={() => openEditGoal(goal)} className="absolute top-4 right-4 text-gray-400 hover:text-green-500 opacity-0 group-hover:opacity-100 transition"><Pencil size={16}/></button>
                        <div className="flex justify-between items-end mb-2">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">{goal.name}</div>
                            <div className="text-xs text-gray-500">Target: ${parseFloat(goal.target_amount).toLocaleString()}</div>
                        </div>
                        <ProgressBar current={parseFloat(goal.current_amount)} total={parseFloat(goal.target_amount)} color="green" />
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-start"><Lightbulb size={20} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" /><p className="text-sm text-blue-800 dark:text-blue-200">Keep going!</p></div>
                    </Card>
                ))}
                {goals.length === 0 && <div className="col-span-full text-center py-4 text-gray-500 italic">No goals found.</div>}
            </div>

            <BudgetModal isOpen={budgetModalOpen} onClose={() => setBudgetModalOpen(false)} onSuccess={fetchData} budget={selectedBudget} />
            <GoalModal isOpen={goalModalOpen} onClose={() => setGoalModalOpen(false)} onSuccess={fetchData} goal={selectedGoal} />
            <ManageCategoriesModal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} />
        </div>
    );
}