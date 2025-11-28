const DashboardModel = require("../models/dashboardModel");

const DashboardController = {
    // ==========================
    // 1. READ OPERATIONS
    // ==========================

    // 🟢 GET WALLET DETAILS
    getWalletDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const wallet = await DashboardModel.getWalletById(id, userId);
            if (wallet.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

            const transactions = await DashboardModel.getTransactionsByWalletId(id);

            res.json({
                wallet: wallet.rows[0],
                transactions: transactions.rows
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // 🟢 DASHBOARD OVERVIEW
// ... inside DashboardController ...

    // 🟢 DASHBOARD OVERVIEW
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // 1. AUTO-ROLLOVER: Check and update dates before fetching
            await DashboardModel.rolloverBudgets(userId);

            // 2. Now fetch data (It will now use the new dates)
            const wallets = await DashboardModel.getWallets(userId);
            // ... (rest of your code is unchanged)
            const totalBalance = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);
            const transactions = await DashboardModel.getRecentTransactions(userId);
            const pinnedBudgets = await DashboardModel.getPinnedBudgets(userId);
            const pinnedGoals = await DashboardModel.getPinnedGoals(userId);

            res.json({
                netWorth: totalBalance,
                wallets: wallets.rows,
                recentTransactions: transactions.rows,
                budgets: pinnedBudgets.rows,
                goals: pinnedGoals.rows
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getBudgetsAndGoals: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // 1. AUTO-ROLLOVER: Check and update dates
            await DashboardModel.rolloverBudgets(userId);

            // 2. Fetch
            const budgets = await DashboardModel.getBudgets(userId);
            const goals = await DashboardModel.getGoals(userId);
            res.json({ budgets: budgets.rows, goals: goals.rows });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },



    getBudgetHistory: async (req, res) => {
        try {
            const { id } = req.params;
            const history = await DashboardModel.getBudgetTransactions(id);
            res.json(history.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getMarketData: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const watchlist = await DashboardModel.getMarketWatchlist(userId);
            res.json(watchlist.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getCategories: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const categories = await DashboardModel.getCategories(userId);
            res.json(categories.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // ==========================
    // 2. TRANSACTIONS
    // ==========================
    addTransaction: async (req, res) => {
        try {
            const { name, amount, type, wallet_id, category_id, date, description } = req.body;
            const userId = req.user.user_id;

            if (!wallet_id || !amount) return res.status(400).json({ error: "Wallet and Amount required" });

            if (type === 'expense') {
                const walletResult = await DashboardModel.getWalletById(wallet_id, userId);
                if (walletResult.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                const currentBalance = parseFloat(walletResult.rows[0].balance);
                const expenseAmount = parseFloat(amount);

                if (expenseAmount > currentBalance) {
                    return res.status(400).json({
                        error: `Insufficient funds. Current balance: $${currentBalance.toLocaleString()}`
                    });
                }
            }

            const finalCategoryId = category_id ? parseInt(category_id) : null;
            const finalAmount = parseFloat(amount);

            const newTx = await DashboardModel.createTransaction({
                name, amount: finalAmount, type, wallet_id: parseInt(wallet_id), category_id: finalCategoryId, date, description: description || ''
            });

            const adjustment = type === 'expense' ? -Math.abs(finalAmount) : Math.abs(finalAmount);
            await DashboardModel.updateWalletBalance(parseInt(wallet_id), adjustment);

            res.json(newTx.rows[0]);
        } catch (err) {
            console.error("Add Transaction Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    deleteTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const tx = await DashboardModel.getTransactionById(id);
            if (tx.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });

            const { amount, type, wallet_id } = tx.rows[0];

            const reversal = type === 'expense' ? Math.abs(amount) : -Math.abs(amount);
            await DashboardModel.updateWalletBalance(wallet_id, reversal);

            await DashboardModel.deleteTransaction(id);
            res.json({ message: "Transaction deleted" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    updateTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, amount, type, wallet_id, category_id, date, description } = req.body;
            const userId = req.user.user_id;

            const oldTxResult = await DashboardModel.getTransactionById(id);
            if (oldTxResult.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
            const oldTx = oldTxResult.rows[0];

            if (type === 'expense') {
                const walletResult = await DashboardModel.getWalletById(wallet_id, userId);
                if (walletResult.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                let currentBalance = parseFloat(walletResult.rows[0].balance);

                if (oldTx.wallet_id === parseInt(wallet_id)) {
                    if (oldTx.type === 'expense') currentBalance += parseFloat(Math.abs(oldTx.amount));
                    else currentBalance -= parseFloat(Math.abs(oldTx.amount));
                }

                const newAmount = parseFloat(amount);
                if (newAmount > currentBalance) {
                    return res.status(400).json({
                        error: `Insufficient funds for update. Max available: $${currentBalance.toLocaleString()}`
                    });
                }
            }

            const oldReversal = oldTx.type === 'expense' ? Math.abs(oldTx.amount) : -Math.abs(oldTx.amount);
            await DashboardModel.updateWalletBalance(oldTx.wallet_id, oldReversal);

            const newAmount = parseFloat(amount);
            const newAdjustment = type === 'expense' ? -Math.abs(newAmount) : Math.abs(newAmount);
            await DashboardModel.updateWalletBalance(parseInt(wallet_id), newAdjustment);

            const result = await DashboardModel.updateTransaction(id, {
                name, amount: newAmount, type, wallet_id: parseInt(wallet_id), category_id: category_id ? parseInt(category_id) : null, date, description
            });

            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // ==========================
    // 3. WALLETS
    // ==========================
    addWallet: async (req, res) => {
        try {
            const { name, type, balance, purpose } = req.body;
            const newWallet = await DashboardModel.createWallet({
                name, type, balance: parseFloat(balance), purpose: purpose || '', userId: req.user.user_id
            });
            res.json(newWallet.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    updateWallet: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, balance, purpose } = req.body;
            const result = await DashboardModel.updateWallet(id, req.user.user_id, {
                name, type, balance: parseFloat(balance), purpose
            });
            if (result.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // ==========================
    // 4. BUDGETS
    // ==========================
// controllers/dashboardController.js

    // 🟢 ADD BUDGET (With Duplicate Check)
    addBudget: async (req, res) => {
        try {
            const { category_id, limit_amount, start_date, end_date } = req.body;
            const userId = req.user.user_id;

            // 1. Check for Duplicate Category
            const exists = await DashboardModel.checkBudgetExists(userId, category_id);
            if (exists) {
                return res.status(400).json({ error: "A budget for this category already exists." });
            }

            const newBudget = await DashboardModel.createBudget({
                userId,
                category_id: parseInt(category_id),
                limit_amount: parseFloat(limit_amount),
                start_date, end_date
            });
            res.json(newBudget.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 🟢 UPDATE BUDGET (With Duplicate Check & Category Update)
    updateBudget: async (req, res) => {
        try {
            const { id } = req.params; // budget_id
            const { limit_amount, start_date, end_date, category_id } = req.body;
            const userId = req.user.user_id;

            // 1. Check for Duplicate (Only if category is changing)
            // We need to know if the user is changing the category to one that ALREADY exists elsewhere
            // Logic: Is there a budget with this category_id that is NOT the current budget_id?
            const pool = require("../config/db.js").pool;
            const duplicateCheck = await pool.query(
                `SELECT * FROM budget WHERE user_id = $1 AND category_id = $2 AND budget_id != $3`,
                [userId, category_id, id]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({ error: "A budget for this category already exists." });
            }

            const result = await DashboardModel.updateBudget(id, {
                limit_amount: parseFloat(limit_amount),
                start_date,
                end_date,
                category_id: parseInt(category_id) // Pass this to model now
            });
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    deleteBudget: async (req, res) => {
        try {
            await DashboardModel.deleteBudget(req.params.id);
            res.json({ message: "Budget deleted" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    toggleBudgetPin: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_pinned } = req.body;
            await DashboardModel.toggleBudgetPin(id, is_pinned);
            res.json({ success: true });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // ==========================
    // 5. GOALS
    // ==========================

    // 🟢 ADD GOAL
// 🟢 ADD GOAL (Updated to record Initial Save history)
    addGoal: async (req, res) => {
        try {
            const { name, target_amount, current_amount, wallet_id } = req.body;
            const userId = req.user.user_id;
            const initialSave = parseFloat(current_amount) || 0;

            // 1. Validation Logic (Check Available Balance)
            if (wallet_id && initialSave > 0) {
                const wallet = await DashboardModel.getWalletById(wallet_id, userId);
                if (wallet.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                const availableBalance = parseFloat(wallet.rows[0].available_balance ?? wallet.rows[0].balance);

                if (initialSave > availableBalance) {
                    return res.status(400).json({
                        error: `Insufficient Available Funds. You have $${availableBalance}, trying to allocate $${initialSave}`
                    });
                }
            }

            // 2. Create the Goal
            const newGoalResult = await DashboardModel.createGoal({
                userId, name, target_amount: parseFloat(target_amount), current_amount: initialSave, wallet_id
            });
            const newGoal = newGoalResult.rows[0];

            // 🟢 3. If there was an initial save, record it in history
            if (initialSave > 0 && wallet_id) {
                const pool = require("../config/db.js").pool; // Ensure pool is imported
                await pool.query(
                    `INSERT INTO saving_goal_transaction (amount, transaction_date, goal_id, wallet_id) 
                     VALUES ($1, CURRENT_DATE, $2, $3)`,
                    [initialSave, newGoal.goal_id, wallet_id]
                );
            }

            res.json(newGoal);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 🟢 UPDATE GOAL
    updateGoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, target_amount, current_amount, wallet_id } = req.body;
            const newAmount = parseFloat(current_amount);

            if (wallet_id) {
                const wallet = await DashboardModel.getWalletById(wallet_id, req.user.user_id);
                if (wallet.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                const balance = parseFloat(wallet.rows[0].balance);
                const otherGoalsTotal = await DashboardModel.getOtherGoalsAllocation(wallet_id, id);

                if (otherGoalsTotal + newAmount > balance) {
                    return res.status(400).json({
                        error: `Cannot set amount to $${newAmount}. Wallet has $${balance}, and other goals use $${otherGoalsTotal}.`
                    });
                }
            }

            const result = await DashboardModel.updateGoal(id, {
                name, target_amount: parseFloat(target_amount), current_amount: newAmount, wallet_id
            });
            res.json(result.rows[0]);
        } catch (err) {
            console.error("Update Goal Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 🟢 CONTRIBUTE TO GOAL (Transactional)
    contributeToGoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { wallet_id, amount } = req.body;
            const userId = req.user.user_id;

            const newBalance = await DashboardModel.performGoalContribution(
                userId, id, wallet_id, amount
            );

            res.json({ message: "Contribution successful", new_wallet_balance: newBalance });
        } catch (err) {
            console.error(err);
            const statusCode = err.message.includes("Insufficient") ? 400 : 500;
            res.status(statusCode).json({ error: err.message });
        }
    },

    // 🟢 DELETE GOAL (Standard CRUD)
    deleteGoal: async (req, res) => {
        try {
            await DashboardModel.deleteGoal(req.params.id);
            res.json({ message: "Goal deleted" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 🟢 DELETE GOAL TRANSACTION (Revert)
    deleteGoalTransaction: async (req, res) => {
        try {
            const { id } = req.params; // The transaction_id
            const userId = req.user.user_id;

            await DashboardModel.deleteGoalTransaction(id, userId);

            res.json({ message: "Contribution reverted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    toggleGoalPin: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_pinned } = req.body;
            await DashboardModel.toggleGoalPin(id, is_pinned);
            res.json({ success: true });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // ==========================
    // 6. CATEGORIES
    // ==========================
    addCategory: async (req, res) => {
        try {
            const { name } = req.body;
            const result = await DashboardModel.createCategory({ name, userId: req.user.user_id });
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const result = await DashboardModel.updateCategory(id, name);
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },
    getGoalHistory: async (req, res) => {
        try {
            const { id } = req.params;
            const history = await DashboardModel.getGoalTransactions(id);
            res.json(history.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server Error" });
        }
    },

// ... inside dashboardController.js ...

    // ... inside DashboardController ...

    transferFunds: async (req, res) => {
        try {
            const { source_wallet_id, dest_wallet_id, amount, date } = req.body;
            const userId = req.user.user_id;

            if (source_wallet_id === dest_wallet_id) {
                return res.status(400).json({ error: "Cannot transfer to the same wallet." });
            }

            await DashboardModel.performWalletTransfer(
                userId, source_wallet_id, dest_wallet_id, amount, date || new Date()
            );

            res.json({ message: "Transfer successful" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // 1. Check if category is a Default System Category (Optional but recommended)
            // Assuming user_id 1 is Admin/System
            const categoryRes = await require("../config/db.js").query('SELECT user_id FROM category WHERE category_id = $1', [id]);

            if (categoryRes.rows.length === 0) return res.status(404).json({ error: "Category not found" });

            // Prevent deleting default categories (if they belong to user 1)
            if (categoryRes.rows[0].user_id === 1) {
                return res.status(403).json({ error: "Cannot delete system default categories." });
            }

            // 2. Attempt Delete
            // We ensure we only delete if it belongs to the logged-in user
            const result = await DashboardModel.deleteCategory(id, userId);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Category not found or unauthorized." });
            }

            res.json({ message: "Category deleted" });

        } catch (err) {
            // 🟢 Catch Foreign Key Constraint Violation (Postgres Code 23503)
            if (err.code === '23503') {
                return res.status(400).json({
                    error: "Cannot delete this category because it is being used in Transactions or Budgets."
                });
            }
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = DashboardController;