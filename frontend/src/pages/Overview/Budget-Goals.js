import React from 'react';
import { Plus, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, SectionHeader, ProgressBar } from '../../components/DashboardUI';

const mockBudgets = [
    { id: 1, name: 'Food & Dining', spent: 450, total: 800, color: 'blue' },
    { id: 2, name: 'Transportation', spent: 150, total: 300, color: 'green' },
    { id: 3, name: 'Entertainment', spent: 200, total: 250, color: 'purple' },
];

const mockGoals = [
    { id: 1, name: 'Hawaii Vacation', saved: 3200, total: 5000, prediction: 'You\'ll reach this in 6 months at your current rate.' },
    { id: 2, name: 'New Laptop', saved: 800, total: 1500, prediction: 'AI suggests adding $50/week to hit this in 2 months.' },
];

export default function BudgetGoals() {
    return (
        <div>
            <SectionHeader title="Budgets & Goals" />

            {/* Budgets Section */}
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Monthly Budgets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {mockBudgets.map(budget => (
                    <Card key={budget.id}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{budget.name}</span>
                            <span className={`text-sm font-medium ${budget.spent > budget.total ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {budget.spent > budget.total && <AlertTriangle size={14} className="inline mr-1" />}
                                ${budget.total - budget.spent} {budget.spent > budget.total ? 'over' : 'left'}
              </span>
                        </div>
                        <ProgressBar current={budget.spent} total={budget.total} color={budget.color} />
                    </Card>
                ))}

                {/* Add Budget Button */}
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl min-h-[120px] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <Plus size={24} className="mr-2" /> Add New Budget
                </div>
            </div>

            {/* Goals Section */}
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Savings Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockGoals.map(goal => (
                    <Card key={goal.id}>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{goal.name}</div>
                        <ProgressBar current={goal.saved} total={goal.total} color="green" />
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-start">
                            <Lightbulb size={20} className="text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" />
                            <p className="text-sm text-blue-800 dark:text-blue-200">{goal.prediction}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}