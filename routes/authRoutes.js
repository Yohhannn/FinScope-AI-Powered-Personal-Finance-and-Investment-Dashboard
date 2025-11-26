const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

// Map URL endpoints to Controller functions
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

module.exports = router;