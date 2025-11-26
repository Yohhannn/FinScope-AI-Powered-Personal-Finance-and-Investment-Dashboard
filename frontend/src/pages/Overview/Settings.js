import React from 'react';
import { Card, SectionHeader } from '../../components/DashboardUI';

export default function Settings() {
    return (
        <div>
            <SectionHeader title="Settings" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Settings */}
                <div className="md:col-span-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Profile</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage your personal information.</p>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input type="text" defaultValue="John Doe" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input type="email" defaultValue="john.doe@example.com" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">Save Changes</button>
                        </form>
                    </Card>
                </div>

                {/* Preferences */}
                <div className="md:col-span-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Preferences</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize your app experience.</p>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Currency</label>
                                <select className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    <option>USD ($)</option>
                                    <option>EUR (€)</option>
                                    <option>JPY (¥)</option>
                                </select>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Notifications */}
                <div className="md:col-span-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Notifications</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Manage your alerts.</p>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">Budget Threshold Alerts</span>
                                <button className="w-12 h-6 bg-green-500 rounded-full p-1 flex items-center transition-colors">
                                    <span className="w-4 h-4 bg-white rounded-full shadow-md transform translate-x-6"></span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 dark:text-white">Goal Progress Reminders</span>
                                <button className="w-12 h-6 bg-green-500 rounded-full p-1 flex items-center transition-colors">
                                    <span className="w-4 h-4 bg-white rounded-full shadow-md transform translate-x-6"></span>
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}