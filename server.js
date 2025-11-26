const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const db = require("./config/db"); // Imports { query, connectDB }

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

// ==========================
// 1. REGISTER ROUTE
// ==========================
app.post("/register", async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user exists
        const userExist = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        await db.query(
            'INSERT INTO "user" (name, email, password) VALUES ($1, $2, $3)',
            [name, email, hashedPassword]
        );

        // RETURN SUCCESS (No token, so user must log in)
        res.json({ message: "Registration successful! Please log in." });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ==========================
// 2. LOGIN ROUTE
// ==========================
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const result = await db.query('SELECT * FROM "user" WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = result.rows[0];

        // CHECK PASSWORD (The Secure Way)
        // This compares the plain text password with the encrypted hash in DB
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Generate Token
        const token = jwt.sign(
            { user_id: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: { id: user.user_id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 5000;
db.connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});