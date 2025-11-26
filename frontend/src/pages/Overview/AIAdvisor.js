import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, SectionHeader } from '../../components/DashboardUI';

export default function AIAdvisor() {
    const [messages, setMessages] = useState([
        { from: 'ai', text: 'Hello! I am your AI Financial Advisor. How can I help you today? You can ask me about your spending, investments, or savings goals.' },
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (input.trim() === '') return;

        const newMessages = [...messages, { from: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        // Mock AI response simulation
        setTimeout(() => {
            let aiResponse = 'That\'s a great question. ';
            if (input.toLowerCase().includes('spending')) {
                aiResponse += 'Based on your recent transactions, your highest spending category is "Food & Dining" at $450. This is 30% higher than last month. Would you like me to suggest some ways to cut back?';
            } else if (input.toLowerCase().includes('invest')) {
                aiResponse += 'Your portfolio is well-diversified, but has a 70% exposure to tech. Considering the market sentiment, you might want to explore adding some assets in the healthcare or energy sectors.';
            } else {
                aiResponse += 'I\'m analyzing your data... Based on your goals, I recommend increasing your savings goal for the "Hawaii Vacation" by $50 per month. This could help you reach it 2 months sooner.';
            }
            setMessages([...newMessages, { from: 'ai', text: aiResponse }]);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]"> {/* Adjust height to fit layout */}
            <SectionHeader title="AI Financial Advisor" />
            <Card className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 space-y-4 p-4 overflow-y-auto">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.from === 'ai' ? 'justify-start' : 'justify-end'}`}>
                            <div
                                className={`max-w-xs lg:max-w-md p-4 rounded-2xl ${
                                    msg.from === 'ai'
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                        : 'bg-blue-600 text-white'
                                }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Input */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask me anything about your finances..."
                            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSend}
                            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}