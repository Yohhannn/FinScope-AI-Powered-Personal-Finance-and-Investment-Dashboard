const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");
const authorize = require("../middleware/authMiddleware");

router.get("/", authorize, DashboardController.getDashboardData);
router.get("/budgets", authorize, DashboardController.getBudgetsAndGoals);
router.get("/market", authorize, DashboardController.getMarketData);
router.get("/categories", authorize, DashboardController.getCategories);

// Transactions
router.post("/transaction", authorize, DashboardController.addTransaction);
router.put("/transaction/:id", authorize, DashboardController.updateTransaction);
router.delete("/transaction/:id", authorize, DashboardController.deleteTransaction);

// Wallets
router.post("/wallet", authorize, DashboardController.addWallet);
router.put("/wallet/:id", authorize, DashboardController.updateWallet);

// Budgets
router.post("/budget", authorize, DashboardController.addBudget);
router.put("/budget/:id", authorize, DashboardController.updateBudget); // NEW
router.delete("/budget/:id", authorize, DashboardController.deleteBudget); // NEW

// Goals
router.post("/goal", authorize, DashboardController.addGoal);
router.put("/goal/:id", authorize, DashboardController.updateGoal); // NEW
router.delete("/goal/:id", authorize, DashboardController.deleteGoal); // NEW

// Categories
router.post("/category", authorize, DashboardController.addCategory);
router.put("/category/:id", authorize, DashboardController.updateCategory); // NEW
router.delete("/category/:id", authorize, DashboardController.deleteCategory); // NEW

module.exports = router;