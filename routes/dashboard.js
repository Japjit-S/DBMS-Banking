const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/dashboard/stats
 * Returns KPI metrics: total_customers, total_accounts, total_balance (SUM(balance)),
 * and a combined list of the 5 most recent financial transactions/transfers.
 */
router.get('/stats', async (req, res) => {
  try {
    // Total customers
    const [customerRows] = await pool.query(
      `SELECT COUNT(*) AS total_customers FROM Customer`
    );

    // Total accounts and aggregate balance
    const [accountRows] = await pool.query(
      `SELECT 
         COUNT(*) AS total_accounts,
         COALESCE(SUM(balance), 0) AS total_balance
       FROM Account`
    );

    // 5 Most recent activity records
    const [recentTxns] = await pool.query(
      `
      SELECT 
        'Transaction' AS record_type,
        t.transaction_id AS id,
        t.transaction_type AS type,
        a.account_number,
        t.amount,
        t.transaction_date AS timestamp,
        'Completed' AS status,
        t.description
      FROM BankTransaction t
      JOIN Account a ON t.account_id = a.account_id

      UNION ALL

      SELECT 
        'Transfer' AS record_type,
        tr.transfer_id AS id,
        'Transfer' AS type,
        CONCAT(a_from.account_number, ' ➔ ', a_to.account_number) AS account_number,
        tr.amount,
        tr.transfer_date AS timestamp,
        tr.status,
        tr.description
      FROM Transfer tr
      JOIN Account a_from ON tr.from_account_id = a_from.account_id
      JOIN Account a_to ON tr.to_account_id = a_to.account_id

      ORDER BY timestamp DESC
      LIMIT 5
      `
    );

    const totalCustomers = customerRows[0].total_customers || 0;
    const totalAccounts = accountRows[0].total_accounts || 0;
    const totalBalance = Math.round(parseFloat(accountRows[0].total_balance || 0) * 100) / 100;

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        total_customers: totalCustomers,
        total_accounts: totalAccounts,
        total_balance: totalBalance,
        recent_transactions: recentTxns
      }
    });
  } catch (error) {
    console.error('Error retrieving dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
