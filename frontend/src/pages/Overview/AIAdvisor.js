import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Trash2, Upload, X, FileWarning, Lightbulb, ArrowRight, TrendingUp, ShieldCheck, PieChart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// 🚀 NEW: Define the base API URL from the environment variable
const BASE_URL = process.env.REACT_APP_API_URL;

// Define the initial welcome message structure
const initialMessage = {
    role: 'assistant',
    content: "Hello! I'm your FinScope AI Advisor. I have access to your wallets, budgets, and goals. How can I help you optimize your finances today?"
};

// 🟢 NEW: Financial Keywords for Validation (Heuristics)
const FINANCIAL_KEYWORDS = [
    'balance', 'account', 'statement', 'transaction', 'debit', 'credit',
    'deposit', 'withdrawal', 'amount', 'total', 'due', 'payment',
    'salary', 'income', 'expense', 'interest', 'tax', 'php', '₱',
    'bank', 'bill', 'invoice', 'receipt', 'gross', 'net', 'savings', 'budget'
];

// 🟢 SYSTEM INSTRUCTION
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
    const [pdfContext, setPdfContext] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState(null);
    const fileInputRef = useRef(null);

    // 🟢 NEW: Dynamic Suggestions State
    const [suggestions, setSuggestions] = useState([]);

    // Persist messages to localStorage and auto-scroll
    useEffect(() => {
        localStorage.setItem('aiChatHistory', JSON.stringify(messages));
        scrollToBottom();
        // 🟢 TRIGGER: Update suggestions based on the latest context
        updateSuggestions();
    }, [messages, pdfContext]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 🟢 NEW: Intelligent Suggestion Logic
    // This function analyzes the last message to determine the next logical steps
    const updateSuggestions = () => {
        // 1. If PDF is uploaded, prioritize document questions
        if (pdfContext) {
            setSuggestions([
                { text: "Summarize this document", icon: <FileWarning size={14} /> },
                { text: "Extract total expenses", icon: <TrendingUp size={14} /> },
                { text: "Are there any suspicious charges?", icon: <ShieldCheck size={14} /> },
                { text: "Convert to budget plan", icon: <PieChart size={14} /> }
            ]);
            return;
        }

        const lastMsg = messages[messages.length - 1];

        // 2. Initial State (Welcome)
        if (messages.length === 1) {
            setSuggestions([
                { text: "Analyze my spending trends", icon: <TrendingUp size={14} /> },
                { text: "Create a monthly budget", icon: <PieChart size={14} /> },
                { text: "How can I save more?", icon: <Sparkles size={14} /> },
                { text: "Explain the 50/30/20 rule", icon: <Lightbulb size={14} /> }
            ]);
            return;
        }

        // 3. Contextual Analysis based on Keywords in the LAST AI RESPONSE
        if (lastMsg.role === 'assistant') {
            const content = lastMsg.content.toLowerCase();

            if (content.includes('budget') || content.includes('limit')) {
                setSuggestions([
                    { text: "Adjust my budget limits", icon: <PieChart size={14} /> },
                    { text: "Am I overspending?", icon: <FileWarning size={14} /> },
                    { text: "Set a savings goal", icon: <TrendingUp size={14} /> }
                ]);
            }
            else if (content.includes('invest') || content.includes('stock') || content.includes('mp2')) {
                setSuggestions([
                    { text: "What are the risks?", icon: <ShieldCheck size={14} /> },
                    { text: "Best beginner investments PH", icon: <Sparkles size={14} /> },
                    { text: "Explain Compound Interest", icon: <Lightbulb size={14} /> }
                ]);
            }
            else if (content.includes('debt') || content.includes('loan') || content.includes('bill')) {
                setSuggestions([
                    { text: "Create a debt repayment plan", icon: <TrendingUp size={14} /> },
                    { text: "Should I pay highest interest first?", icon: <Lightbulb size={14} /> },
                    { text: "Consolidate my debts", icon: <PieChart size={14} /> }
                ]);
            }
            else if (content.includes('savings') || content.includes('fund')) {
                setSuggestions([
                    { text: "Where should I keep my emergency fund?", icon: <ShieldCheck size={14} /> },
                    { text: "High interest digital banks PH", icon: <TrendingUp size={14} /> },
                    { text: "Auto-deduct savings", icon: <Sparkles size={14} /> }
                ]);
            }
            else {
                // Fallback / Generic Continuation
                setSuggestions([
                    { text: "Tell me more details", icon: <ArrowRight size={14} /> },
                    { text: "Give me an example", icon: <Lightbulb size={14} /> },
                    { text: "Summarize this", icon: <FileWarning size={14} /> }
                ]);
            }
        }
    };

    // 🟢 Validation Logic
    const validateFinancialContent = (text) => {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        let matchCount = 0;
        FINANCIAL_KEYWORDS.forEach(word => {
            if (lowerText.includes(word)) matchCount++;
        });
        return matchCount >= 3;
    };

    const handlePDFUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || file.type !== 'application/pdf') {
            setPdfContext(null);
            return;
        }

        setPdfLoading(true);
        setPdfContext(null);
        setPdfError(null);

        // --- MOCK PDF EXTRACTION ---
        const mockExtraction = () => new Promise(resolve => {
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = () => {
                    resolve(`[PDF DATA START] Uploaded file: ${file.name}. This mock data simulates a salary slip for October 2025 (Philippines context). Gross income was ₱35,000. Rent expense receipt shows ₱8,500. Total investments listed are ₱5,000. [PDF DATA END]`);
                };
                reader.readAsDataURL(file);
            }, 1500);
        });

        try {
            const extractedText = await mockExtraction(file);
            const isValid = validateFinancialContent(extractedText);

            if (isValid) {
                setPdfContext(extractedText);
                setMessages(prev => [...prev, { role: 'assistant', content: `Successfully loaded data from: ${file.name}. It is now available for analysis.` }]);
            } else {
                setPdfError(`The file "${file.name}" does not appear to be a financial document. Analysis cancelled.`);
                setMessages(prev => [...prev, { role: 'assistant', content: `I analyzed "${file.name}" but it doesn't look like a financial document (e.g., bank statement, receipt). Please upload a valid financial file.` }]);
                fileInputRef.current.value = null;
            }

        } catch (error) {
            console.error("PDF Parsing Error:", error);
            setPdfContext(null);
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: Could not process ${file.name}. Please ensure it is a valid PDF financial statement.` }]);
        } finally {
            setPdfLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // 🟢 UPDATED: handleSend now accepts an optional manualText argument
    const handleSend = async (e, manualText = null) => {
        if (e) e.preventDefault();

        let displayUserMessage = manualText || input.trim();

        if (!displayUserMessage && !pdfContext) return;

        if (!BASE_URL) {
            setMessages(prev => [...prev, { role: 'assistant', content: "System Error: API URL is not configured." }]);
            return;
        }

        if (!displayUserMessage && pdfContext) {
            displayUserMessage = "Analyze the uploaded financial data in the context.";
        }

        let promptContent = displayUserMessage;

        if (pdfContext) {
            promptContent = `[UPLOADED DATA]: ${pdfContext}\n\n[USER QUERY]: ${promptContent}`;
        }

        const userMessageToDisplay = { role: 'user', content: displayUserMessage };
        setMessages(prev => [...prev, userMessageToDisplay]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem("token");

            const historyWithNewMessage = [...messages, userMessageToDisplay];
            const conversationHistory = historyWithNewMessage
                .filter(m => m.role !== 'system')
                .slice(-6)
                .map(m => ({ role: m.role, content: m.content }));

            const finalPayloadHistory = [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                ...conversationHistory
            ];

            const res = await fetch(`${BASE_URL}/ai/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                },
                body: JSON.stringify({
                    message: promptContent,
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

    const clearChat = () => {
        setMessages([initialMessage]);
        localStorage.removeItem('aiChatHistory');
        setPdfContext(null);
        setPdfError(null);
    };

    const clearPdfContext = () => {
        setPdfContext(null);
        setPdfError(null);
        fileInputRef.current.value = null;
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
                                    <ReactMarkdown
                                        components={{
                                            strong: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mt-2 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mt-2 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
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
                                <span className="text-sm text-gray-500">{pdfLoading ? 'Scanning document for financial data...' : 'Analyzing your finances...'}</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">

                    {/* 🟢 SUCCESS MESSAGE (If PDF Valid) */}
                    {pdfContext && (
                        <div className="mb-3 p-2 flex items-center justify-between bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg text-sm">
                            <span className="font-medium flex items-center">
                                <Upload size={16} className="mr-2" />
                                Data Verified & Ready.
                            </span>
                            <button onClick={clearPdfContext} className="text-gray-500 hover:text-red-600 dark:text-green-400 dark:hover:text-red-400 p-1 rounded-full transition" title="Remove PDF Context">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* 🔴 ERROR MESSAGE (If Validation Fails) */}
                    {pdfError && (
                        <div className="mb-3 p-2 flex items-center justify-between bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 rounded-lg text-sm animate-in fade-in slide-in-from-bottom-2">
                            <span className="font-medium flex items-center">
                                <FileWarning size={16} className="mr-2" />
                                {pdfError}
                            </span>
                            <button onClick={() => setPdfError(null)} className="text-gray-500 hover:text-red-600 p-1 rounded-full transition">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* 🟢 NEW: Dynamic & Advanced Suggestion Chips */}
                    {/* Only show if not loading and user hasn't typed much yet */}
                    {!loading && !pdfLoading && input.length === 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-3 mb-1 custom-scrollbar mask-gradient">
                            {suggestions.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(null, chip.text)}
                                    className="group flex items-center whitespace-nowrap px-4 py-2 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm
                                             border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-medium text-gray-600 dark:text-gray-300
                                             hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600
                                             dark:hover:text-blue-300 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 animate-in slide-in-from-bottom-2 fade-in fill-mode-both"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <span className="mr-2 p-1 bg-white dark:bg-gray-700 rounded-full group-hover:bg-blue-200 dark:group-hover:bg-blue-800 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 transition-colors">
                                        {chip.icon}
                                    </span>
                                    {chip.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <form onSubmit={(e) => handleSend(e)} className="relative flex items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePDFUpload}
                            accept="application/pdf"
                            className="hidden"
                        />

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