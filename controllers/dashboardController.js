const DashboardModel = require("../models/dashboardModel");

const DashboardController = {
    // ==========================
    // 1. READ OPERATIONS
    // ==========================

    // 🟢 GET WALLET DETAILS (Required for the Wallet Popup)
    getWalletDetails: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // 1. Verify Wallet belongs to user
            const wallet = await DashboardModel.getWalletById(id, userId);
            if (wallet.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

            // 2. Get History
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

    // 🟢 DASHBOARD OVERVIEW (With Pinned Items Logic)
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // Wallets & Net Worth
            const wallets = await DashboardModel.getWallets(userId);
            const totalBalance = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

            // Recent Transactions
            const transactions = await DashboardModel.getRecentTransactions(userId);

            // Pinned Items (Only fetches pinned items for the dashboard view)
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
            const budgets = await DashboardModel.getBudgets(userId);
            const goals = await DashboardModel.getGoals(userId);
            res.json({ budgets: budgets.rows, goals: goals.rows });
        } catch (err) {
            console.error(err.message);
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

            // 🟢 VALIDATION: Check Insufficient Funds
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

            // Create Tx
            const newTx = await DashboardModel.createTransaction({
                name, amount: finalAmount, type, wallet_id: parseInt(wallet_id), category_id: finalCategoryId, date, description: description || ''
            });

            // Update Balance
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

            // Revert Balance
            const reversal = type === 'expense' ? Math.abs(amount) : -Math.abs(amount);
            await DashboardModel.updateWalletBalance(wallet_id, reversal);

            // Delete Tx
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

            // 1. Get Old Tx
            const oldTxResult = await DashboardModel.getTransactionById(id);
            if (oldTxResult.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
            const oldTx = oldTxResult.rows[0];

            // 🟢 VALIDATION: Check Balance for Update
            if (type === 'expense') {
                const walletResult = await DashboardModel.getWalletById(wallet_id, userId);
                if (walletResult.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                let currentBalance = parseFloat(walletResult.rows[0].balance);

                // Calculate effective balance (refund old tx first)
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

            // 2. Revert Old Balance
            const oldReversal = oldTx.type === 'expense' ? Math.abs(oldTx.amount) : -Math.abs(oldTx.amount);
            await DashboardModel.updateWalletBalance(oldTx.wallet_id, oldReversal);

            // 3. Apply New Balance
            const newAmount = parseFloat(amount);
            const newAdjustment = type === 'expense' ? -Math.abs(newAmount) : Math.abs(newAmount);
            await DashboardModel.updateWalletBalance(parseInt(wallet_id), newAdjustment);

            // 4. Update Tx
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
            const newBudget = await DashboardModel.createBudget({
                userId: req.user.user_id,
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
            const { limit_amount, start_date, end_date } = req.body;
            const result = await DashboardModel.updateBudget(id, {
                limit_amount: parseFloat(limit_amount), start_date, end_date
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
// ... inside DashboardController ...

    // 🟢 ADD GOAL (With Validation)
    addGoal: async (req, res) => {
        try {
            const { name, target_amount, current_amount, wallet_id } = req.body;
            const userId = req.user.user_id;
            const initialSave = parseFloat(current_amount) || 0;

            // 1. Validate Wallet Balance
            if (wallet_id && initialSave > 0) {
                const wallet = await DashboardModel.getWalletById(wallet_id, userId);
                if (wallet.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });

                const balance = parseFloat(wallet.rows[0].balance);
                const allocated = await DashboardModel.getWalletAllocatedTotal(wallet_id);

                // Check: (Existing Allocated + New Goal Initial Save) vs Balance
                if (allocated + initialSave > balance) {
                    return res.status(400).json({
                        error: `Insufficient Wallet Balance. Wallet: $${balance}, Allocated: $${allocated}, New: $${initialSave}`
                    });
                }
            }

            const newGoal = await DashboardModel.createGoal({
                userId, name, target_amount: parseFloat(target_amount), current_amount: initialSave, wallet_id
            });
            res.json(newGoal.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 🟢 UPDATE GOAL (With Edit Validation)
    updateGoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, target_amount, current_amount, wallet_id } = req.body;
            const newAmount = parseFloat(current_amount);

            // 1. Validation Logic
            if (wallet_id) {
                // Get Wallet Details
                const wallet = await DashboardModel.getWalletById(wallet_id, req.user.user_id);
                const balance = parseFloat(wallet.rows[0].balance);

                // Get Total Allocated (EXCLUDING this current goal to avoid double counting)
                const result = await db.query(
                    `SELECT COALESCE(SUM(current_amount), 0) as total FROM saving_goal WHERE wallet_id = $1 AND goal_id != $2`,
                    [wallet_id, id]
                );
                const otherGoalsTotal = parseFloat(result.rows[0].total);

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
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 🟢 CONTRIBUTE TO GOAL (With Allocation Validation)
    contributeToGoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { wallet_id, amount } = req.body;
            const contribution = parseFloat(amount);

            // Get Wallet Info
            const wallet = await DashboardModel.getWalletById(wallet_id, req.user.user_id);
            const balance = parseFloat(wallet.rows[0].balance);

            // Get ALL allocated amounts for this wallet
            const allocated = await DashboardModel.getWalletAllocatedTotal(wallet_id);

            // VALIDATION:
            // Does (Already Allocated + New Contribution) exceed Wallet Balance?
            if (allocated + contribution > balance) {
                return res.status(400).json({
                    error: `Insufficient funds. Wallet: $${balance}, Already Allocated: $${allocated}. Max you can add: $${balance - allocated}`
                });
            }

            await DashboardModel.incrementGoalAmount(id, contribution);
            res.json({ message: "Funds allocated successfully" });
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
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

    deleteCategory: async (req, res) => {
        try {
            await DashboardModel.deleteCategory(req.params.id);
            res.json({ message: "Category deleted" });
        } catch (err) {
            if(err.code === '23503') return res.status(400).json({ error: "Cannot delete: Category is in use." });
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = DashboardController;