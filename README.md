# README.md

---
title: "FinScope"
description: "AI-Powered Personal Finance & Investment Dashboard"
---

# 🚀 FinScope

**Smart Finance. Smarter Decisions.**  
Track your wallets, analyze market sentiment, and get AI-driven financial advice—all in one place.

---

## 📋 Project Overview

FinScope is a comprehensive web application designed to empower users to take control of their financial health. By integrating Artificial Intelligence with traditional financial tracking, FinScope helps you manage multiple wallets (bank, crypto, e-wallets), plan budgets, and analyze market trends for stocks and crypto in real-time.

---

## ✨ Key Features

- 💼 **Wallet Management System:** Track balances across multiple accounts and visualize spending with interactive charts.  
- 🤖 **AI Financial Advisor:** Get personalized, GPT-powered advice on spending habits and saving strategies.  
- 📉 **Market Sentiment Dashboard:** Analyze news headlines to gauge "Bullish" or "Bearish" market moods.  
- 💰 **Budget Planner:** Set monthly limits and track savings goals with AI predictions.  
- 📊 **Real-Time Asset Tracking:** Live prices for stocks and crypto via Yahoo Finance & CoinGecko APIs.  

---

## 🛠️ Tech Stack

- **Frontend:** React.js (Create React App), TailwindCSS  
- **Backend:** Node.js, Express.js  
- **AI & APIs:** Azure OpenAI / OpenAI GPT-4, FinBERT (Hugging Face), Yahoo Finance, CoinGecko  
- **Database:** MongoDB / PostgreSQL (Planned)  

---

## ⚙️ Getting Started

Follow these steps to install dependencies and run the application.

### 1. Prerequisites

Make sure Node.js and npm are installed:

```bash
node -v   # Should be v14 or higher
npm -v

## BACKEND

# Install backend dependencies
npm install
npm install express pg cors dotenv bcrypt jsonwebtoken
npm install @azure/openai @azure/core-auth

Setup .env file. (example is in there named .env.example

node server.js
# Server will run at http://localhost:5000



## FRONTEND



# Navigate to the frontend folder
cd frontend

# Install frontend dependencies
npm install
npm install react-router-dom
npm install recharts jspdf jspdf-autotable file-saver papaparse
npm install lucide-react


npm start
# Development server will start at http://localhost:3000


User,User ID,Email,Plaintext Password,BCrypt Hash (for securepass123)
Alice Smith,1,alice@example.com,password123,$2b$10$v4.k.7L7.E1jS1yX8.B2E.S4D8A6X9D7G3V8I3H1L2V9E6R7C4F1A3
Bob Johnson,2,bob@example.com,password123,$2b$10$W9M7Z8S6X5C4V3B2N1A0Q9P8O7I6U5Y4T3R2E1W0Q9A8S7D6F5G4H3
Charlie Davis,3,charlie@test.com,securepass123,$2b$10$T9R8Q7P6O5N4M3L2K1J0I9H8G7F6E5D4C3B2A1Z0Y9X8W7V6U5T4S3
Diana Evans,4,diana@test.com,securepass123,$2b$10$H7G8F9E0D1C2B3A4Z5Y6X7W8V9U0T1S2R3Q4P5O6N7M8L9K0J1I2H3G4
Ethan Green,5,ethan@test.com,securepass123,$2b$10$J0I9H8G7F6E5D4C3B2A1Z0Y9X8W7V6U5T4S3R2Q1P0O9N8M7L6K5J4I3
Fiona Hall,6,fiona@test.com,securepass123,$2b$10$K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8
Greg Jones,7,greg@test.com,securepass123,$2b$10$V6U5T4S3R2Q1P0O9N8M7L6K5J4I3H2G1F0E9D8C7B6A5Z4Y3X2W1V0U9