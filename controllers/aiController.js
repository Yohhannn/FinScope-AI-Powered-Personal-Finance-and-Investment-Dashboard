const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
require("dotenv").config();

// 🟢 FIX: Robust Database Import
// This handles cases where db.js exports just the pool OR an object { pool }
const db = require("../config/db");
const pool = db.pool || db;

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

const AuthController = {
    // ==========================
    // 1. REGISTER
    // ==========================
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await UserModel.createUser(name, email, hashedPassword);

            res.status(201).json({ message: "Registration successful! Please log in." });
        } catch (err) {
            console.error("Register Error:", err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // ==========================
    // 2. LOGIN
    // ==========================
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            const token = jwt.sign(
                { user_id: user.user_id, email: user.email },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({
                message: "Login successful",
                token,
                user: { id: user.user_id, name: user.name, email: user.email },
            });
        } catch (err) {
            console.error("Login Error:", err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // ==========================
    // 3. UPDATE PROFILE (Fixed)
    // ==========================
    updateProfile: async (req, res) => {
        console.log("👉 Attempting Profile Update..."); // Debug Log
        try {
            const { name, email } = req.body;

            // Check if req.user exists (Middleware check)
            if (!req.user || !req.user.user_id) {
                console.error("❌ No User ID found in request. Middleware issue?");
                return res.status(401).json({ error: "Unauthorized" });
            }

            const userId = req.user.user_id;
            console.log(`User ID: ${userId}, New Name: ${name}, New Email: ${email}`);

            // Direct DB update
            const updateQuery = `
                UPDATE users 
                SET name = $1, email = $2 
                WHERE user_id = $3 
                RETURNING user_id, name, email
            `;

            // Check if pool exists before querying
            if (!pool) {
                throw new Error("Database pool is undefined. Check config/db.js");
            }

            const result = await pool.query(updateQuery, [name, email, userId]);

            if (result.rows.length === 0) {
                console.log("❌ Update failed: User ID not found in DB.");
                return res.status(404).json({ error: "User not found" });
            }

            console.log("✅ Profile Updated Successfully");
            res.json({ user: result.rows[0], message: "Profile updated successfully" });

        } catch (err) {
            console.error("❌ Update Profile Error:", err); // Prints full error object
            res.status(500).json({ error: "Server error updating profile. Check server logs." });
        }
    },

    // ==========================
    // 4. CHANGE PASSWORD
    // ==========================
    changePassword: async (req, res) => {
        console.log("👉 Attempting Password Change...");
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.user_id;

            // 1. Get current hashed password
            const userResult = await pool.query("SELECT password FROM users WHERE user_id = $1", [userId]);
            if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

            // 2. Verify current password
            const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password);
            if (!validPassword) {
                console.log("❌ Password Change Failed: Incorrect Current Password");
                return res.status(401).json({ error: "Incorrect current password." });
            }

            // 3. Hash new password
            const salt = await bcrypt.genSalt(10);
            const newHashedPassword = await bcrypt.hash(newPassword, salt);

            // 4. Update DB
            await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [newHashedPassword, userId]);

            console.log("✅ Password Changed Successfully");
            res.json({ message: "Password changed successfully" });
        } catch (err) {
            console.error("❌ Change Password Error:", err);
            res.status(500).json({ error: "Server error changing password" });
        }
    }
};

module.exports = AuthController;