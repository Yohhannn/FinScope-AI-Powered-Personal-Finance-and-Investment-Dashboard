const { AzureOpenAI } = require("openai");
const DashboardModel = require("../models/dashboardModel");
require("dotenv").config();

// Debug Logs (Check your terminal when you run this!)
console.log("--- Azure Configuration Check ---");
console.log("Endpoint:", process.env.AZURE_OPENAI_ENDPOINT ? "✅ Set" : "❌ Missing");
console.log("API Key:", process.env.AZURE_OPENAI_API_KEY ? "✅ Set" : "❌ Missing");
console.log("Deployment:", process.env.AZURE_OPENAI_DEPLOYMENT);
console.log("---------------------------------");

const client = new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    apiVersion: "2024-05-01-preview", // Try this stable version
});

const AIController = {
    chat: async (req, res) => {
        try {
            const { message, history } = req.body;
            const userId = req.user.user_id;

            // 1. GATHER CONTEXT
            const [wallets, budgets, goals, transactions] = await Promise.all([
                DashboardModel.getWallets(userId),
                DashboardModel.getPinnedBudgets(userId),
                DashboardModel.getGoals(userId),
                DashboardModel.getRecentTransactions(userId)
            ]);

            const financialContext = JSON.stringify({
                wallets: wallets.rows,
                budgets: budgets.rows,
                goals: goals.rows,
                recent_transactions: transactions.rows
            });

            const systemMessage = `
                You are FinScope AI. Use this financial data to answer the user:
                ${financialContext}
                Rules: Be concise. Do not output JSON.
            `;

            // 2. CALL AZURE
            // Note: In Azure, 'model' must be the Deployment Name
            const result = await client.chat.completions.create({
                messages: [
                    { role: "system", content: systemMessage },
                    ...(history || []),
                    { role: "user", content: message }
                ],
                model: process.env.AZURE_OPENAI_DEPLOYMENT, // 🟢 This must match your Azure Deployment Name
                max_tokens: 800,
                temperature: 0.7,
            });

            const botReply = result.choices[0].message.content;
            res.json({ reply: botReply });

        } catch (err) {
            // 🟢 DETAILED ERROR LOGGING
            console.error("❌ Azure AI Error Details:");
            console.error("Message:", err.message);
            console.error("Status:", err.status);
            console.error("Code:", err.code);

            res.status(500).json({ error: "Connection to AI failed. Check server logs." });
        }
    }
};

module.exports = AIController;
