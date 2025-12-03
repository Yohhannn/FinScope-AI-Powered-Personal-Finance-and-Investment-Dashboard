import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Percent,
    Sparkles, Loader2, FileSpreadsheet, Activity,
    Wallet
} from 'lucide-react';
import {
    BarChart, Bar, Cell,
    XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Card, SectionHeader } from '../../components/DashboardUI';

// 🟢 CRITICAL: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

export default function Analytics() {
    const [transactions, setTransactions] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);

    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        netSavings: 0,
        savingsRate: 0,
        avgDailySpend: 0,
        txCount: 0,
        largestExpense: { name: '-', amount: 0 }
    });

    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        if (!BASE_URL) {
            console.error("Configuration Error: API URL is missing.");
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem("token");

            // 🟢 FIX: Fetch BOTH Transactions AND Wallets to reconcile balances
            const [txRes, walletRes] = await Promise.all([
                fetch(`${BASE_URL}/dashboard/analytics`, { headers: { Authorization: token } }),
                fetch(`${BASE_URL}/dashboard`, { headers: { Authorization: token } }) // Fetches wallets
            ]);

            if (txRes.ok && walletRes.ok) {
                const txData = await txRes.json();
                const walletData = await walletRes.json(); // Contains .wallets array

                setTransactions(txData);
                // 🟢 Pass both datasets to processing
                processData(txData, walletData.wallets || []);
            } else {
                console.error("Failed to fetch data");
            }
        } catch (e) {
            console.error("Network Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const processData = (txData, wallets) => {
        let tIncome = 0;
        let tExpense = 0;
        let largestExp = { name: '-', amount: 0 };
        const months = {};
        const categories = {};

        // 1. Calculate Transaction Flows
        txData.forEach(tx => {
            const amount = parseFloat(tx.amount);
            const date = new Date(tx.transaction_date);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

            if (!months[monthKey]) months[monthKey] = { name: monthKey, income: 0, expense: 0 };

            if (tx.type === 'income') {
                tIncome += amount;
                months[monthKey].income += amount;
            } else {
                const absAmount = Math.abs(amount);
                tExpense += absAmount;
                months[monthKey].expense += absAmount;

                const cat = tx.category_name || 'Uncategorized';
                if (!categories[cat]) categories[cat] = 0;
                categories[cat] += absAmount;

                if (absAmount > largestExp.amount) {
                    largestExp = { name: tx.name, amount: absAmount };
                }
            }
        });

        // 🟢 2. SMART CORRECTION: Account for Initial Balances
        // Actual Net Worth (Sum of all wallets in DB)
        const actualNetWorth = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0);

        // Calculated Net Savings from Transactions alone
        const transactionNetSavings = tIncome - tExpense;

        // The discrepancy is assumed to be "Initial Balance" (money that existed before tracking)
        // If Actual > TransactionSavings, we add the diff to Income so the math works.
        const initialBalanceAdjustment = Math.max(0, actualNetWorth - transactionNetSavings);

        const adjustedTotalIncome = tIncome + initialBalanceAdjustment;
        const adjustedNetSavings = adjustedTotalIncome - tExpense; // Should now equal actualNetWorth

        // 3. Calculate Derived Stats
        const rate = adjustedTotalIncome > 0 ? (adjustedNetSavings / adjustedTotalIncome) * 100 : 0;

        const dates = txData.map(t => new Date(t.transaction_date).getTime());
        const daySpan = dates.length > 0
            ? Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)))
            : 1;
        const dailyAvg = tExpense / daySpan;

        setStats({
            totalIncome: adjustedTotalIncome, // 🟢 Now includes initial balances
            totalExpense: tExpense,
            netSavings: adjustedNetSavings,   // 🟢 Now matches your Wallet Balances
            savingsRate: rate,
            avgDailySpend: dailyAvg,
            txCount: txData.length,
            largestExpense: largestExp
        });

        setMonthlyData(Object.values(months));

        const catArray = Object.keys(categories).map(key => ({
            name: key,
            value: categories[key]
        })).sort((a, b) => b.value - a.value);
        setCategoryData(catArray);
    };

    // 🟢 AI RECOMMENDER
    const getRecommendations = async () => {
        if (!BASE_URL) return;
        setAnalyzing(true);
        try {
            const token = localStorage.getItem("token");
            const promptData = {
                metrics: stats,
                top_spending_category: categoryData.length > 0 ? categoryData[0].name : "None",
                recent_trend: monthlyData.slice(-3)
            };

            const res = await fetch(`${BASE_URL}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": token },
                body: JSON.stringify({
                    message: `Based on these financial stats (in PHP/Peso), give me exactly 3 short, punchy, actionable recommendations in a JSON array format. Data: ${JSON.stringify(promptData)}`
                })
            });

            const data = await res.json();
            if (res.ok) {
                try {
                    const parsed = JSON.parse(data.reply);
                    setAiRecommendations(Array.isArray(parsed) ? parsed : [data.reply]);
                } catch (e) {
                    setAiRecommendations(data.reply.split('\n').filter(line => line.length > 10).slice(0,3));
                }
            }
        } catch (e) { console.error(e); }
        finally { setAnalyzing(false); }
    };

    // 🟢 CSV EXPORT
    const exportCSV = () => {
        const csv = Papa.unparse(transactions);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, "FinScope_Analytics.csv");
    };

    if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">Loading analytics...</div>;

    // Show empty state only if no wallets AND no transactions
    const hasData = transactions.length > 0 || stats.netSavings > 0;

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            <SectionHeader
                title="Analytics Overview"
                actions={
                    <button onClick={exportCSV} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm text-sm">
                        <FileSpreadsheet size={16} className="text-green-600" />
                        <span>Export CSV</span>
                    </button>
                }
            />

            {/* 🟢 1. KEY STATISTICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm font-medium">Total Income</span>
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20}/></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.totalIncome.toLocaleString()}</h3>
                    {/* Added Tooltip-like text */}
                    <p className="text-xs text-gray-400 mt-1">Includes Initial Balances</p>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm font-medium">Total Expenses</span>
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown size={20}/></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₱{stats.totalExpense.toLocaleString()}</h3>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm font-medium">Net Savings</span>
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Wallet size={20}/></div>
                    </div>
                    <h3 className={`text-2xl font-bold ${stats.netSavings >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                        ₱{stats.netSavings.toLocaleString()}
                    </h3>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-sm font-medium">Savings Rate</span>
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Percent size={20}/></div>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.savingsRate.toFixed(1)}%</h3>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 🟢 2. DETAILED STATS SIDEBAR */}
                <div className="space-y-6">
                    <Card>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-orange-500"/> Activity Metrics
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <span className="text-sm text-gray-500">Avg Daily Spend</span>
                                <span className="font-bold text-gray-900 dark:text-white">₱{stats.avgDailySpend.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <span className="text-sm text-gray-500">Transactions</span>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.txCount}</span>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50">
                                <span className="text-xs text-red-500 uppercase font-bold">Largest Expense</span>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">{stats.largestExpense.name}</span>
                                    <span className="font-bold text-red-600">₱{stats.largestExpense.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 🟢 3. AI RECOMMENDER */}
                    <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10"><Sparkles size={80} /></div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                                <Sparkles size={20} className="text-yellow-300" /> AI Insights
                            </h3>

                            {aiRecommendations.length > 0 ? (
                                <ul className="space-y-3 mb-4">
                                    {aiRecommendations.map((rec, i) => (
                                        <li key={i} className="flex gap-2 text-sm bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                                            <span className="text-yellow-300 font-bold">•</span>
                                            {rec.replace(/['"]+/g, '')}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-indigo-100 text-sm mb-4">
                                    Click below to analyze your {stats.txCount} transactions and generate smart tips.
                                </p>
                            )}

                            <button
                                onClick={getRecommendations}
                                disabled={analyzing}
                                className="w-full py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-50 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {analyzing ? <Loader2 size={16} className="animate-spin"/> : "Generate Tips"}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* 🟢 4. CHARTS SECTION */}
                <div className="lg:col-span-2 space-y-6">

                    {!hasData ? (
                        <Card className="flex items-center justify-center h-96">
                            <p className="text-gray-500 dark:text-gray-400">
                                No data available. Add a wallet or transaction to see charts.
                            </p>
                        </Card>
                    ) : (
                        <>
                            {/* Trend / Cashflow Chart */}
                            <Card>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Cash Flow & Trends</h3>
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={monthlyData}>
                                            <defs>
                                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                                            <Legend />
                                            <Area type="monotone" name="Income" dataKey="income" stroke="#10B981" fillOpacity={1} fill="url(#colorIn)" />
                                            <Area type="monotone" name="Expenses" dataKey="expense" stroke="#EF4444" fillOpacity={1} fill="url(#colorOut)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Top Spending Categories */}
                            <Card>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Spending Categories</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={categoryData.slice(0, 5)} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                            <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                                            <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}