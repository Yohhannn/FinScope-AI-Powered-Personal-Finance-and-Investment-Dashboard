const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");
const authorize = require("../middleware/authMiddleware");

// Protected Route: Only logged in users can see this
router.get("/", authorize, DashboardController.getDashboardData);

module.exports = router;