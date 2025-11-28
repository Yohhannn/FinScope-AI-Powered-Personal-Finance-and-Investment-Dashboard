const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/dashboardController");
const authorize = require("../middleware/authMiddleware");

// ==========================
// 1. READS
// ==========================
router.get("/", authorize, DashboardController.getDashboardData);
router.get("/budgets", authorize, DashboardController.getBudgetsAndGoals);
router.get("/market", authorize, DashboardController.getMarketData);
router.get("/categories", authorize, DashboardController.getCategories);
router.get("/wallet/:id", authorize, DashboardController.getWalletDetails);

// ==========================
// 2. TRANSACTIONS
// ==========================
router.post("/transaction", authorize, DashboardController.addTransaction);
router.put("/transaction/:id", authorize, DashboardController.updateTransaction);
router.delete("/transaction/:id", authorize, DashboardController.deleteTransaction);

// ==========================
// 3. WALLETS
// ==========================
router.post("/wallet", authorize, DashboardController.addWallet);
router.put("/wallet/:id", authorize, DashboardController.updateWallet);

// ==========================
// 4. BUDGETS
// ==========================
router.post("/budget", authorize, DashboardController.addBudget);
router.put("/budget/:id", authorize, DashboardController.updateBudget);
router.delete("/budget/:id", authorize, DashboardController.deleteBudget);
router.put("/budget/:id/pin", authorize, DashboardController.toggleBudgetPin);

// ==========================
// 5. GOALS
// ==========================
router.post("/goal", authorize, DashboardController.addGoal);
router.put("/goal/:id", authorize, DashboardController.updateGoal);
router.delete("/goal/:id", authorize, DashboardController.deleteGoal);
router.put("/goal/:id/pin", authorize, DashboardController.toggleGoalPin);
router.post("/goal/:id/contribute", authorize, DashboardController.contributeToGoal); // 🟢 NEW: Fixes the 404 error

// ==========================
// 6. CATEGORIES
// ==========================
router.post("/category", authorize, DashboardController.addCategory);
router.put("/category/:id", authorize, DashboardController.updateCategory);
router.delete("/category/:id", authorize, DashboardController.deleteCategory);

module.exports = router;