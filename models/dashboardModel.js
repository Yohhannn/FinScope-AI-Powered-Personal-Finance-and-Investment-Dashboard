const db = require("../config/db.js");

const DashboardModel = {
    // ==========================
    // 🟢 1. READ OPERATIONS
    // ==========================

    // 🟢 UPDATED: Calculate 'Available Balance' dynamically
    getWallets: async (userId) => {
        return db.query(`
            SELECT w.*,
                   (w.balance - COALESCE((SELECT SUM(current_amount) FROM saving_goal WHERE wallet_id = w.wallet_id), 0)) AS available_balance
            FROM wallet w
            WHERE user_id = $1
            ORDER BY w.balance DESC
        `, [userId]);
    },

    getWalletById: async (walletId, userId) => {
        // We also need available_balance here for validation
        return db.query(`
            SELECT w.*,
                   (w.balance - COALESCE((SELECT SUM(current_amount) FROM saving_goal WHERE wallet_id = w.wallet_id), 0)) AS available_balance
            FROM wallet w
            WHERE wallet_id = $1 AND user_id = $2
        `, [walletId, userId]);
    },

    // 🟢 NEW FUNCTION: Create a transaction history for a saving goal (Moved from Controller)
    createGoalTransaction: async (amount, goalId, walletId, isContribution) => {
        return db.query(
            `INSERT INTO saving_goal_transaction (amount, transaction_date, is_contribution, goal_id, wallet_id)
             VALUES ($1, CURRENT_DATE, $4, $2, $3) RETURNING *`,
            [amount, goalId, walletId, isContribution]
        );
    },

    // ============================================
    // 🟢 2. COMPLEX TRANSACTIONS (ALLOCATION & TRANSFER)
    // ============================================

    // 🟢 PERFORM CONTRIBUTION (Fixed: Added is_contribution = TRUE)
    performGoalContribution: async (userId, goalId, walletId, amount) => {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Get Wallet Balance
            const walletRes = await client.query(
                `SELECT balance,
                        (balance - COALESCE((SELECT SUM(current_amount) FROM saving_goal WHERE wallet_id = $1 AND goal_id != $3), 0)) AS available_balance
                 FROM wallet WHERE wallet_id = $1 AND user_id = $2 FOR UPDATE`,
                [walletId, userId, goalId]
            );

            if (walletRes.rows.length === 0) throw new Error("Wallet not found");

            const availableBalance = parseFloat(walletRes.rows[0].available_balance);
            const contribution = parseFloat(amount);

            // 2. Validation
            if (contribution > 0 && availableBalance < contribution) {
                throw new Error(`Insufficient available funds. Available: $${availableBalance.toLocaleString()}`);
            }

            // 3. Update Goal Amount ONLY
            await client.query(
                'UPDATE saving_goal SET current_amount = current_amount + $1 WHERE goal_id = $2',
                [contribution, goalId]
            );

            // 4. Record History
            await client.query(
                `INSERT INTO saving_goal_transaction (amount, transaction_date, goal_id, wallet_id, is_contribution)
                 VALUES ($1, CURRENT_DATE, $2, $3, TRUE)`, // ✅ FIXED: Added is_contribution = TRUE
                [contribution, goalId, walletId]
            );

            await client.query('COMMIT');

            return availableBalance - contribution;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // 🟢 PERFORM WALLET TRANSFER
    performWalletTransfer: async (userId, sourceWalletId, destWalletId, amount, date) => {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Check Source Balance
            const sourceRes = await client.query(
                'SELECT * FROM wallet WHERE wallet_id = $1 AND user_id = $2 FOR UPDATE',
                [sourceWalletId, userId]
            );
            if (sourceRes.rows.length === 0) throw new Error("Source wallet not found");

            const sourceWallet = sourceRes.rows[0];
            const transferAmount = parseFloat(amount);

            if (parseFloat(sourceWallet.balance) < transferAmount) {
                throw new Error(`Insufficient funds in ${sourceWallet.name}`);
            }

            // 2. Check Destination Wallet
            const destRes = await client.query(
                'SELECT * FROM wallet WHERE wallet_id = $1 AND user_id = $2',
                [destWalletId, userId]
            );
            if (destRes.rows.length === 0) throw new Error("Destination wallet not found");
            const destWallet = destRes.rows[0];

            // 3. Deduct from Source
            await client.query('UPDATE wallet SET balance = balance - $1 WHERE wallet_id = $2', [transferAmount, sourceWalletId]);

            // 4. Add to Destination
            await client.query('UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2', [transferAmount, destWalletId]);

            // 5. Create Transaction Record for Source (Expense)
            await client.query(
                `INSERT INTO transaction (name, amount, type, wallet_id, transaction_date, description)
                 VALUES ($1, $2, 'expense', $3, $4, $5)`,
                ['Transfer Out', transferAmount, sourceWalletId, date, `Transfer to ${destWallet.name}`]
            );

            // 6. Create Transaction Record for Destination (Income)
            await client.query(
                `INSERT INTO transaction (name, amount, type, wallet_id, transaction_date, description)
                 VALUES ($1, $2, 'income', $3, $4, $5)`,
                ['Transfer In', transferAmount, destWalletId, date, `Transfer from ${sourceWallet.name}`]
            );

            await client.query('COMMIT');
            return true;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    getAllTransactions: async (userId) => {
        return db.query(`
            SELECT
                t.transaction_id, t.name, t.amount, t.transaction_date, t.description,
                t.type, /* Use t.type for transaction type */
                t.created_at, t.wallet_id, t.category_id,
                w.name as wallet_name,
                c.name as category_name
            FROM transaction t
                     JOIN wallet w ON t.wallet_id = w.wallet_id
                     LEFT JOIN category c ON t.category_id = c.category_id
            WHERE w.user_id = $1
            ORDER BY t.transaction_date ASC
        `, [userId]);
    },

    // 🟢 NEW: Auto-Rollover Expired Budgets
    rolloverBudgets: async (userId) => {
        return db.query(`
            UPDATE budget
            SET
                start_date = date_trunc('month', CURRENT_DATE),
                end_date = (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
            WHERE
                user_id = $1
              AND end_date < CURRENT_DATE
        `, [userId]);
    },

    // 🟢 3. UPDATED: REVERT ALLOCATION (No Wallet Refund needed)
    deleteGoalTransaction: async (transactionId, userId) => {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // A. Get details
            const txRes = await client.query(
                `SELECT t.*, g.user_id
                 FROM saving_goal_transaction t
                          JOIN saving_goal g ON t.goal_id = g.goal_id
                 WHERE t.transaction_id = $1`,
                [transactionId]
            );

            if (txRes.rows.length === 0) throw new Error("Transaction not found");
            const tx = txRes.rows[0];
            if (tx.user_id !== userId) throw new Error("Unauthorized");

            const amountToReverse = parseFloat(tx.amount);
            const goalId = tx.goal_id;

            // B. Reverse Goal Amount Only
            // (We do NOT touch the wallet table because we never took money from it)
            await client.query(
                `UPDATE saving_goal SET current_amount = current_amount - $1 WHERE goal_id = $2`,
                [amountToReverse, goalId]
            );

            // C. Delete the record
            await client.query('DELETE FROM saving_goal_transaction WHERE transaction_id = $1', [transactionId]);

            await client.query('COMMIT');
            return true;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // 🟢 FIX: Explicitly select transaction columns to avoid ambiguity
    getTransactionsByWalletId: async (walletId) => {
        return db.query(`
            SELECT
                t.transaction_id, t.name, t.amount, t.transaction_date, t.description,
                t.type, /* Explicitly select transaction type */
                t.created_at, t.wallet_id, t.category_id,
                c.name as category_name
            FROM transaction t
                     LEFT JOIN category c ON t.category_id = c.category_id
            WHERE t.wallet_id = $1
            ORDER BY t.transaction_date DESC, t.created_at DESC
        `, [walletId]);
    },

    // 🟢 FIX 2: getRecentTransactions (Explicit column selection)
    getRecentTransactions: async (userId) => {
        return db.query(`
            SELECT
                t.transaction_id, t.name, t.amount, t.transaction_date, t.description,
                t.type, /* Explicitly select transaction type */
                t.created_at, t.wallet_id, t.category_id,
                w.name as wallet_name,
                c.name as category_name
            FROM transaction t
                     JOIN wallet w ON t.wallet_id = w.wallet_id
                     LEFT JOIN category c ON t.category_id = c.category_id
            WHERE w.user_id = $1
            ORDER BY t.transaction_date DESC, t.created_at DESC
                LIMIT 5
        `, [userId]);
    },

    // ==========================================
    // 🟢 3. BUDGETS & GOALS (FIXED QUERIES)
    // ==========================================

    // 🟢 FIX 4: getBudgetTransactions (Secure Filtering)
    getBudgetTransactions: async (budgetId, userId) => {
        // 1. Verify this budget belongs to the logged-in user
        const budgetRes = await db.query(
            'SELECT * FROM budget WHERE budget_id = $1 AND user_id = $2',
            [budgetId, userId]
        );

        if (budgetRes.rows.length === 0) throw new Error("Budget not found or unauthorized");
        const budget = budgetRes.rows[0];

        // 2. Fetch transactions ONLY for this user
        return db.query(`
            SELECT
                t.transaction_id, t.name, t.amount, t.transaction_date, t.description,
                t.type,
                t.created_at, t.wallet_id, t.category_id,
                w.name as wallet_name
            FROM transaction t
                     JOIN wallet w ON t.wallet_id = w.wallet_id
            WHERE t.category_id = $1
              AND t.type = 'expense'
              AND t.transaction_date BETWEEN $2 AND $3
              AND w.user_id = $4  /* 🔒 CRITICAL FIX: Only show MY wallet transactions */
            ORDER BY t.transaction_date DESC
        `, [budget.category_id, budget.start_date, budget.end_date, userId]);
    },

    // 🟢 FIX 5: getMonthlyNetFlow (Explicitly name the transaction table in the WHERE clause)
    getMonthlyNetFlow: async (userId) => {
        return db.query(`
            SELECT
                SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
                SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense
            FROM transaction t
                     JOIN wallet w ON t.wallet_id = w.wallet_id
            WHERE w.user_id = $1
              AND t.transaction_date >= date_trunc('month', CURRENT_DATE)
        `, [userId]);
    },

    // 🟢 CRITICAL FIX: getPinnedBudgets
    // We added: JOIN wallet w ON t.wallet_id = w.wallet_id AND w.user_id = b.user_id
    getPinnedBudgets: async (userId) => {
        return db.query(`
            SELECT b.*, c.name as category_name,
                   (
                       SELECT COALESCE(SUM(ABS(t.amount)), 0)
                       FROM transaction t
                                JOIN wallet w ON t.wallet_id = w.wallet_id
                       WHERE t.category_id = b.category_id
                         AND t.type = 'expense'
                         AND t.transaction_date BETWEEN b.start_date AND b.end_date
                         AND w.user_id = b.user_id -- 🔒 SECURITY CHECK
                   ) as spent
            FROM budget b
                     JOIN category c ON b.category_id = c.category_id
            WHERE b.user_id = $1 AND b.is_pinned = TRUE
                LIMIT 4
        `, [userId]);
    },

    getPinnedGoals: async (userId) => {
        return db.query('SELECT * FROM saving_goal WHERE user_id = $1 AND is_pinned = TRUE LIMIT 4', [userId]);
    },

    // 🟢 CRITICAL FIX: getBudgets (The "Ghost Transaction" Fix)
    // We added: JOIN wallet w ON t.wallet_id = w.wallet_id AND w.user_id = b.user_id
    getBudgets: async (userId) => {
        return db.query(`
            SELECT b.*, c.name as category_name,
                   (
                       SELECT COALESCE(SUM(ABS(t.amount)), 0)
                       FROM transaction t
                                JOIN wallet w ON t.wallet_id = w.wallet_id
                       WHERE t.category_id = b.category_id
                         AND t.type = 'expense'
                         AND t.transaction_date BETWEEN b.start_date AND b.end_date
                         AND w.user_id = b.user_id -- 🔒 SECURITY CHECK
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

    getGoalTransactions: async (goalId) => {
        return db.query(`
            SELECT t.*, w.name as wallet_name
            FROM saving_goal_transaction t
                     LEFT JOIN wallet w ON t.wallet_id = w.wallet_id
            WHERE t.goal_id = $1
            ORDER BY t.created_at DESC
        `, [goalId]);
    },

    // ==========================================
    // 🟢 4. STANDARD CRUD OPERATIONS
    // ==========================================

    getMarketWatchlist: async (userId) => {
        return db.query(`SELECT a.* FROM asset a JOIN user_watchlist uw ON a.asset_id = uw.asset_id WHERE uw.user_id = $1`, [userId]);
    },
    getCategories: async (userId) => {
        return db.query('SELECT * FROM category WHERE user_id = $1 OR user_id = 1 ORDER BY category_id ASC', [userId]);
    },
    getCategoryOwnerId: async (id) => {
        return db.query('SELECT user_id FROM category WHERE category_id = $1', [id]);
    },
    getTransactionById: async (id) => {
        return db.query('SELECT * FROM transaction WHERE transaction_id = $1', [id]);
    },
    getWalletAllocatedTotal: async (walletId) => {
        const res = await db.query(`SELECT COALESCE(SUM(current_amount), 0) as total FROM saving_goal WHERE wallet_id = $1`, [walletId]);
        return parseFloat(res.rows[0].total);
    },
    getOtherGoalsAllocation: async (walletId, goalId) => {
        const res = await db.query(
            `SELECT COALESCE(SUM(current_amount), 0) as total FROM saving_goal WHERE wallet_id = $1 AND goal_id != $2`,
            [walletId, goalId]
        );
        return parseFloat(res.rows[0].total);
    },
    createTransaction: async (data) => {
        const { name, amount, type, wallet_id, category_id, date, description } = data;
        return db.query(`INSERT INTO transaction (name, amount, type, wallet_id, category_id, transaction_date, description) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [name, amount, type, wallet_id, category_id, date, description]);
    },
    updateWalletBalance: async (wallet_id, adjustment) => {
        return db.query(`UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`, [adjustment, wallet_id]);
    },
    deleteTransaction: async (id) => {
        return db.query('DELETE FROM transaction WHERE transaction_id = $1', [id]);
    },
    updateTransaction: async (id, data) => {
        const { name, amount, type, wallet_id, category_id, date, description } = data;
        return db.query(`UPDATE transaction SET name=$1, amount=$2, type=$3, wallet_id=$4, category_id=$5, transaction_date=$6, description=$7 WHERE transaction_id=$8 RETURNING *`, [name, amount, type, wallet_id, category_id, date, description, id]);
    },
    createWallet: async (data) => {
        const { name, type, balance, purpose, userId } = data;
        return db.query(`INSERT INTO wallet (name, type, balance, purpose, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [name, type, balance, purpose, userId]);
    },
    updateWallet: async (id, userId, data) => {
        const { name, type, balance, purpose } = data;
        return db.query(`UPDATE wallet SET name = $1, type = $2, balance = $3, purpose = $4 WHERE wallet_id = $5 AND user_id = $6 RETURNING *`, [name, type, balance, purpose, id, userId]);
    },
    createBudget: async (data) => {
        const { userId, category_id, limit_amount, start_date, end_date } = data;
        return db.query(`INSERT INTO budget (user_id, category_id, limit_amount, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [userId, category_id, limit_amount, start_date, end_date]);
    },
    checkBudgetExists: async (userId, categoryId) => {
        const res = await db.query(
            'SELECT * FROM budget WHERE user_id = $1 AND category_id = $2',
            [userId, categoryId]
        );
        return res.rows.length > 0;
    },
    checkBudgetExistsForUpdate: async (userId, categoryId, budgetId) => {
        return db.query(
            `SELECT * FROM budget WHERE user_id = $1 AND category_id = $2 AND budget_id != $3`,
            [userId, categoryId, budgetId]
        );
    },
    updateBudget: async (id, data) => {
        const { limit_amount, start_date, end_date, category_id } = data;
        return db.query(
            `UPDATE budget SET limit_amount=$1, start_date=$2, end_date=$3, category_id=$4 WHERE budget_id=$5 RETURNING *`,
            [limit_amount, start_date, end_date, category_id, id]
        );
    },
    deleteBudget: async (id) => {
        return db.query('DELETE FROM budget WHERE budget_id = $1', [id]);
    },
    toggleBudgetPin: async (id, status) => {
        return db.query('UPDATE budget SET is_pinned = $1 WHERE budget_id = $2', [status, id]);
    },

    createGoal: async (data) => {
        const { userId, name, target_amount, current_amount, wallet_id } = data;
        return db.query(`INSERT INTO saving_goal (user_id, name, target_amount, current_amount, wallet_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [userId, name, target_amount, current_amount, wallet_id]);
    },
    updateGoal: async (id, data) => {
        const { name, target_amount, current_amount, wallet_id } = data;
        return db.query(`UPDATE saving_goal SET name=$1, target_amount=$2, current_amount=$3, wallet_id=$4 WHERE goal_id=$5 RETURNING *`, [name, target_amount, current_amount, wallet_id, id]);
    },
    incrementGoalAmount: async (goalId, amount) => {
        return db.query(`UPDATE saving_goal SET current_amount = current_amount + $1 WHERE goal_id = $2 RETURNING *`, [amount, goalId]);
    },
    deleteGoal: async (id) => {
        return db.query('DELETE FROM saving_goal WHERE goal_id = $1', [id]);
    },
    toggleGoalPin: async (id, status) => {
        return db.query('UPDATE saving_goal SET is_pinned = $1 WHERE goal_id = $2', [status, id]);
    },

    // 🟢 CATEGORY OPERATIONS
    createCategory: async (data) => {
        const { name, userId } = data;
        return db.query(`INSERT INTO category (name, user_id) VALUES ($1, $2) RETURNING *`, [name, userId]);
    },

    // 🟢 THIS WAS MISSING
    checkCategoryExists: async (userId, name) => {
        const res = await db.query(
            'SELECT * FROM category WHERE user_id = $1 AND name = $2',
            [userId, name]
        );
        return res.rows.length > 0;
    },

    updateGoalStatus: async (goalId, status) => {
        return db.query(`
            UPDATE saving_goal 
            SET status = $1 
            WHERE goal_id = $2 
            RETURNING *
        `, [status, goalId]);
    },

    updateCategory: async (id, name) => {
        return db.query(`UPDATE category SET name=$1 WHERE category_id=$2 RETURNING *`, [name, id]);
    },
    deleteCategory: async (id, userId) => {
        return db.query('DELETE FROM category WHERE category_id = $1 AND user_id = $2', [id, userId]);
    }
};

module.exports = DashboardModel;