import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

export default function BudgetModal({ isOpen, onClose, onSuccess, budget = null }) {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ category_id: '', limit_amount: '', start_date: '', end_date: '' });

    useEffect(() => {
        if (isOpen) {
            // Load Categories
            const fetchCats = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch("http://localhost:5000/api/dashboard/categories", { headers: { Authorization: token } });
                    if (res.ok) {
                        const data = await res.json();
                        setCategories(data);
                        if(!budget && data.length > 0) setForm(f => ({ ...f, category_id: data[0].category_id }));
                    }
                } catch(e) { console.error(e); }
            };
            fetchCats();

            // Pre-fill if editing
            if (budget) {
                setForm({
                    category_id: budget.category_id,
                    limit_amount: budget.limit_amount,
                    start_date: new Date(budget.start_date).toISOString().split('T')[0],
                    end_date: new Date(budget.end_date).toISOString().split('T')[0],
                });
            } else {
                // Reset if adding
                setForm({ category_id: '', limit_amount: '', start_date: '', end_date: '' });
            }
        }
    }, [isOpen, budget]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const url = budget
            ? `http://localhost:5000/api/dashboard/budget/${budget.budget_id}`
            : "http://localhost:5000/api/dashboard/budget";
        const method = budget ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });
            if (res.ok) { onSuccess(); onClose(); }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async () => {
        if(!window.confirm("Delete this budget?")) return;
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/dashboard/budget/${budget.budget_id}`, { method: "DELETE", headers: { Authorization: token } });
        onSuccess(); onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{budget ? 'Edit Budget' : 'Create Budget'}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            disabled={!!budget} // Cannot change category once set, usually better for data integrity
                            value={form.category_id}
                            onChange={e => setForm({...form, category_id: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-transparent"
                        >
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Limit Amount</label>
                        <input type="number" value={form.limit_amount} onChange={e => setForm({...form, limit_amount: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-xs dark:text-gray-400">Start</label><input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required /></div>
                        <div><label className="text-xs dark:text-gray-400">End</label><input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required /></div>
                    </div>

                    <div className="flex gap-2">
                        {budget && <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"><Trash2 size={18}/></button>}
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-medium">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
}