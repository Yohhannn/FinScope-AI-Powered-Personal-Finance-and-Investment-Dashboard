import React from 'react';

// 1. Card Component
export const Card = ({ children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 ${className}`}>
        {children}
    </div>
);

// 2. Section Header
export const SectionHeader = ({ title, actions }) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
        {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
);

// 3. Progress Bar
export const ProgressBar = ({ current, total, color = 'blue' }) => {
    const percentage = Math.min((current / total) * 100, 100);
    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        yellow: 'bg-yellow-500',
    };
    return (
        <div>
            <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                <span>${current.toLocaleString()}</span>
                <span>${total.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                    className={`${colorClasses[color]} h-2.5 rounded-full`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};