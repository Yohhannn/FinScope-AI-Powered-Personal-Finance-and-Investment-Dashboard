const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes"); // 🟢 NEW: Import AI Routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/ai", aiRoutes); // 🟢 NEW: Register AI Endpoint

const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
db.connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});