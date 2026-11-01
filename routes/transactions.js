const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * POST /api/transactions/deposit
 * Deposits funds into an active account atomically.
 */
router.post('/deposit', async (req, res) => {
  const { account_id, amount, description } = req.body;
  const accId = parseInt(account_id, 10);
  const depositAmt = parseFloat(amount);

  if (isNaN(accId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid account_id is required.'
    });
  }

  if (isNaN(depositAmt) || depositAmt <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Deposit amount must be a positive number greater than 0.'
    });
  }

  const roundedAmount = Math.round(depositAmt * 100) / 100;
  const desc = (description && description.trim()) ? description.trim() : 'Cash Deposit';

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock account row for update
    const [accounts] = await connection.query(
      `SELECT account_id, account_number, balance, status FROM Account WHERE account_id = ? FOR UPDATE`,
      [accId]
    );

    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Account #${accId} not found.`
      });
    }

    const account = accounts[0];
    if (account.status !== 'Active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Account ${account.account_number} is ${account.status}. Deposits are disallowed.`
      });
    }

    // Update account balance
    await connection.query(
      `UPDATE Account SET balance = balance + ? WHERE account_id = ?`,
      [roundedAmount, accId]
    );

    // Record in BankTransaction
    const [txnResult] = await connection.query(
      `INSERT INTO BankTransaction (account_id, transaction_type, amount, transaction_date, description)
       VALUES (?, 'Deposit', ?, NOW(), ?)`,
      [accId, roundedAmount, desc]
    );

    await connection.commit();

    const newBalance = Math.round((parseFloat(account.balance) + roundedAmount) * 100) / 100;

    return res.status(200).json({
      success: true,
      message: 'Deposit completed successfully',
      data: {
        transaction_id: txnResult.insertId,
        account_id: accId,
        account_number: account.account_number,
        transaction_type: 'Deposit',
        amount: roundedAmount,
        previous_balance: parseFloat(account.balance),
        new_balance: newBalance,
        description: desc
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error executing deposit:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process deposit',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/transactions/withdraw
 * Withdraws funds from an active account with balance check inside an atomic transaction.
 */
router.post('/withdraw', async (req, res) => {
  const { account_id, amount, description } = req.body;
  const accId = parseInt(account_id, 10);
  const withdrawAmt = parseFloat(amount);

  if (isNaN(accId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid account_id is required.'
    });
  }

  if (isNaN(withdrawAmt) || withdrawAmt <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Withdrawal amount must be a positive number greater than 0.'
    });
  }

  const roundedAmount = Math.round(withdrawAmt * 100) / 100;
  const desc = (description && description.trim()) ? description.trim() : 'Cash Withdrawal';

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Lock account row for update
    const [accounts] = await connection.query(
      `SELECT account_id, account_number, balance, status FROM Account WHERE account_id = ? FOR UPDATE`,
      [accId]
    );

    if (accounts.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Account #${accId} not found.`
      });
    }

    const account = accounts[0];
    if (account.status !== 'Active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Account ${account.account_number} is ${account.status}. Withdrawals are disallowed.`
      });
    }

    const currentBalance = parseFloat(account.balance);
    if (currentBalance < roundedAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient Funds: Available balance is ₹${currentBalance.toFixed(2)}, requested ₹${roundedAmount.toFixed(2)}.`,
        available_balance: currentBalance,
        requested_amount: roundedAmount
      });
    }

    // Deduct balance
    await connection.query(
      `UPDATE Account SET balance = balance - ? WHERE account_id = ?`,
      [roundedAmount, accId]
    );

    // Record in BankTransaction
    const [txnResult] = await connection.query(
      `INSERT INTO BankTransaction (account_id, transaction_type, amount, transaction_date, description)
       VALUES (?, 'Withdrawal', ?, NOW(), ?)`,
      [accId, roundedAmount, desc]
    );

    await connection.commit();

    const newBalance = Math.round((currentBalance - roundedAmount) * 100) / 100;

    return res.status(200).json({
      success: true,
      message: 'Withdrawal completed successfully',
      data: {
        transaction_id: txnResult.insertId,
        account_id: accId,
        account_number: account.account_number,
        transaction_type: 'Withdrawal',
        amount: roundedAmount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        description: desc
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error executing withdrawal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/transactions/transfer
 * Core ACID Transfer Engine:
 * - Validates from_account_id != to_account_id and amount > 0
 * - Starts transaction
 * - Locks both account rows deterministically with SELECT ... FOR UPDATE to prevent deadlocks
 * - Verifies both accounts are Active and sender has sufficient balance
 * - Deducts from sender, credits receiver
 * - Inserts into Transfer table with status 'Completed'
 * - Commits transaction; rollbacks on any failure
 */
router.post('/transfer', async (req, res) => {
  const { from_account_id, to_account_id, amount, description } = req.body;
  const fromId = parseInt(from_account_id, 10);
  const toId = parseInt(to_account_id, 10);
  const transferAmt = parseFloat(amount);

  if (isNaN(fromId) || isNaN(toId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid from_account_id and to_account_id are required.'
    });
  }

  if (fromId === toId) {
    return res.status(400).json({
      success: false,
      message: 'Self-transfer is invalid. Source and destination accounts must be distinct.'
    });
  }

  if (isNaN(transferAmt) || transferAmt <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Transfer amount must be a positive number greater than 0.'
    });
  }

  const roundedAmount = Math.round(transferAmt * 100) / 100;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Deterministic locking order (lock lower ID first) prevents deadlocks
    const [firstLockId, secondLockId] = fromId < toId ? [fromId, toId] : [toId, fromId];

    const [lockedAccounts] = await connection.query(
      `SELECT account_id, account_number, balance, status
       FROM Account
       WHERE account_id IN (?, ?)
       ORDER BY account_id ASC
       FOR UPDATE`,
      [firstLockId, secondLockId]
    );

    const fromAccount = lockedAccounts.find(a => a.account_id === fromId);
    const toAccount = lockedAccounts.find(a => a.account_id === toId);

    if (!fromAccount) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Source account #${fromId} not found.`
      });
    }

    if (!toAccount) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: `Destination account #${toId} not found.`
      });
    }

    if (fromAccount.status !== 'Active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Source account ${fromAccount.account_number} is ${fromAccount.status}. Transfer declined.`
      });
    }

    if (toAccount.status !== 'Active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Destination account ${toAccount.account_number} is ${toAccount.status}. Transfer declined.`
      });
    }

    const senderBalance = parseFloat(fromAccount.balance);
    if (senderBalance < roundedAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Insufficient Funds: Source account ${fromAccount.account_number} has ₹${senderBalance.toFixed(2)}, attempted transfer of ₹${roundedAmount.toFixed(2)}.`,
        available_balance: senderBalance,
        requested_amount: roundedAmount
      });
    }

    // Deduct from sender
    await connection.query(
      `UPDATE Account SET balance = balance - ? WHERE account_id = ?`,
      [roundedAmount, fromId]
    );

    // Credit receiver
    await connection.query(
      `UPDATE Account SET balance = balance + ? WHERE account_id = ?`,
      [roundedAmount, toId]
    );

    const desc = (description && description.trim())
      ? description.trim()
      : `Transfer from ${fromAccount.account_number} to ${toAccount.account_number}`;

    // Record in Transfer table
    const [transferResult] = await connection.query(
      `INSERT INTO Transfer (from_account_id, to_account_id, amount, transfer_date, status, description)
       VALUES (?, ?, ?, NOW(), 'Completed', ?)`,
      [fromId, toId, roundedAmount, desc]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transfer_id: transferResult.insertId,
        from_account_id: fromId,
        from_account_number: fromAccount.account_number,
        to_account_id: toId,
        to_account_number: toAccount.account_number,
        amount: roundedAmount,
        status: 'Completed',
        description: desc
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error executing transfer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process transfer',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/transactions/history
 * Returns combined list of recent bank transactions and transfers with account numbers and timestamps.
 */
router.get('/history', async (req, res) => {
  try {
    const { account_id } = req.query;
    const limit = parseInt(req.query.limit, 10) || 50;

    let query = '';
    const params = [];

    if (account_id) {
      const accId = parseInt(account_id, 10);
      query = `
        SELECT 
          'Transaction' AS record_type,
          t.transaction_id AS id,
          t.transaction_type AS type,
          a.account_id,
          a.account_number,
          t.amount,
          t.transaction_date AS timestamp,
          'Completed' AS status,
          t.description
        FROM BankTransaction t
        JOIN Account a ON t.account_id = a.account_id
        WHERE t.account_id = ?

        UNION ALL

        SELECT 
          'Transfer' AS record_type,
          tr.transfer_id AS id,
          'Transfer' AS type,
          tr.from_account_id AS account_id,
          CONCAT(a_from.account_number, ' ➔ ', a_to.account_number) AS account_number,
          tr.amount,
          tr.transfer_date AS timestamp,
          tr.status,
          tr.description
        FROM Transfer tr
        JOIN Account a_from ON tr.from_account_id = a_from.account_id
        JOIN Account a_to ON tr.to_account_id = a_to.account_id
        WHERE tr.from_account_id = ? OR tr.to_account_id = ?

        ORDER BY timestamp DESC
        LIMIT ?
      `;
      params.push(accId, accId, accId, limit);
    } else {
      query = `
        SELECT 
          'Transaction' AS record_type,
          t.transaction_id AS id,
          t.transaction_type AS type,
          a.account_id,
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
          tr.from_account_id AS account_id,
          CONCAT(a_from.account_number, ' ➔ ', a_to.account_number) AS account_number,
          tr.amount,
          tr.transfer_date AS timestamp,
          tr.status,
          tr.description
        FROM Transfer tr
        JOIN Account a_from ON tr.from_account_id = a_from.account_id
        JOIN Account a_to ON tr.to_account_id = a_to.account_id

        ORDER BY timestamp DESC
        LIMIT ?
      `;
      params.push(limit);
    }

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Transaction history retrieved successfully',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction history',
      error: error.message
    });
  }
});

module.exports = router;
