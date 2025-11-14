<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinScope - AI-Powered Personal Finance & Investment Dashboard</title>
    <style>
        :root {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --link-color: #58a6ff;
            --border-color: #30363d;
            --code-bg: #161b22;
            --header-bg: #161b22;
            --accent: #238636;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }

        h1, h2, h3 {
            color: #ffffff;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 0.3em;
            margin-top: 24px;
        }

        h1 { font-size: 2em; border-bottom: none; }
        h2 { font-size: 1.5em; }
        h3 { font-size: 1.25em; border-bottom: none; }

        a { color: var(--link-color); text-decoration: none; }
        a:hover { text-decoration: underline; }

        code {
            background-color: rgba(110, 118, 129, 0.4);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 85%;
        }

        pre {
            background-color: var(--code-bg);
            padding: 16px;
            overflow: auto;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }

        pre code {
            background-color: transparent;
            padding: 0;
            font-size: 100%;
        }

        blockquote {
            margin: 0;
            padding: 0 1em;
            color: #8b949e;
            border-left: 0.25em solid #30363d;
        }

        details {
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
        }

        summary {
            font-weight: bold;
            cursor: pointer;
        }

        .banner {
            width: 100%;
            height: auto;
            border-radius: 10px;
            margin-bottom: 20px;
            background-color: #21262d;
            text-align: center;
            padding: 40px 0;
            border: 1px solid var(--border-color);
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }

        .feature-card {
            background: var(--code-bg);
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid var(--border-color);
        }

        .terminals {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .terminal-window {
            flex: 1;
            min-width: 300px;
            background: #000;
            border-radius: 6px;
            border: 1px solid #30363d;
        }
        
        .terminal-header {
            background: #21262d;
            padding: 5px 10px;
            font-size: 12px;
            border-bottom: 1px solid #30363d;
            border-radius: 6px 6px 0 0;
        }
        
        .terminal-body {
            padding: 10px;
            font-family: monospace;
            color: #4af626;
        }

    </style>
</head>
<body>

    <div class="banner">
        <h1>🚀 FinScope</h1>
        <h3>AI-Powered Personal Finance & Investment Dashboard</h3>
        <p><em>Smart Finance. Smarter Decisions.</em></p>
    </div>

    <blockquote>
        Track your wallets, analyze market sentiment, and get AI-driven financial advice—all in one place.
    </blockquote>

    <h2>📋 Project Overview</h2>
    <p>
        <strong>FinScope</strong> is a comprehensive web application designed to empower users to take control of their financial health. By integrating Artificial Intelligence with traditional financial tracking, FinScope helps you manage multiple wallets (bank, crypto, e-wallets), plan budgets, and analyze market trends for stocks and crypto in real-time.
    </p>

    <h3>✨ Key Features</h3>
    <div class="features-grid">
        <div class="feature-card">
            <strong>💼 Wallet Management</strong><br>
            Track balances across multiple accounts and visualize spending.
        </div>
        <div class="feature-card">
            <strong>🤖 AI Financial Advisor</strong><br>
            Personalized, GPT-powered advice on spending habits.
        </div>
        <div class="feature-card">
            <strong>📉 Sentiment Dashboard</strong><br>
            Analyze news headlines to gauge "Bullish" or "Bearish" moods.
        </div>
        <div class="feature-card">
            <strong>💰 Budget Planner</strong><br>
            Set monthly limits and track savings goals with AI.
        </div>
        <div class="feature-card">
            <strong>📊 Asset Tracking</strong><br>
            Live prices via Yahoo Finance & CoinGecko APIs.
        </div>
    </div>

    <h2>⚙️ Getting Started</h2>
    
    <h3>1. Prerequisites</h3>
    <ul>
        <li><strong>Node.js</strong> (v14 or higher) - Check with <code>node -v</code></li>
        <li><strong>npm</strong> - Check with <code>npm -v</code></li>
    </ul>

    <h3>2. Install Dependencies</h3>
    <p>You need to install libraries for both the backend and frontend.</p>

    <h4>🔌 Backend Setup</h4>
    <pre><code>cd backend
npm install</code></pre>

    <h4>💻 Frontend Setup</h4>
    <pre><code>cd ../frontend
npm install</code></pre>

    <h2>🚀 How to Run the App</h2>
    <p>Run both terminals simultaneously:</p>

    <div class="terminals">
        <div class="terminal-window">
            <div class="terminal-header">Terminal 1 (Backend)</div>
            <div class="terminal-body">
                cd backend<br>
                npm start<br>
                <span style="color:#888"># Server running on port 5000</span>
            </div>
        </div>

        <div class="terminal-window">
            <div class="terminal-header">Terminal 2 (Frontend)</div>
            <div class="terminal-body">
                cd frontend<br>
                npm start<br>
                <span style="color:#888"># Opens http://localhost:3000</span>
            </div>
        </div>
    </div>

    <h2>📜 Project Configuration (YAML)</h2>
    <p>Below is the full project configuration.</p>

    <details open>
        <summary>View Configuration</summary>
        <pre><code class="language-yaml">project:
  name: "FinScope"
  title: "AI-Powered Personal Finance & Investment Dashboard"
  tagline: "Smart Finance. Smarter Decisions."
  description: >-
    Track your wallets, analyze market sentiment, and get AI-driven financial advice—all in one place.

tech_stack:
  frontend: 
    - "React.js (Create React App)"
    - "TailwindCSS"
  backend: 
    - "Node.js"
    - "Express.js"
  ai_and_apis: 
    - "Azure OpenAI / OpenAI GPT-4"
    - "FinBERT"
    - "Yahoo Finance"
    - "CoinGecko"

configuration:
  env_file_location: "backend/.env"
  required_variables:
    PORT: 5000
    OPENAI_API_KEY: "your_openai_key_here"
    COINGECKO_API_KEY: "your_coingecko_key_here"
    DATABASE_URL: "your_database_connection_string"

roadmap:
  - status: "pending"
    task: "Smart Notifications (Budget alerts)"
  - status: "pending"
    task: "Dark Mode UI"
  - status: "pending"
    task: "Mobile App (React Native)"</code></pre>
    </details>

    <hr>
    <p style="text-align: center; color: #8b949e;">Made with ❤️ by the FinScope Team</p>

</body>
</html>
