const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// ============================================
// 🛠️ FIX: Robust CORS Configuration
// ============================================
const allowedOrigins = [
    "https://finscope.dev",          // Your Production Frontend
    "https://www.finscope.dev",      // www subdomain (just in case)
    "http://localhost:5173",         // Local Development (Vite)
    "http://localhost:3000"          // Local Development (Create React App)
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true // Required if you ever use Cookies/Sessions
}));

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
db.connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });

    // Optional: Increase Node.js server timeout to match DigitalOcean's LB (60s)
    // This helps prevent premature disconnects, though it won't fix a stuck DB lock.
    server.timeout = 60000;
});