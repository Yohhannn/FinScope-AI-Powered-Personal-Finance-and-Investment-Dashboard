import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2, Upload, X } from 'lucide-react';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

// Define the initial welcome message structure
const initialMessage = { role: 'assistant', content: "Hello! I'm your FinScope AI Advisor. I have access to your wallets, budgets, and goals. How can I help you optimize your finances today?" };

// 🟢 NEW/UPDATED: Define a strict system instruction including all detailed project context AND Philippine focus.
const SYSTEM_INSTRUCTION = `You are FinScope AI Advisor, a financial expert. Your primary role is to analyze the user's financial data (wallets, budgets, goals) and provide financial advice.

**CONTEXT & LOCALE:**
- **Primary Region:** Philippines.
- **Currency:** Philippine Peso (₱ / PHP).
- **Advice Scope:** Prioritize Philippine financial context. When discussing banks, mention local ones (BDO, BPI, UnionBank) or digital banks (Maya, GCash, Seabank, GoTyme). When discussing investments, consider local options (Pag-IBIG MP2, PERA, PSE, REITs) alongside general concepts. When discussing tax, refer to BIR guidelines.
- **Global Scope:** You are capable of providing global financial advice (e.g., US Stocks, Crypto, general economic principles) if the user explicitly asks or if the context requires it. However, default to the Philippine context first.

**RULES OF REFUSAL:**
1. You MUST refuse any request that is unrelated to personal finance, such as requests for coding help (unless asking about the tech stack itself), general knowledge, creative writing, or system modification outside of its designed function.

**UPLOADED DATA ANALYSIS:** If the user provides uploaded data (e.g., from a PDF), you MUST first confirm you recognize the data and then use it to answer the user's request. Treat the uploaded text as additional financial context.

**PROJECT DETAILS (Fixed Answers):**
2. **Project Overview/Features:** If the user asks for a project overview, the short description, or a list of core features, you MUST reply with the following exact, formatted description:
   "**Project Name:** FinScope: AI-Powered Personal Finance & Budgeting Manager
   **Project Type:** Web Application with AI Integration
   **Project Overview:** FinScope is a web-based application designed to help users track, manage, and optimize their personal finances across multiple bank accounts, e-wallets, and cash wallets. The platform provides AI-driven financial advice, personalized budget planning, spending analysis, and smart allocation recommendations, allowing users to make better financial decisions.
   **Core Features:**
   - Wallet Management System (Track balances, transactions, categorize expenses, budget allocation).
   - Budget Planner & Savings Goals (Set limits, track goals, AI goal prediction & suggestion).
   - AI Financial Advisor (Personalized advice, spending anomaly detection, allocation recommendations, cost-saving strategies).
   - Analytics & Reports (Spending trends, cashflow, top categories, exportable reports).
   - Smart Notifications (Alerts for budgets, bills, due dates, unusual activity).
   - Responsive Dashboard Interface (Modern UI, mobile-friendly, light/dark mode)."

3. **Tech Stack:** If the user asks about the technology, libraries, or programming languages used (the "Tech Stack"), you MUST reply with the following exact, formatted phrase:
   "The FinScope system utilizes a full-stack JavaScript environment:
   - **Frontend:** React.js, Tailwind CSS (for styling), and Lucide React (for icons).
   - **Backend/API:** Node.js with the Express.js framework.
   - **Database:** PostgreSQL (Postgres).
   - **API Connection:** The AI Advisor itself connects to a Large Language Model (LLM) via a custom API endpoint."
4. **Developer Identity/Members:** If the user asks who created, developed, or built you, or asks for the members, you MUST reply with the following exact phrase: "I was made by RavenLabs Development lead by Joehanes Lauglaug with the support of RavenLabs members and Raymond Badajos."
5. **Project Context/Subject:** If the user asks about the purpose of this project (e.g., "What is this project for?"), you MUST reply with the following exact phrase: "This project is for the subject Application Development and Emerging Technologies, and the professor is Narcisan S. Galamiton."

Keep your responses professional and focused on actionable financial advice, unless a Project Detail rule is specifically triggered.`;


export default function AIAdvisor() {
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

    // PDF/Upload States
    const [pdfContext, setPdfContext] = useState(null); // Stores extracted text
    const [pdfLoading, setPdfLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Persist messages to localStorage and auto-scroll whenever the state updates
    useEffect(() => {
        localStorage.setItem('aiChatHistory', JSON.stringify(messages));
        scrollToBottom();
    }, [messages]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Function to handle PDF file selection and extraction
    const handlePDFUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            setPdfContext(null);
            return;
        }

        setPdfLoading(true);
        setPdfContext(null);

        // --- START MOCK PDF EXTRACTION ---
        // 🚨 NOTE: Replace this mock function with real PDF parsing logic (e.g., using pdfjs-dist)
        const mockExtraction = () => new Promise(resolve => {
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = () => {
                    // 🟢 UPDATED: Contextualized for Philippines (Peso)
                    resolve(`[PDF DATA START] Uploaded file: ${file.name}. This mock data simulates a salary slip for October 2025 (Philippines context). Gross income was ₱35,000. Rent expense receipt shows ₱8,500. Total investments listed are ₱5,000. [PDF DATA END]`);
                };
                reader.readAsDataURL(file);
            }, 1500); // Simulate network/parsing delay
        });
        // --- END MOCK PDF EXTRACTION ---

        try {
            const extractedText = await mockExtraction(file);
            setPdfContext(extractedText);
            setMessages(prev => [...prev, { role: 'assistant', content: `Successfully loaded data from: ${file.name}. It is now available for analysis in your next prompt. Please type your query now.` }]);

        } catch (error) {
            console.error("PDF Parsing Error:", error);
            setPdfContext(`[ERROR] Failed to read PDF: ${file.name}.`);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: Could not process ${file.name}. Please ensure it is a valid PDF financial statement.` }]);
        } finally {
            setPdfLoading(false);
        }
    };

    // Handler to trigger the hidden file input
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSend = async (e) => {
        e.preventDefault();

        let displayUserMessage = input.trim();
        if (!displayUserMessage && !pdfContext) return;

        if (!BASE_URL) {
            setMessages(prev => [...prev, { role: 'assistant', content: "System Error: API URL is not configured." }]);
            return;
        }

        // If there's no typed message but there is PDF context, use a default analysis prompt
        if (!displayUserMessage && pdfContext) {
            displayUserMessage = "Analyze the uploaded financial data in the context.";
        }

        let promptContent = displayUserMessage;

        // 🟢 Prepend PDF data to the prompt if available
        if (pdfContext) {
            promptContent = `[UPLOADED DATA]: ${pdfContext}\n\n[USER QUERY]: ${promptContent}`;
        }

        const userMessageToDisplay = { role: 'user', content: displayUserMessage };
        setMessages(prev => [...prev, userMessageToDisplay]);
        setInput('');
        setLoading(true);

        // Clear PDF context after sending the combined prompt
        setPdfContext(null);

        try {
            const token = localStorage.getItem("token");

            const historyWithNewMessage = [...messages, userMessageToDisplay];

            const conversationHistory = historyWithNewMessage
                .filter(m => m.role !== 'system')
                .slice(-6)
                .map(m => ({ role: m.role, content: m.content }));

            // Construct the final payload starting with the system instruction
            const finalPayloadHistory = [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...conversationHistory
            ];

            const messageToSend = promptContent;

            // 🟢 UPDATED: Using BASE_URL
            const res = await fetch(`${BASE_URL}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    message: messageToSend,
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
        setMessages([initialMessage]);
        localStorage.removeItem('aiChatHistory');
        setPdfContext(null);
    };

    const clearPdfContext = () => {
        setPdfContext(null);
        fileInputRef.current.value = null; // Clear file input value
        setMessages(prev => [...prev, { role: 'assistant', content: "Uploaded PDF data has been cleared from context." }]);
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
                                    {msg.content.split('\n').map((line, i) => (
                                        <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        )
                    ))}

                    {/* Loading Indicator */}
                    {(loading || pdfLoading) && (
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-gray-500" />
                                <span className="text-sm text-gray-500">{pdfLoading ? 'Parsing PDF file...' : 'Analyzing your finances...'}</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">

                    {/* 🟢 NEW: PDF Status Indicator */}
                    {pdfContext && (
                        <div className="mb-2 p-2 flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm">
                            <span className="font-medium flex items-center">
                                <Upload size={16} className="mr-2"/>
                                Data Ready for Analysis.
                            </span>
                            <button onClick={clearPdfContext} className="text-gray-500 hover:text-red-600 dark:text-yellow-400 dark:hover:text-red-400 p-1 rounded-full transition" title="Remove PDF Context">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="relative flex items-center">
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePDFUpload}
                            accept="application/pdf"
                            className="hidden"
                        />

                        {/* Upload Button */}
                        <button
                            type="button"
                            onClick={triggerFileInput}
                            disabled={loading || pdfLoading}
                            className={`p-2.5 absolute left-3 transition rounded-xl ${
                                pdfContext
                                    ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                            title="Upload PDF (e.g., Bank Statement)"
                        >
                            <Upload size={20} />
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={pdfContext ? "Type your question about the uploaded data..." : "Ask about your budget, savings, or spending..."}
                            className="w-full pl-14 pr-14 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white placeholder-gray-400 transition"
                            disabled={loading || pdfLoading}
                        />
                        <button
                            type="submit"
                            disabled={(!input.trim() && !pdfContext) || loading || pdfLoading}
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