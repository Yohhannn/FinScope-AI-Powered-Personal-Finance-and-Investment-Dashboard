const express = require("express");
const router = express.Router();
const AIController = require("../controllers/aiController");
const authorize = require("../middleware/authMiddleware");

// POST /api/ai/chat
router.post("/chat", authorize, AIController.chat);

module.exports = router;