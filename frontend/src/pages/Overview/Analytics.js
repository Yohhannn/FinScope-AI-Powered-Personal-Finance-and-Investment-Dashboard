import React from 'react';
import { Download } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';

export default function Analytics() {
    return (
        <div>
            <SectionHeader
                title="Analytics & Reports"
                actions={
                    <button className="flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition">
                        <Download size={18} className="mr-2" /> Export Report (PDF/CSV)
                    </button>
                }
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spending Over Time</h3>
                    <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                        [Line Chart Placeholder]
                    </div>
                </Card>
                <Card>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
                    <div className="h-64 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                        [Pie Chart Placeholder]
                    </div>
                </Card>
                <Card className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Portfolio Growth</h3>
                    <div className="h-80 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500">
                        [Portfolio Value Line Chart Placeholder]
                    </div>
                </Card>
            </div>
        </div>
    );
}