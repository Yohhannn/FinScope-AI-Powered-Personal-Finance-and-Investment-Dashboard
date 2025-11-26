import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AddBudgetModal({ isOpen, onClose, onSuccess }) {
    const [categories, setCategories] = useState([]);
    const [form, setForm] = useState({ category_id: '', limit_amount: '', start_date: '', end_date: '' });

    // 🟢 FETCH CATEGORIES WHEN MODAL OPENS
    useEffect(() => {
        if (isOpen) {
            const fetchCats = async () => {
                try {
                    const token = localStorage.getItem("token");
                    const res = await fetch("http://localhost:5000/api/dashboard/categories", {
                        headers: { Authorization: token }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setCategories(data);
                        // Set default selection to first category
                        if(data.length > 0) setForm(f => ({ ...f, category_id: data[0].category_id }));
                    }
                } catch(e) { console.error(e); }
            };
            fetchCats();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/budget", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({
                    category_id: parseInt(form.category_id),
                    limit_amount: parseFloat(form.limit_amount),
                    start_date: form.start_date,
                    end_date: form.end_date
                })
            });

            if (res.ok) {
                alert("Budget Added!");
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert("Failed to add budget");
            }
        } catch (e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Budget</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            onChange={e => setForm({...form, category_id: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white border border-transparent focus:border-blue-500"
                        >
                            {categories.length === 0 && <option>No Categories Found</option>}
                            {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Limit Amount</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            onChange={e => setForm({...form, limit_amount: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs dark:text-gray-400">Start Date</label>
                            <input type="date" onChange={e => setForm({...form, start_date: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required />
                        </div>
                        <div>
                            <label className="text-xs dark:text-gray-400">End Date</label>
                            <input type="date" onChange={e => setForm({...form, end_date: e.target.value})} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white" required />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition">Create Budget</button>
                </form>
            </div>
        </div>
    );
}