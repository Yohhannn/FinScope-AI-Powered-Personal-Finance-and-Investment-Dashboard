const express = require("express");
const cors = require("cors");
const db = require("./config/db");
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/dashboard", require("./routes/dashboardRoutes"));


// Routes
// We prefix routes with /api/auth to make it organized
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

// Connect DB and Start Server
db.connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});