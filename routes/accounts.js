const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/accounts
 * Returns all accounts joined with customer and branch details.
 * Supports optional ?status= ('Active'/'Closed') and ?search= (matches account_number, customer name, email).
 */
router.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT a.account_id, a.customer_id, a.branch_id, a.account_number,
             a.account_type, a.balance, a.status, a.opening_date,
             c.name AS customer_name, c.email AS customer_email,
             b.branch_name, b.IFSC_code
      FROM Account a
      JOIN Customer c ON a.customer_id = c.customer_id
      JOIN Branch b ON a.branch_id = b.branch_id
    `;

    const conditions = [];
    const params = [];

    if (status && status.trim() !== '') {
      conditions.push(`a.status = ?`);
      params.push(status.trim());
    }

    if (search && search.trim() !== '') {
      conditions.push(`(a.account_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)`);
      const pattern = `%${search.trim()}%`;
      params.push(pattern, pattern, pattern);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY a.account_id ASC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Accounts retrieved successfully',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve accounts',
      error: error.message
    });
  }
});

/**
 * GET /api/accounts/:id
 * Returns single account details with associated customer and branch information.
 */
router.get('/:id', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID provided'
      });
    }

    const [rows] = await pool.query(
      `SELECT a.account_id, a.customer_id, a.branch_id, a.account_number,
              a.account_type, a.balance, a.status, a.opening_date,
              c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
              b.branch_name, b.IFSC_code, b.address AS branch_address
       FROM Account a
       JOIN Customer c ON a.customer_id = c.customer_id
       JOIN Branch b ON a.branch_id = b.branch_id
       WHERE a.account_id = ?`,
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Account #${accountId} not found`,
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account details retrieved successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve account details',
      error: error.message
    });
  }
});

/**
 * POST /api/accounts
 * Opens a new account. If initial_deposit > 0, executes inside an atomic database transaction
 * inserting the account and logging an initial 'Deposit' in BankTransaction.
 */
router.post('/', async (req, res) => {
  const { customer_id, branch_id, account_type, initial_deposit, initial_balance } = req.body;

  const custId = parseInt(customer_id, 10);
  const brId = parseInt(branch_id, 10);

  if (isNaN(custId) || isNaN(brId)) {
    return res.status(400).json({
      success: false,
      message: 'Valid customer_id and branch_id are required.'
    });
  }

  if (!account_type || !['Savings', 'Current'].includes(account_type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account_type. Allowed types are strictly 'Savings' or 'Current'."
    });
  }

  const depositRaw = initial_deposit !== undefined ? initial_deposit : (initial_balance || 0);
  const deposit = parseFloat(depositRaw);
  if (isNaN(deposit) || deposit < 0) {
    return res.status(400).json({
      success: false,
      message: 'Initial deposit cannot be negative.'
    });
  }
  const roundedDeposit = Math.round(deposit * 100) / 100;

  let connection;
  try {
    connection = await pool.getConnection();

    // Check customer exists
    const [custCheck] = await connection.query(
      `SELECT customer_id FROM Customer WHERE customer_id = ?`,
      [custId]
    );
    if (custCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer #${custId} does not exist.`
      });
    }

    // Check branch exists
    const [branchCheck] = await connection.query(
      `SELECT branch_id FROM Branch WHERE branch_id = ?`,
      [brId]
    );
    if (branchCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Branch #${brId} does not exist.`
      });
    }

    await connection.beginTransaction();

    // Determine sequential account number
    const [maxRows] = await connection.query(
      `SELECT MAX(account_id) AS maxId FROM Account FOR UPDATE`
    );
    const nextSeq = (maxRows[0].maxId || 0) + 1;
    const accountNumber = req.body.account_number || `ACC-${1001000 + nextSeq}`;

    const [accResult] = await connection.query(
      `INSERT INTO Account (customer_id, branch_id, account_number, account_type, balance, status, opening_date)
       VALUES (?, ?, ?, ?, ?, 'Active', CURDATE())`,
      [custId, brId, accountNumber, account_type, roundedDeposit]
    );

    const newAccountId = accResult.insertId;

    if (roundedDeposit > 0) {
      await connection.query(
        `INSERT INTO BankTransaction (account_id, transaction_type, amount, transaction_date, description)
         VALUES (?, 'Deposit', ?, NOW(), 'Initial Opening Deposit')`,
        [newAccountId, roundedDeposit]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Account opened successfully',
      data: {
        account_id: newAccountId,
        customer_id: custId,
        branch_id: brId,
        account_number: accountNumber,
        account_type,
        balance: roundedDeposit,
        status: 'Active',
        opening_date: new Date().toISOString().split('T')[0]
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'An account with this account number already exists.'
      });
    }
    console.error('Error opening account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to open account',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PATCH /api/accounts/:id/status
 * Updates status ('Active' or 'Closed').
 * Enforces business rule: an account can ONLY be closed if balance is exactly 0.00.
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const accountId = parseInt(req.params.id, 10);
    if (isNaN(accountId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid account ID provided'
      });
    }

    const { status } = req.body;
    if (!status || !['Active', 'Closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Active' or 'Closed'."
      });
    }

    const [rows] = await pool.query(
      `SELECT account_id, account_number, balance, status FROM Account WHERE account_id = ?`,
      [accountId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Account #${accountId} not found`
      });
    }

    const account = rows[0];
    const currentBalance = parseFloat(account.balance);

    if (status === 'Closed' && currentBalance !== 0.00) {
      return res.status(400).json({
        success: false,
        message: `Cannot close Account ${account.account_number}. Balance must be ₹0.00 before closure (current balance: ₹${currentBalance.toFixed(2)}). Withdraw or transfer remaining funds first.`
      });
    }

    await pool.query(
      `UPDATE Account SET status = ? WHERE account_id = ?`,
      [status, accountId]
    );

    return res.status(200).json({
      success: true,
      message: `Account status updated to '${status}' successfully`,
      data: {
        account_id: accountId,
        account_number: account.account_number,
        status: status,
        balance: currentBalance
      }
    });
  } catch (error) {
    console.error('Error updating account status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update account status',
      error: error.message
    });
  }
});

module.exports = router;
