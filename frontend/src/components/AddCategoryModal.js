import React, { useState } from 'react';
import { X } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function AddCategoryModal({ isOpen, onClose, onSuccess }) {
    const [name, setName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATE: Use BASE_URL instead of hardcoded localhost
            // This assumes REACT_APP_API_URL in your .env is "http://localhost:5000/api"
            const res = await fetch(`${BASE_URL}/dashboard/category`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                alert("Category Added!");
                if (onSuccess) onSuccess();
                setName('');
                onClose();
            } else {
                alert("Failed to add category");
            }
        } catch (e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm relative shadow-xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20}/></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Category</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Category Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Travel, Pets, Internet"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-medium transition">Save Category</button>
                </form>
            </div>
        </div>
    );
}