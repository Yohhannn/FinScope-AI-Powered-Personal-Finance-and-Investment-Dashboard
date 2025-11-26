const db = require("../config/db.js");

const DashboardController = {
    // 1. DASHBOARD OVERVIEW (Updated Sort Order)
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const wallets = await db.query('SELECT * FROM wallet WHERE user_id = $1 ORDER BY balance DESC', [userId]);
            const totalBalance = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

            // 🟢 UPDATED SORT: Date DESC + Created Time DESC
            const transactions = await db.query(`
                SELECT t.*, w.name as wallet_name, c.name as category_name
                FROM transaction t
                         JOIN wallet w ON t.wallet_id = w.wallet_id
                         LEFT JOIN category c ON t.category_id = c.category_id
                WHERE w.user_id = $1
                ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 5
            `, [userId]);

            res.json({
                netWorth: totalBalance,
                wallets: wallets.rows,
                recentTransactions: transactions.rows
            });
        } catch (err) { console.error(err); res.status(500).send("Server Error"); }
    },

    // ... (Keep getBudgetsAndGoals, getMarketData, getCategories, addTransaction, deleteTransaction, updateTransaction, addWallet, updateWallet) ...
    // YOU MUST KEEP THE PREVIOUS FUNCTIONS HERE. I am just adding the new ones below.

    getBudgetsAndGoals: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const budgets = await db.query(`
                SELECT b.*, c.name as category_name,
                       (SELECT COALESCE(SUM(ABS(amount)), 0) FROM transaction t
                        WHERE t.category_id = b.category_id AND t.type = 'expense'
                          AND t.transaction_date BETWEEN b.start_date AND b.end_date
                       ) as spent
                FROM budget b
                         JOIN category c ON b.category_id = c.category_id
                WHERE b.user_id = $1
            `, [userId]);
            const goals = await db.query('SELECT * FROM saving_goal WHERE user_id = $1', [userId]);
            res.json({ budgets: budgets.rows, goals: goals.rows });
        } catch (err) { console.error(err); res.status(500).send("Server Error"); }
    },

    getMarketData: async (req, res) => { /* ... */ },
    getCategories: async (req, res) => { /* ... */ },
    addTransaction: async (req, res) => { /* ... */ },
    deleteTransaction: async (req, res) => { /* ... */ },
    updateTransaction: async (req, res) => { /* ... */ },
    addWallet: async (req, res) => { /* ... */ },
    updateWallet: async (req, res) => { /* ... */ },

    // --- NEW CRUD FUNCTIONS START HERE ---

    // BUDGETS
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

    updateBudget: async (req, res) => {
        try {
            const { id } = req.params;
            const { limit_amount, start_date, end_date } = req.body;
            const result = await db.query(
                `UPDATE budget SET limit_amount=$1, start_date=$2, end_date=$3 WHERE budget_id=$4 RETURNING *`,
                [parseFloat(limit_amount), start_date, end_date, id]
            );
            res.json(result.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    deleteBudget: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM budget WHERE budget_id = $1', [id]);
            res.json({ message: "Budget deleted" });
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // GOALS
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

    updateGoal: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, target_amount, current_amount } = req.body;
            const result = await db.query(
                `UPDATE saving_goal SET name=$1, target_amount=$2, current_amount=$3 WHERE goal_id=$4 RETURNING *`,
                [name, parseFloat(target_amount), parseFloat(current_amount), id]
            );
            res.json(result.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    deleteGoal: async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM saving_goal WHERE goal_id = $1', [id]);
            res.json({ message: "Goal deleted" });
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    // CATEGORIES
    addCategory: async (req, res) => {
        try {
            const { name } = req.body;
            const userId = req.user.user_id;
            const newCat = await db.query(`INSERT INTO category (name, user_id) VALUES ($1, $2) RETURNING *`, [name, userId]);
            res.json(newCat.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const result = await db.query(`UPDATE category SET name=$1 WHERE category_id=$2 RETURNING *`, [name, id]);
            res.json(result.rows[0]);
        } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
    },

    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            // Optional: Check if used in transactions/budgets first? For now, we force delete or let DB error if FK constraint
            // Ideally, standard SQL will throw error if used.
            await db.query('DELETE FROM category WHERE category_id = $1', [id]);
            res.json({ message: "Category deleted" });
        } catch (err) {
            console.error(err);
            // 23503 is Postgres Foreign Key Violation code
            if(err.code === '23503') return res.status(400).json({ error: "Cannot delete: Category is in use." });
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = DashboardController;