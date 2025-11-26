const db = require("../config/db.js");

const DashboardController = {
    // 1. DASHBOARD OVERVIEW
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id;

            // Wallets
            const wallets = await db.query('SELECT * FROM wallet WHERE user_id = $1 ORDER BY balance DESC', [userId]);
            const totalBalance = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

            // Recent Transactions
            const transactions = await db.query(`
                SELECT t.*, w.name as wallet_name, c.name as category_name
                FROM transaction t
                         JOIN wallet w ON t.wallet_id = w.wallet_id
                         LEFT JOIN category c ON t.category_id = c.category_id
                WHERE w.user_id = $1
                ORDER BY t.transaction_date DESC LIMIT 5
            `, [userId]);

            res.json({
                netWorth: totalBalance,
                wallets: wallets.rows,
                recentTransactions: transactions.rows
            });
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    },

    // 2. BUDGETS & GOALS
    getBudgetsAndGoals: async (req, res) => {
        try {
            const userId = req.user.user_id;

            const budgets = await db.query(`
                SELECT b.*, c.name as category_name,
                       (SELECT COALESCE(SUM(ABS(amount)), 0)
                        FROM transaction t
                        WHERE t.category_id = b.category_id
                          AND t.type = 'expense'
                          AND t.transaction_date BETWEEN b.start_date AND b.end_date
                       ) as spent
                FROM budget b
                         JOIN category c ON b.category_id = c.category_id
                WHERE b.user_id = $1
            `, [userId]);

            const goals = await db.query('SELECT * FROM saving_goal WHERE user_id = $1', [userId]);

            res.json({ budgets: budgets.rows, goals: goals.rows });
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    },

    // 3. MARKET WATCHLIST
    getMarketData: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const watchlist = await db.query(`
        SELECT a.* FROM asset a
        JOIN user_watchlist uw ON a.asset_id = uw.asset_id
        WHERE uw.user_id = $1
      `, [userId]);
            res.json(watchlist.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    },

    // 4. GET CATEGORIES
    getCategories: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const categories = await db.query('SELECT * FROM category WHERE user_id = $1', [userId]);
            res.json(categories.rows);
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server Error");
        }
    },

    // 5. ADD TRANSACTION
    addTransaction: async (req, res) => {
        try {
            const { name, amount, type, wallet_id, category_id, date, description } = req.body;

            if (!wallet_id) return res.status(400).json({ error: "Wallet is required" });
            if (!amount) return res.status(400).json({ error: "Amount is required" });

            const finalCategoryId = category_id ? parseInt(category_id) : null;

            const newTx = await db.query(
                `INSERT INTO transaction (name, amount, type, wallet_id, category_id, transaction_date, description) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [name, parseFloat(amount), type, parseInt(wallet_id), finalCategoryId, date, description || '']
            );

            const adjustment = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
            await db.query(`UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`, [adjustment, parseInt(wallet_id)]);

            res.json(newTx.rows[0]);
        } catch (err) {
            console.error("Add Transaction Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 6. DELETE TRANSACTION
    deleteTransaction: async (req, res) => {
        try {
            const { id } = req.params;

            const tx = await db.query('SELECT * FROM transaction WHERE transaction_id = $1', [id]);
            if (tx.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });

            const { amount, type, wallet_id } = tx.rows[0];
            const reversal = type === 'expense' ? Math.abs(amount) : -Math.abs(amount);

            await db.query(`UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`, [reversal, wallet_id]);
            await db.query('DELETE FROM transaction WHERE transaction_id = $1', [id]);

            res.json({ message: "Transaction deleted" });
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 7. UPDATE TRANSACTION
    updateTransaction: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, amount, type, wallet_id, category_id, date, description } = req.body;

            const oldTx = await db.query('SELECT * FROM transaction WHERE transaction_id = $1', [id]);
            if (oldTx.rows.length === 0) return res.status(404).json({ error: "Transaction not found" });
            const old = oldTx.rows[0];

            const oldReversal = old.type === 'expense' ? Math.abs(old.amount) : -Math.abs(old.amount);
            await db.query(`UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`, [oldReversal, old.wallet_id]);

            const newAdjustment = type === 'expense' ? -Math.abs(parseFloat(amount)) : Math.abs(parseFloat(amount));
            await db.query(`UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`, [newAdjustment, parseInt(wallet_id)]);

            const result = await db.query(
                `UPDATE transaction SET name=$1, amount=$2, type=$3, wallet_id=$4, category_id=$5, transaction_date=$6, description=$7 
         WHERE transaction_id=$8 RETURNING *`,
                [name, parseFloat(amount), type, parseInt(wallet_id), category_id ? parseInt(category_id) : null, date, description, id]
            );

            res.json(result.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 8. ADD WALLET
    addWallet: async (req, res) => {
        try {
            const { name, type, balance, purpose } = req.body;
            const userId = req.user.user_id;

            const newWallet = await db.query(
                `INSERT INTO wallet (name, type, balance, purpose, user_id) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [name, type, parseFloat(balance), purpose || '', userId]
            );

            res.json(newWallet.rows[0]);
        } catch (err) {
            console.error("Add Wallet Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 9. UPDATE WALLET
    updateWallet: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, type, balance, purpose } = req.body;
            const userId = req.user.user_id;

            const result = await db.query(
                `UPDATE wallet SET name = $1, type = $2, balance = $3, purpose = $4
         WHERE wallet_id = $5 AND user_id = $6 RETURNING *`,
                [name, type, parseFloat(balance), purpose, id, userId]
            );

            if (result.rows.length === 0) return res.status(404).json({ error: "Wallet not found" });
            res.json(result.rows[0]);
        } catch (err) {
            console.error("Update Wallet Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    // 10. ADD BUDGET
    addBudget: async (req, res) => {
        try {
            const { category_id, limit_amount, start_date, end_date } = req.body;
            const userId = req.user.user_id;

            const newBudget = await db.query(
                `INSERT INTO budget (user_id, category_id, limit_amount, start_date, end_date)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [userId, parseInt(category_id), parseFloat(limit_amount), start_date, end_date]
            );
            res.json(newBudget.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 11. ADD GOAL
    addGoal: async (req, res) => {
        try {
            const { name, target_amount } = req.body;
            const userId = req.user.user_id;

            const newGoal = await db.query(
                `INSERT INTO saving_goal (user_id, name, target_amount, current_amount)
                 VALUES ($1, $2, $3, 0) RETURNING *`,
                [userId, name, parseFloat(target_amount)]
            );
            res.json(newGoal.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // 12. ADD CATEGORY (🟢 NEW)
    addCategory: async (req, res) => {
        try {
            const { name } = req.body;
            const userId = req.user.user_id;

            const newCat = await db.query(
                `INSERT INTO category (name, user_id) VALUES ($1, $2) RETURNING *`,
                [name, userId]
            );
            res.json(newCat.rows[0]);
        } catch (err) {
            console.error("Add Category Error:", err.message);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = DashboardController;