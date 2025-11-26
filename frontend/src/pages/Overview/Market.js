import React from 'react';
import { TrendingUp, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';

const mockWatchlist = [
    { id: 1, ticker: 'BTC', name: 'Bitcoin', price: 60123.45, change: 2.5 },
    { id: 2, ticker: 'ETH', name: 'Ethereum', price: 4050.60, change: -1.2 },
    { id: 3, ticker: 'AAPL', name: 'Apple Inc.', price: 175.30, change: 0.8 },
    { id: 4, ticker: 'TSLA', name: 'Tesla Inc.', price: 780.00, change: 5.1 },
];

const mockNews = [
    { id: 1, headline: 'Federal Reserve hints at tapering bond purchases by end of year.', sentiment: 'neutral', source: 'Reuters' },
    { id: 2, headline: 'Bitcoin hits new all-time high amid strong institutional adoption.', sentiment: 'positive', source: 'CoinDesk' },
    { id: 3, headline: 'Tech stocks slide as inflation fears grow.', sentiment: 'negative', source: 'Bloomberg' },
];

export default function Market() {
    const SentimentIcon = ({ sentiment }) => {
        if (sentiment === 'positive') return <TrendingUp size={18} className="text-green-500" />;
        if (sentiment === 'negative') return <TrendingUp size={18} className="text-red-500 rotate-180" />;
        return <ArrowRight size={18} className="text-gray-500 -rotate-45" />;
    };

    return (
        <div>
            <SectionHeader title="Markets" />

            {/* Market Sentiment Section */}
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Market Sentiment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <Card className="lg:col-span-1 flex flex-col items-center justify-center">
                    <div className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">Market Mood</div>
                    <div className="text-6xl font-bold text-green-600 dark:text-green-400 mb-2">Bullish</div>
                    <div className="text-8xl">🐂</div>
                </Card>

                <Card className="lg:col-span-2">
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">AI Market Summary</h4>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        Overall market sentiment is positive, driven by strong earnings in the tech sector and growing institutional interest in crypto.
                        However, watch for inflation data later this week, which could introduce volatility.
                    </p>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Top News</h4>
                    <div className="space-y-3">
                        {mockNews.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="mr-3"><SentimentIcon sentiment={item.sentiment} /></span>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.headline}</p>
                                </div>
                                <a href="#" className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-4">
                                    {item.source} <ExternalLink size={12} className="inline" />
                                </a>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Watchlist Section */}
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">My Watchlist</h3>
            <Card>
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 p-4">Asset</th>
                        <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 p-4">Price</th>
                        <th className="text-right text-sm font-medium text-gray-500 dark:text-gray-400 p-4">24h Change</th>
                    </tr>
                    </thead>
                    <tbody>
                    {mockWatchlist.map(item => (
                        <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-4">
                                <div className="flex items-center">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white mr-2">{item.ticker}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.name}</div>
                                </div>
                            </td>
                            <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                                ${item.price.toLocaleString()}
                            </td>
                            <td className={`p-4 text-right font-medium ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.change > 0 ? '+' : ''}{item.change}%
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}