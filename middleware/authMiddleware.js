const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
    // 1. Get token from header
    const token = req.header("Authorization");

    // 2. Check if no token
    if (!token) {
        return res.status(403).json({ error: "Access Denied. No token provided." });
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_super_secret_key");
        req.user = decoded; // Adds user_id to the request object
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid Token" });
    }
};