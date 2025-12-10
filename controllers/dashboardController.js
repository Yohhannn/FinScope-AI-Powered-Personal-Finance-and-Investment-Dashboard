const DashboardModel = require("../models/dashboardModel");
const db = require("../config/db.js"); // Assuming this exports the 'pool'

const DashboardController = {
    // ==========================
    // 1. READ OPERATIONS
    // ==========================

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

    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // 1. Fetch Wallets (Current Net Worth)
            const wallets = await DashboardModel.getWallets(userId);
            const currentNetWorth = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

            // 2. Fetch Monthly Flow
            const flowResult = await DashboardModel.getMonthlyNetFlow(userId);
            const income = parseFloat(flowResult.rows[0].total_income || 0);
            const expense = parseFloat(flowResult.rows[0].total_expense || 0);

            const netChange = income - expense;
            const startOfMonthNetWorth = currentNetWorth - netChange;

            let percentageChange = 0;
            if (startOfMonthNetWorth !== 0) {
                percentageChange = ((currentNetWorth - startOfMonthNetWorth) / Math.abs(startOfMonthNetWorth)) * 100;
            } else if (currentNetWorth > 0) {
                percentageChange = 100;
            }

            const transactions = await DashboardModel.getRecentTransactions(userId);
            const pinnedBudgets = await DashboardModel.getPinnedBudgets(userId);
            const pinnedGoals = await DashboardModel.getPinnedGoals(userId);

            res.json({
                netWorth: currentNetWorth,
                netWorthChange: percentageChange.toFixed(1),
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
            await DashboardModel.rolloverBudgets(userId);
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
            const userId = req.user.user_id;
            const history = await DashboardModel.getBudgetTransactions(id, userId);
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
    addBudget: async (req, res) => {
        try {
            const { category_id, limit_amount, start_date, end_date } = req.body;
            const userId = req.user.user_id;

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

    updateBudget: async (req, res) => {
        try {
            const { id } = req.params;
            const { limit_amount, start_date, end_date, category_id } = req.body;
            const userId = req.user.user_id;

            const duplicateCheck = await DashboardModel.checkBudgetExistsForUpdate(userId, category_id, id);

            if (duplicateCheck.rows.length > 0) {
                return res.status(400).json({ error: "A budget for this category already exists." });
            }

            const result = await DashboardModel.updateBudget(id, {
                limit_amount: parseFloat(limit_amount),
                start_date,
                end_date,
                category_id: parseInt(category_id)
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

    addGoal: async (req, res) => {
        try {
            const { name, target_amount, current_amount, wallet_id } = req.body;
            const userId = req.user.user_id;
            const initialSave = parseFloat(current_amount) || 0;

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

            const newGoalResult = await DashboardModel.createGoal({
                userId,
                name,
                target_amount: parseFloat(target_amount),
                current_amount: initialSave,
                wallet_id
            });
            const newGoal = newGoalResult.rows[0];

            if (initialSave > 0 && wallet_id) {
                await DashboardModel.createGoalTransaction(
                    initialSave,
                    newGoal.goal_id,
                    wallet_id,
                    true
                );
                await DashboardModel.updateWalletBalance(parseInt(wallet_id), -Math.abs(initialSave));
            }

            res.json(newGoal);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    // 🟢 UPDATED: TRANSACTIONAL STATUS UPDATE
    updateGoalStatus: async (req, res) => {
        const client = await db.connect(); // Get a client for transaction
        try {
            const { id } = req.params;
            const { status } = req.body; // 'completed', 'active', etc.

            // 1. Start Transaction
            await client.query('BEGIN');

            // 2. Fetch Goal
            const goalResult = await client.query('SELECT * FROM goals WHERE goal_id = $1', [id]);
            const goal = goalResult.rows[0];

            if (!goal) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: "Goal not found" });
            }

            // 3. Logic: If marking as COMPLETED, deduct funds from Wallet
            if (status === 'completed' && goal.status !== 'completed') {
                if (goal.wallet_id) {
                    // Check Wallet
                    const walletRes = await client.query('SELECT balance FROM wallets WHERE wallet_id = $1', [goal.wallet_id]);
                    const wallet = walletRes.rows[0];

                    if (!wallet) {
                        await client.query('ROLLBACK');
                        return res.status(404).json({ error: "Assigned wallet not found" });
                    }

                    const cost = parseFloat(goal.target_amount); // Deduct full cost

                    if (parseFloat(wallet.balance) < cost) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: `Insufficient funds in wallet to complete this goal. Needed: $${cost}` });
                    }

                    // Deduct Money
                    await client.query('UPDATE wallets SET balance = balance - $1 WHERE wallet_id = $2', [cost, goal.wallet_id]);

                    // Optional: Create a Transaction Record so it shows in history
                    // (Assuming you have a transactions table)
                    await client.query(`
                        INSERT INTO transactions (user_id, wallet_id, amount, type, description, date)
                        VALUES ($1, $2, $3, 'expense', $4, NOW())
                    `, [req.user.user_id, goal.wallet_id, cost, `Goal Completed: ${goal.name}`]);
                }
            }

            // 4. Update Status
            const updateResult = await client.query(
                `UPDATE goals SET status = $1 WHERE goal_id = $2 RETURNING *`,
                [status, id]
            );

            // 5. Commit
            await client.query('COMMIT');

            res.json({ success: true, goal: updateResult.rows[0] });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error("Update Goal Status Error:", err.message);
            res.status(500).json({ error: "Server Error during transaction" });
        } finally {
            client.release();
        }
    },

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

    deleteGoal: async (req, res) => {
        try {
            await DashboardModel.deleteGoal(req.params.id);
            res.json({ message: "Goal deleted" });
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: err.message });
        }
    },

    deleteGoalTransaction: async (req, res) => {
        try {
            const { id } = req.params;
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
            const userId = req.user.user_id;

            const existing = await DashboardModel.checkCategoryExists(userId, name);
            if (existing) {
                return res.status(400).json({ error: "Category already exists" });
            }

            const result = await DashboardModel.createCategory({ name, userId });
            res.json(result.rows[0]);
        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
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

    getAnalyticsData: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const transactions = await DashboardModel.getAllTransactions(userId);
            res.json(transactions.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server Error" });
        }
    },

    getAllTransactions: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const transactions = await DashboardModel.getAllTransactions(userId);
            res.json(transactions.rows);
        } catch (err) {
            console.error("Error fetching all transactions:", err.message);
            res.status(500).json({ error: "Server Error" });
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const categoryRes = await DashboardModel.getCategoryOwnerId(id);
            if (categoryRes.rows.length === 0) return res.status(404).json({ error: "Category not found" });

            if (categoryRes.rows[0].user_id === 1) {
                return res.status(403).json({ error: "Cannot delete system default categories." });
            }

            const result = await DashboardModel.deleteCategory(id, userId);
            if (result.rowCount === 0) {
                return res.status(404).json({ error: "Category not found or unauthorized." });
            }

            res.json({ message: "Category deleted" });

        } catch (err) {
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