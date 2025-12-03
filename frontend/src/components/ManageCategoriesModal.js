import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, AlertTriangle } from 'lucide-react';

export default function ManageCategoriesModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    // 1. Fetch Categories
    const fetchCats = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/categories", {
                headers: { Authorization: token }
            });
            if(res.ok) setCategories(await res.json());
        } catch(e) { console.error(e); }
    };

    useEffect(() => {
        if(isOpen) {
            fetchCats();
            setError('');
        }
    }, [isOpen]);

    // 2. Add Category
    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');
        if(!newName) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/category", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: token },
                body: JSON.stringify({ name: newName })
            });
            if(res.ok) {
                setNewName('');
                fetchCats();
            } else {
                const data = await res.json();
                setError(data.error || "Failed to add category");
            }
        } catch(e) { console.error(e); }
    };

    // 🟢 3. Delete Category (Updated Logic)
    const handleDelete = async (id) => {
        if(!window.confirm("Delete this category?")) return;
        setError(''); // Clear previous errors

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/category/${id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });

            if(res.ok) {
                fetchCats();
            } else {
                // 🟢 SHOW ERROR if backend refuses (e.g., category in use)
                const data = await res.json();
                alert(data.error || "Could not delete category.");
            }
        } catch(e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative flex flex-col h-[60vh] animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manage Categories</h3>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* Add Input */}
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="New Category..."
                        className="flex-1 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white border-transparent focus:border-blue-500 outline-none"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition"><Plus /></button>
                </form>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {categories.length === 0 && <p className="text-gray-500 text-center mt-4">No categories found.</p>}

                    {categories.map(c => (
                        <div key={c.category_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition">
                            <span className="text-gray-900 dark:text-white font-medium">{c.name}</span>

                            {/* Only allow deleting if it belongs to the user (assuming user_id 1 is system/default) */}
                            {c.user_id !== 1 ? (
                                <button onClick={() => handleDelete(c.category_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                    <Trash2 size={18}/>
                                </button>
                            ) : (
                                <span className="text-xs text-gray-400 px-2">Default</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}