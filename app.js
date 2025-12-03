// --- src/app.js (Revised) ---
const express = require("express");
const cors = require("cors");
const path = require("path"); // 🟢 CRITICAL: Import path module
const db = require("./config/db");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- API ROUTES MUST COME FIRST ---
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/ai", aiRoutes);

// ----------------------------------------------------------------------
// 🟢 CRITICAL FIX: SERVE FRONTEND STATIC FILES AND HANDLE ROUTING FALLBACK
// ----------------------------------------------------------------------

// Assume React build directory is 'client/build' relative to app.js
const FRONTEND_BUILD_PATH = path.join(__dirname, 'client/build');

// 1. Serve static files (Allows CSS/JS/images to load)
app.use(express.static(FRONTEND_BUILD_PATH));

// 2. Catch-all route for client-side routing (Handles /wallets, /budgets, etc.)
// MUST be the final route defined!
app.get('*', (req, res) => {
    // Note: The path here must match the static path + index.html
    res.sendFile(path.join(FRONTEND_BUILD_PATH, 'index.html'));
});

// ----------------------------------------------------------------------

const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
db.connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});