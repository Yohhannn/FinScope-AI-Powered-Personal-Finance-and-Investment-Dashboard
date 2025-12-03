import React, { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, AlertCircle, User, Lock, Shield } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function Settings() {
    // PROFILE STATE
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

    // PASSWORD STATE
    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    // Load initial data
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setFormData({ name: parsed.name || '', email: parsed.email || '' });
            } catch (e) { console.error(e); }
        }
    }, []);

    // 🟢 HANDLE PROFILE UPDATE
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        setProfileMsg({ type: '', text: '' });

        if (!BASE_URL) {
            setProfileMsg({ type: 'error', text: 'API URL not configured.' });
            setProfileLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/auth/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (res.ok) {
                const currentUser = JSON.parse(localStorage.getItem("user") || '{}');
                localStorage.setItem("user", JSON.stringify({ ...currentUser, ...formData }));
                setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setProfileMsg({ type: 'error', text: data.error || 'Failed to update.' });
            }
        } catch (error) {
            setProfileMsg({ type: 'error', text: 'Server error.' });
        } finally {
            setProfileLoading(false);
        }
    };

    // 🟢 HANDLE PASSWORD CHANGE
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPassLoading(true);
        setPassMsg({ type: '', text: '' });

        if (!BASE_URL) {
            setPassMsg({ type: 'error', text: 'API URL not configured.' });
            setPassLoading(false);
            return;
        }

        // 1. Client-side Validation
        if (passData.newPassword !== passData.confirmPassword) {
            setPassMsg({ type: 'error', text: "New passwords do not match." });
            setPassLoading(false);
            return;
        }
        if (passData.newPassword.length < 6) {
            setPassMsg({ type: 'error', text: "Password must be at least 6 characters." });
            setPassLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/auth/change-password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    currentPassword: passData.currentPassword,
                    newPassword: passData.newPassword
                })
            });
            const data = await res.json();

            if (res.ok) {
                setPassMsg({ type: 'success', text: 'Password changed successfully!' });
                setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Reset fields
            } else {
                setPassMsg({ type: 'error', text: data.error || 'Failed to change password.' });
            }
        } catch (error) {
            setPassMsg({ type: 'error', text: 'Server error.' });
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10 space-y-8">
            <SectionHeader title="Account Settings" />

            {/* 1. PROFILE SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-200 dark:border-gray-800 pb-8">
                <div className="md:col-span-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <User size={20} className="text-blue-600"/> Profile
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your public name and email address.</p>
                </div>
                <div className="md:col-span-2">
                    <Card className="p-6">
                        {profileMsg.text && (
                            <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {profileMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>} {profileMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" required />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={profileLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 disabled:opacity-70">
                                    {profileLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Save Profile
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>

            {/* 2. SECURITY SECTION (Change Password) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Shield size={20} className="text-blue-600"/> Security
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ensure your account is secure by using a strong password.</p>
                </div>
                <div className="md:col-span-2">
                    <Card className="p-6 border-l-4 border-l-blue-500">
                        {passMsg.text && (
                            <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${passMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {passMsg.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>} {passMsg.text}
                            </div>
                        )}
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input type="password" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" required placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input type="password" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" required placeholder="Min 6 chars" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                        <input type="password" value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" required placeholder="Re-type password" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={passLoading} className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 disabled:opacity-70">
                                    {passLoading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Update Password
                                </button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}