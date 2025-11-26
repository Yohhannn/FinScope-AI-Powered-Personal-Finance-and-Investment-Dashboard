const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");
const authorize = require("../middleware/authMiddleware");

router.get("/", authorize, DashboardController.getDashboardData);
router.get("/budgets", authorize, DashboardController.getBudgetsAndGoals);
router.get("/market", authorize, DashboardController.getMarketData);
router.get("/categories", authorize, DashboardController.getCategories);

router.post("/transaction", authorize, DashboardController.addTransaction);
router.put("/transaction/:id", authorize, DashboardController.updateTransaction);
router.delete("/transaction/:id", authorize, DashboardController.deleteTransaction);

router.post("/wallet", authorize, DashboardController.addWallet);
router.put("/wallet/:id", authorize, DashboardController.updateWallet);

router.post("/budget", authorize, DashboardController.addBudget);
router.post("/goal", authorize, DashboardController.addGoal);
router.post("/category", authorize, DashboardController.addCategory); // 🟢 NEW

module.exports = router;