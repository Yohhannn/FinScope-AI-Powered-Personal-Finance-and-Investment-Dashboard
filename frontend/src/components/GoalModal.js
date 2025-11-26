import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function GoalModal({ isOpen, onClose, onSuccess }) {
    const [form, setForm] = useState({ name: '', target_amount: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/goal", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify(form)
            });

            if (res.ok) {
                alert("Goal Created!");
                onSuccess(); // 🟢 Refresh parent data
                onClose();
            } else {
                alert("Failed to create goal");
            }
        } catch (e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Saving Goal</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Goal Name</label>
                        <input
                            type="text"
                            placeholder="e.g. New Laptop"
                            onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Target Amount</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            onChange={e => setForm({...form, target_amount: e.target.value})}
                            className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-medium transition">Create Goal</button>
                </form>
            </div>
        </div>
    );
}