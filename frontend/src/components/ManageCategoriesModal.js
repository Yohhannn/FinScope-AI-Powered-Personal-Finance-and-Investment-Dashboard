import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, AlertTriangle, Lock } from 'lucide-react';

const BASE_URL = process.env.REACT_APP_API_URL;

export default function ManageCategoriesModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [activeCategoryIds, setActiveCategoryIds] = useState(new Set());
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    // 1. Fetch Categories
    const fetchCats = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return; // Guard clause

            const res = await fetch(`${BASE_URL}/dashboard/categories`, {
                headers: { Authorization: token }
            });
            if(res.ok) setCategories(await res.json());
        } catch(e) { console.error(e); }
    };

    // 2. Fetch Active Budgets
    const fetchActiveBudgets = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const res = await fetch(`${BASE_URL}/dashboard/budgets`, {
                headers: { Authorization: token }
            });

            if(res.ok) {
                const data = await res.json();
                const budgetList = data.budgets || data;
                // Safely map if budgetList is an array
                if (Array.isArray(budgetList)) {
                    const usedIds = new Set(budgetList.map(b => b.category_id));
                    setActiveCategoryIds(usedIds);
                }
            }
        } catch(e) { console.error("Error fetching usage:", e); }
    };

    useEffect(() => {
        if(isOpen) {
            fetchCats();
            fetchActiveBudgets();
            setError('');
            setNewName('');
        }
    }, [isOpen]);

    // 🟢 3. FIXED: Add Category with Better Debugging
    const handleAdd = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedName = newName.trim();
        if(!trimmedName) return;

        const exists = categories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (exists) {
            setError(`'${trimmedName}' already exists.`);
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("You are not logged in.");
                return;
            }

            console.log("Sending payload:", { name: trimmedName }); // Debug log

            const res = await fetch(`${BASE_URL}/dashboard/category`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({ name: trimmedName })
            });

            // 🟢 Handle response logic safely
            if(res.ok) {
                setNewName('');
                fetchCats();
            } else {
                // Check if response is JSON or Text (HTML error page)
                const contentType = res.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const data = await res.json();
                    setError(data.error || "Failed to add category");
                } else {
                    const text = await res.text();
                    console.error("Server Error (Raw):", text);
                    setError("Server Error (500). Check Console for details.");
                }
            }
        } catch(e) {
            console.error(e);
            setError("Network error occurred.");
        }
    };

    // 4. Delete Category
    const handleDelete = async (id) => {
        if(!window.confirm("Delete this category?")) return;
        setError('');

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/dashboard/category/${id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });

            if(res.ok) {
                fetchCats();
            } else {
                const data = await res.json();
                setError(data.error || "Could not delete category.");
            }
        } catch(e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative flex flex-col h-[60vh] animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manage Categories</h3>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center animate-pulse">
                        <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <input
                        value={newName}
                        onChange={e => {
                            setNewName(e.target.value);
                            if(error) setError('');
                        }}
                        placeholder="New Category..."
                        className={`flex-1 p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 dark:text-white border-2 focus:border-blue-500 outline-none ${error ? 'border-red-500' : 'border-transparent'}`}
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition"><Plus /></button>
                </form>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {categories.length === 0 && <p className="text-gray-500 text-center mt-4">No categories found.</p>}

                    {categories.map(c => {
                        const isInUse = activeCategoryIds.has(c.category_id);
                        // Ensure user_id matches logic (assumed 1 is default/admin)
                        const isDefault = c.user_id === 1;

                        return (
                            <div key={c.category_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition">
                                <span className="text-gray-900 dark:text-white font-medium">{c.name}</span>

                                <div className="flex items-center">
                                    {isDefault ? (
                                        <span className="text-xs text-gray-400 px-2 bg-gray-200 dark:bg-gray-800 rounded py-1">Default</span>
                                    ) : isInUse ? (
                                        <div className="flex items-center text-amber-500 dark:text-amber-400 gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded cursor-help" title="Cannot delete: Currently used in a budget">
                                            <Lock size={14} />
                                            <span className="text-xs font-medium">In Use</span>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleDelete(c.category_id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}