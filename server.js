const express = require('express');
const cors = require('cors');
// 1. Import the router file you showed me
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes'); // Assuming you have an auth router too
const aiRoutes = require('./routes/aiRoutes'); // Assuming you have an AI router

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Body parser for JSON payloads
app.use(cors()); // Enable CORS for frontend communication

// --- CRITICAL ROUTING SETUP ---

// 2. Map the Auth Router (e.g., /api/auth/login)
// Frontend call: BASE_URL/auth/login
app.use('/api/auth', authRoutes);

// 3. Map the Dashboard Router (e.g., /api/dashboard/transactions)
// Frontend calls: BASE_URL/dashboard/transactions, BASE_URL/dashboard/wallet/:id, etc.
app.use('/api/dashboard', dashboardRoutes);

// 4. Map the AI Router (e.g., /api/ai/chat)
// Frontend calls: BASE_URL/ai/chat
app.use('/api/ai', aiRoutes);

// ------------------------------

// Root route (optional)
app.get('/', (req, res) => {
    res.send('FinScope API is running.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// NOTE: You must ensure the files authRoutes.js and aiRoutes.js exist and export
// their respective Express routers, similar to dashboardRoutes.js.