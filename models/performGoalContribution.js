// const db = require("../config/db.js");
//
// const DashboardModel = {
//     // ... (Keep existing Read/Write functions) ...
//
//     // 🟢 1. UPDATED: Add Contribution (Now saves to saving_goal_transaction)
//     performGoalContribution: async (userId, goalId, walletId, amount) => {
//         const client = await db.connect();
//
//         try {
//             await client.query('BEGIN');
//
//             // A. Get Wallet Balance
//             const walletRes = await client.query(
//                 'SELECT balance FROM wallet WHERE wallet_id = $1 AND user_id = $2',
//                 [walletId, userId]
//             );
//
//             if (walletRes.rows.length === 0) throw new Error("Wallet not found");
//
//             const currentBalance = parseFloat(walletRes.rows[0].balance);
//             const contribution = parseFloat(amount);
//
//             // B. Validation
//             if (contribution > 0 && currentBalance < contribution) {
//                 throw new Error(`Insufficient funds. Current balance: $${currentBalance}`);
//             }
//
//             // C. Update Wallet (Subtract logic)
//             const newWalletBalance = currentBalance - contribution;
//             await client.query(
//                 'UPDATE wallet SET balance = $1 WHERE wallet_id = $2',
//                 [newWalletBalance, walletId]
//             );
//
//             // D. Update Goal (Add logic)
//             await client.query(
//                 'UPDATE saving_goal SET current_amount = current_amount + $1 WHERE goal_id = $2',
//                 [contribution, goalId]
//             );
//
//             // E. Insert into MAIN Transaction Table (For Wallet History)
//             const txType = contribution > 0 ? 'expense' : 'income';
//             const txName = contribution > 0 ? 'Savings Contribution' : 'Savings Withdrawal';
//
//             await client.query(
//                 `INSERT INTO transaction (name, amount, transaction_date, description, type, wallet_id)
//                  VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)`,
//                 [txName, Math.abs(contribution), `Transfer to/from Goal ID: ${goalId}`, txType, walletId]
//             );
//
//             // 🟢 F. Insert into NEW saving_goal_transaction Table (For Goal History)
//             // This allows you to track and delete this specific action later
//             await client.query(
//                 `INSERT INTO saving_goal_transaction (amount, transaction_date, goal_id, wallet_id)
//                  VALUES ($1, CURRENT_DATE, $2, $3)`,
//                 [contribution, goalId, walletId]
//             );
//
//             await client.query('COMMIT');
//             return newWalletBalance;
//
//         } catch (error) {
//             await client.query('ROLLBACK');
//             throw error;
//         } finally {
//             client.release();
//         }
//     },
//
//     // 🟢 2. NEW: Delete Goal Transaction (Reverses the money)
//     deleteGoalTransaction: async (transactionId, userId) => {
//         const client = await db.connect();
//
//         try {
//             await client.query('BEGIN');
//
//             // A. Get the Transaction details to know what to reverse
//             // We join with saving_goal to ensure the user owns this goal
//             const txRes = await client.query(
//                 `SELECT t.*, g.user_id
//                  FROM saving_goal_transaction t
//                  JOIN saving_goal g ON t.goal_id = g.goal_id
//                  WHERE t.transaction_id = $1`,
//                 [transactionId]
//             );
//
//             if (txRes.rows.length === 0) throw new Error("Transaction not found");
//
//             const tx = txRes.rows[0];
//             if (tx.user_id !== userId) throw new Error("Unauthorized");
//
//             const amountToReverse = parseFloat(tx.amount); // Can be positive or negative
//             const walletId = tx.wallet_id;
//             const goalId = tx.goal_id;
//
//             // B. Reverse Wallet Balance
//             // If we added $500 (amountToReverse=500), we need to ADD it back to wallet (wallet + 500)
//             // Wait, logic check:
//             // Original: Wallet - 500. Goal + 500.
//             // Delete: Wallet + 500. Goal - 500.
//             await client.query(
//                 `UPDATE wallet SET balance = balance + $1 WHERE wallet_id = $2`,
//                 [amountToReverse, walletId]
//             );
//
//             // C. Reverse Goal Amount
//             await client.query(
//                 `UPDATE saving_goal SET current_amount = current_amount - $1 WHERE goal_id = $2`,
//                 [amountToReverse, goalId]
//             );
//
//             // D. Delete the record
//             await client.query('DELETE FROM saving_goal_transaction WHERE transaction_id = $1', [transactionId]);
//
//             // Note: We are NOT deleting the 'Main' transaction entry here because mapping them 1:1 is complex
//             // without a linking ID. For now, this balances the math correctly.
//
//             await client.query('COMMIT');
//             return true;
//
//         } catch (error) {
//             await client.query('ROLLBACK');
//             throw error;
//         } finally {
//             client.release();
//         }
//     }
// };
//
// module.exports = DashboardModel;