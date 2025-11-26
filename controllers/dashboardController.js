const db = require("../config/db");

const DashboardController = {
    getDashboardData: async (req, res) => {
        try {
            const userId = req.user.user_id; // Get ID from middleware

            // 1. Fetch Wallets (Total Balance & List)
            const walletQuery = `SELECT * FROM wallet WHERE user_id = $1 ORDER BY balance DESC`;
            const wallets = await db.query(walletQuery, [userId]);

            // 2. Calculate Net Worth
            const totalBalance = wallets.rows.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);

            // 3. Fetch Recent Transactions (Last 5)
            // We join with wallet table to get wallet names
            const txQuery = `
        SELECT t.*, w.name as wallet_name 
        FROM transaction t
        JOIN wallet w ON t.wallet_id = w.wallet_id
        WHERE w.user_id = $1
        ORDER BY t.transaction_date DESC
        LIMIT 5
      `;
            const transactions = await db.query(txQuery, [userId]);

            // 4. Send Data
            res.json({
                netWorth: totalBalance,
                wallets: wallets.rows,
                recentTransactions: transactions.rows
            });

        } catch (err) {
            console.error(err.message);
            res.status(500).json({ error: "Server Error" });
        }
    }
};

module.exports = DashboardController;