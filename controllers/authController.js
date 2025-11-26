const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../models/userModel");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your_super_secret_key";

const AuthController = {
    // REGISTER LOGIC
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            // 1. Check if user exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({ error: "User already exists" });
            }

            // 2. Hash Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // 3. Create User in DB
            await UserModel.createUser(name, email, hashedPassword);

            res.status(201).json({ message: "Registration successful! Please log in." });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // LOGIN LOGIC
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // 1. Check User
            const user = await UserModel.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            // 2. Validate Password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: "Invalid email or password" });
            }

            // 3. Generate Token
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
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },
};

module.exports = AuthController;