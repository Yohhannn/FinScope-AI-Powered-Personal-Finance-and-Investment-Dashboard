import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';

export default function Market() {
    const [watchlist, setWatchlist] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/dashboard/market", { headers: { Authorization: token } });
            const data = await res.json();
            if(res.ok) setWatchlist(data);
        };
        fetchData();
    }, []);

    return (
        <div>
            <SectionHeader title="Markets" />
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">My Watchlist</h3>
            <Card>
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 p-4">Asset</th>
                        <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 p-4">Price</th>
                    </tr>
                    </thead>
                    <tbody>
                    {watchlist.map(item => (
                        <tr key={item.asset_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-4"><div className="text-lg font-bold text-gray-900 dark:text-white">{item.symbol}</div><div className="text-sm text-gray-500 dark:text-gray-400">{item.asset_name}</div></td>
                            <td className="p-4 text-right font-medium text-gray-900 dark:text-white">${Number(item.current_price).toLocaleString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}