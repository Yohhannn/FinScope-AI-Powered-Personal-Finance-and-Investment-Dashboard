const db = require("../config/db.js"); // Ensure this path matches your db.js location

const DashboardModel = {
    // ==========================
    //       READ OPERATIONS
    // ==========================

    getWallets: async (userId) => {
        return db.query('SELECT * FROM wallet WHERE user_id = $1 ORDER BY balance DESC', [userId]);
    },

    // 🟢 GET SINGLE WALLET (Used for Validation & Details Popup)
    getWalletById: async (walletId, userId) => {
        return db.query('SELECT * FROM wallet WHERE wallet_id = $1 AND user_id = $2', [walletId, userId]);
    },

    // 🟢 GET WALLET HISTORY (Used for Details Popup)
    getTransactionsByWalletId: async (walletId) => {
        return db.query(`
            SELECT t.*, c.name as category_name
            FROM transaction t
                     LEFT JOIN category c ON t.category_id = c.category_id
            WHERE t.wallet_id = $1
            ORDER BY t.transaction_date DESC, t.created_at DESC
        `, [walletId]);
    },

    getRecentTransactions: async (userId) => {
        return db.query(`
            SELECT t.*, w.name as wallet_name, c.name as category_name
            FROM transaction t
                     JOIN wallet w ON t.wallet_id = w.wallet_id
                     LEFT JOIN category c ON t.category_id = c.category_id
            WHERE w.user_id = $1
            ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 5
        `, [userId]);
    },

    // 🟢 GET PINNED BUDGETS (For Dashboard Overview)
    getPinnedBudgets: async (userId) => {
        return db.query(`
            SELECT b.*, c.name as category_name,
                   (SELECT COALESCE(SUM(ABS(amount)), 0)
                    FROM transaction t
                    WHERE t.category_id = b.category_id
                      AND t.type = 'expense'
                      AND t.transaction_date BETWEEN b.start_date AND b.end_date
                   ) as spent
            FROM budget b
                     JOIN category c ON b.category_id = c.category_id
            WHERE b.user_id = $1 AND b.is_pinned = TRUE
                LIMIT 4
        `, [userId]);
    },

    // 🟢 GET PINNED GOALS (For Dashboard Overview)
    getPinnedGoals: async (userId) => {
        return db.query(
            'SELECT * FROM saving_goal WHERE user_id = $1 AND is_pinned = TRUE LIMIT 4',
            [userId]
        );
    },

    getBudgets: async (userId) => {
        return db.query(`
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
            ORDER BY b.budget_id DESC
        `, [userId]);
    },

    getGoals: async (userId) => {
        return db.query('SELECT * FROM saving_goal WHERE user_id = $1 ORDER BY goal_id DESC', [userId]);
    },

    getMarketWatchlist: async (userId) => {
        return db.query(`
            SELECT a.* FROM asset a
                                JOIN user_watchlist uw ON a.asset_id = uw.asset_id
            WHERE uw.user_id = $1
        `, [userId]);
    },

    getCategories: async (userId) => {
        return db.query(
            'SELECT * FROM category WHERE user_id = $1 OR user_id = 1 ORDER BY category_id ASC',
            [userId]
        );
    },

    getTransactionById: async (id) => {
        return db.query('SELECT * FROM transaction WHERE transaction_id = $1', [id]);
    },

    // ==========================
    //      WRITE OPERATIONS
    // ==========================

    // --- TRANSACTIONS ---
    createTransaction: async (data) => {
        const { name, amount, type, wallet_id, category_id, date, description } = data;
        return db.query(
            `INSERT INTO transaction (name, amount, type, wallet_id, category_id, transaction_date, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, amount, type, wallet_id, category_id, date, description]
        );
    },

    updateWalletBalance: async (wallet_id, adjustment) => {
        return db.query(
            `UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`,
            [adjustment, wallet_id]
        );
    },

    deleteTransaction: async (id) => {
        return db.query('DELETE FROM transaction WHERE transaction_id = $1', [id]);
    },

    updateTransaction: async (id, data) => {
        const { name, amount, type, wallet_id, category_id, date, description } = data;
        return db.query(
            `UPDATE transaction SET name=$1, amount=$2, type=$3, wallet_id=$4, category_id=$5, transaction_date=$6, description=$7
             WHERE transaction_id=$8 RETURNING *`,
            [name, amount, type, wallet_id, category_id, date, description, id]
        );
    },

    // --- WALLETS ---
    createWallet: async (data) => {
        const { name, type, balance, purpose, userId } = data;
        return db.query(
            `INSERT INTO wallet (name, type, balance, purpose, user_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, type, balance, purpose, userId]
        );
    },

    updateWallet: async (id, userId, data) => {
        const { name, type, balance, purpose } = data;
        return db.query(
            `UPDATE wallet SET name = $1, type = $2, balance = $3, purpose = $4
             WHERE wallet_id = $5 AND user_id = $6 RETURNING *`,
            [name, type, balance, purpose, id, userId]
        );
    },

    // --- BUDGETS ---
    createBudget: async (data) => {
        const { userId, category_id, limit_amount, start_date, end_date } = data;
        return db.query(
            `INSERT INTO budget (user_id, category_id, limit_amount, start_date, end_date)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, category_id, limit_amount, start_date, end_date]
        );
    },

    updateBudget: async (id, data) => {
        const { limit_amount, start_date, end_date } = data;
        return db.query(
            `UPDATE budget SET limit_amount=$1, start_date=$2, end_date=$3 WHERE budget_id=$4 RETURNING *`,
            [limit_amount, start_date, end_date, id]
        );
    },

    deleteBudget: async (id) => {
        return db.query('DELETE FROM budget WHERE budget_id = $1', [id]);
    },

    toggleBudgetPin: async (id, status) => {
        return db.query('UPDATE budget SET is_pinned = $1 WHERE budget_id = $2', [status, id]);
    },

    // --- GOALS ---
// ... inside DashboardModel object ...

    // 🟢 NEW: Calculate total money already set aside in goals for a specific wallet
    getWalletAllocatedTotal: async (walletId) => {
        // Sums up 'current_amount' of all goals linked to this wallet
        const res = await db.query(
            `SELECT COALESCE(SUM(current_amount), 0) as total FROM saving_goal WHERE wallet_id = $1`,
            [walletId]
        );
        return parseFloat(res.rows[0].total);
    },

    // 🟢 UPDATE: Ensure addGoal saves the wallet_id
    createGoal: async (data) => {
        const { userId, name, target_amount, current_amount, wallet_id } = data;
        return db.query(
            `INSERT INTO saving_goal (user_id, name, target_amount, current_amount, wallet_id) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, name, target_amount, current_amount || 0, wallet_id]
        );
    },

    // 🟢 UPDATE: Ensure updateGoal handles wallet_id
    updateGoal: async (id, data) => {
        const { name, target_amount, current_amount, wallet_id } = data;
        return db.query(
            `UPDATE saving_goal SET name=$1, target_amount=$2, current_amount=$3, wallet_id=$4 
             WHERE goal_id=$5 RETURNING *`,
            [name, target_amount, current_amount, wallet_id, id]
        );
    },
// ...

    // 🟢 NEW: Just increase the goal amount (Allocation Logic)
    incrementGoalAmount: async (goalId, amount) => {
        return db.query(
            `UPDATE saving_goal SET current_amount = current_amount + $1 WHERE goal_id = $2 RETURNING *`,
            [amount, goalId]
        );
    },




    deleteGoal: async (id) => {
        return db.query('DELETE FROM saving_goal WHERE goal_id = $1', [id]);
    },

    toggleGoalPin: async (id, status) => {
        return db.query('UPDATE saving_goal SET is_pinned = $1 WHERE goal_id = $2', [status, id]);
    },

    // --- CATEGORIES ---
    createCategory: async (data) => {
        const { name, userId } = data;
        return db.query(`INSERT INTO category (name, user_id) VALUES ($1, $2) RETURNING *`, [name, userId]);
    },

    updateCategory: async (id, name) => {
        return db.query(`UPDATE category SET name=$1 WHERE category_id=$2 RETURNING *`, [name, id]);
    },

    deleteCategory: async (id) => {
        return db.query('DELETE FROM category WHERE category_id = $1', [id]);
    }
};

module.exports = DashboardModel;