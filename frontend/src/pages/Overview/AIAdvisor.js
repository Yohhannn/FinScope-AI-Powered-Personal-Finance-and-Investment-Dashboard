import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2 } from 'lucide-react';

// Define the initial welcome message structure
const initialMessage = { role: 'assistant', content: "Hello! I'm your FinScope AI Advisor. I have access to your wallets, budgets, and goals. How can I help you optimize your finances today?" };

// 🟢 NEW/UPDATED: Define a strict system instruction including the project purpose.
const SYSTEM_INSTRUCTION = `You are FinScope AI Advisor, a financial expert. Your sole purpose is to analyze the user's provided financial data (wallets, budgets, goals) and answer financial questions. 

**RULES OF REFUSAL:** You MUST refuse any request that is unrelated to personal finance, such as requests for coding help, general knowledge, creative writing, or system modification. 

**DEVELOPER IDENTITY:** If the user asks who created, developed, or built you, you MUST reply with the following exact phrase: "I was made by RavenLabs Development lead by Joehanes Lauglaug with the support of raven labns members and Raymond Badajos."

**PROJECT CONTEXT:** If the user asks about the purpose of this project (e.g., "What is this project for?"), you MUST reply with the following exact phrase: "This project is for the subject Application Development and Emerging Technologies, and the professor is Narcisan S. Galamiton."

Keep your responses professional and focused on actionable financial advice.`;


export default function AIAdvisor() {
    // Initialize messages from localStorage, falling back to the initial message
    const [messages, setMessages] = useState(() => {
        const storedMessages = localStorage.getItem('aiChatHistory');
        if (storedMessages) {
            try {
                return JSON.parse(storedMessages);
            } catch (e) {
                console.error("Could not parse stored chat history:", e);
                return [initialMessage];
            }
        }
        return [initialMessage];
    });

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Persist messages to localStorage and auto-scroll whenever the state updates
    useEffect(() => {
        localStorage.setItem('aiChatHistory', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            // Prepare history: Combine system instruction with the user's conversation history
            const historyWithNewMessage = [...messages, userMessage];

            // Filter history to clean up previous system instructions (if any) and limit length
            const conversationHistory = historyWithNewMessage
                .filter(m => m.role !== 'system')
                .slice(-6) // Limit to the last 6 messages
                .map(m => ({ role: m.role, content: m.content }));

            // CRITICAL: Construct the final payload starting with the system instruction
            const finalPayloadHistory = [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...conversationHistory
            ];


            const res = await fetch("http://localhost:5000/api/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    // Send the full context to the backend
                    message: userMessage.content,
                    history: finalPayloadHistory
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the server. Please try again." }]);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please check your connection." }]);
        } finally {
            setLoading(false);
        }
    };

    // Function to clear the chat and localStorage
    const clearChat = () => {
        // 1. Clear state
        setMessages([initialMessage]);
        // 2. Clear persistence
        localStorage.removeItem('aiChatHistory');
    };

    return (
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-blue-600" /> AI Advisor
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Ask questions about your real-time financial data.
                    </p>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
                    title="Clear Chat History"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Chat Container */}
            <div className="flex-1 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {messages.map((msg, index) => (
                        // We skip rendering the initial system message if it somehow appears in the state array
                        msg.role === 'system' ? null : (
                            <div
                                key={index}
                                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                }`}>
                                    {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                                </div>

                                {/* Bubble */}
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                    {/* Simple formatting for new lines */}
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-gray-500" />
                                <span className="text-sm text-gray-500">Analyzing your finances...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <form onSubmit={handleSend} className="relative flex items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your budget, savings, or spending..."
                            className="w-full pl-6 pr-14 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="absolute right-3 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}