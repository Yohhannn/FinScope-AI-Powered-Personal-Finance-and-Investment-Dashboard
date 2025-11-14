🚀 FinScope
AI-Powered Personal Finance & Investment Dashboard
Smart Finance. Smarter Decisions. > Track your wallets, analyze market sentiment, and get AI-driven financial advice—all in one place.
📋 Project Overview
FinScope is a comprehensive web application designed to empower users to take control of their financial health. By integrating Artificial Intelligence with traditional financial tracking, FinScope helps you manage multiple wallets (bank, crypto, e-wallets), plan budgets, and analyze market trends for stocks and crypto in real-time.
✨ Key Features
💼 Wallet Management System: Track balances across multiple accounts and visualize spending with interactive charts.
🤖 AI Financial Advisor: Get personalized, GPT-powered advice on spending habits and saving strategies.
📉 Market Sentiment Dashboard: Analyze news headlines to gauge "Bullish" or "Bearish" market moods.
💰 Budget Planner: Set monthly limits and track savings goals with AI predictions.
📊 Real-Time Asset Tracking: Live prices for stocks and crypto via Yahoo Finance & CoinGecko APIs.
🛠️ Tech Stack
Frontend: React.js (Create React App), TailwindCSS
Backend: Node.js, Express.js
AI & APIs: Azure OpenAI / OpenAI GPT-4, FinBERT (Hugging Face), Yahoo Finance, CoinGecko
Database: MongoDB / PostgreSQL (Planned)
⚙️ Getting Started
Since the base project structure is already set up, follow these steps to install dependencies and get the application running.
1. Prerequisites
Make sure you have Node.js installed on your machine.
Check version: node -v (Should be v14 or higher)
Check npm: npm -v
2. Install Dependencies
You need to install libraries for both the backend and the frontend.
🔌 Backend Setup
Open your terminal and navigate to the backend folder:
cd backend


Install the server dependencies (Express, CORS, etc.):
npm install


💻 Frontend Setup
Open a new terminal (or go back/up a directory) and navigate to the frontend folder:
cd ../frontend


Install the React dependencies:
npm install


🚀 How to Run the App
You need to run the Backend and Frontend simultaneously.
Option A: Two Separate Terminals (Recommended)
Terminal 1 (Backend):
cd backend
npm start
# Output: Server running on http://localhost:5000


Terminal 2 (Frontend):
cd frontend
npm start
# Output: Starting the development server... (Opens http://localhost:3000)
