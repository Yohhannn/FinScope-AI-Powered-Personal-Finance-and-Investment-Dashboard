import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from 'lucide-react';

export default function ManageCategoriesModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [newName, setNewName] = useState('');

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

    useEffect(() => { if(isOpen) fetchCats(); }, [isOpen]);

    // 2. Add Category
    const handleAdd = async (e) => {
        e.preventDefault();
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
                fetchCats(); // Refresh list immediately
            }
        } catch(e) { console.error(e); }
    };

    // 3. Delete Category
    const handleDelete = async (id) => {
        if(!window.confirm("Delete this category?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/dashboard/category/${id}`, {
                method: "DELETE",
                headers: { Authorization: token }
            });
            if(res.ok) fetchCats();
        } catch(e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative flex flex-col h-[60vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manage Categories</h3>

                {/* Add Input */}
                <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                    <input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="New Category..."
                        className="flex-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white"
                    />
                    <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Plus /></button>
                </form>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {categories.length === 0 && <p className="text-gray-500 text-center mt-4">No categories found.</p>}

                    {categories.map(c => (
                        <div key={c.category_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-gray-900 dark:text-white font-medium">{c.name}</span>
                            <button onClick={() => handleDelete(c.category_id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}