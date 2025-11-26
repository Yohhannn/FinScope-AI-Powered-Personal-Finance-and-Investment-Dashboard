import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit2, Save, Plus } from 'lucide-react';

export default function ManageCategoriesModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newName, setNewName] = useState('');

    const fetchCats = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/dashboard/categories", { headers: { Authorization: token } });
        if(res.ok) setCategories(await res.json());
    };

    useEffect(() => { if(isOpen) fetchCats(); }, [isOpen]);

    const handleAdd = async () => {
        if(!newName) return;
        const token = localStorage.getItem("token");
        await fetch("http://localhost:5000/api/dashboard/category", {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: token },
            body: JSON.stringify({ name: newName })
        });
        setNewName(''); fetchCats();
    };

    const handleUpdate = async (id) => {
        const token = localStorage.getItem("token");
        await fetch(`http://localhost:5000/api/dashboard/category/${id}`, {
            method: "PUT", headers: { "Content-Type": "application/json", Authorization: token },
            body: JSON.stringify({ name: editName })
        });
        setEditingId(null); fetchCats();
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete category?")) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/dashboard/category/${id}`, { method: "DELETE", headers: { Authorization: token } });
        if(res.ok) fetchCats();
        else alert("Cannot delete category (it might be in use).");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-md relative h-[80vh] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Manage Categories</h3>

                {/* Add New */}
                <div className="flex gap-2 mb-4">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New Category..." className="flex-1 p-2 rounded bg-gray-100 dark:bg-gray-700 dark:text-white" />
                    <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded"><Plus /></button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto space-y-2">
                    {categories.map(c => (
                        <div key={c.category_id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            {editingId === c.category_id ? (
                                <div className="flex gap-2 flex-1">
                                    <input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 p-1 rounded bg-white dark:bg-gray-600 dark:text-white" />
                                    <button onClick={() => handleUpdate(c.category_id)} className="text-green-500"><Save size={18}/></button>
                                </div>
                            ) : (
                                <span className="text-gray-900 dark:text-white">{c.name}</span>
                            )}

                            <div className="flex gap-2 ml-2">
                                {editingId !== c.category_id && (
                                    <button onClick={() => { setEditingId(c.category_id); setEditName(c.name); }} className="text-blue-400"><Edit2 size={16}/></button>
                                )}
                                <button onClick={() => handleDelete(c.category_id)} className="text-red-400"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}