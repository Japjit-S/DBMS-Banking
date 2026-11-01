const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/customers
 * Returns all customers, optionally filtered by ?search= (matches name or email).
 */
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT customer_id, name, email, phone, address, date_of_birth
      FROM Customer
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` WHERE name LIKE ? OR email LIKE ?`;
      const searchPattern = `%${search.trim()}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ` ORDER BY customer_id ASC`;

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customers',
      error: error.message
    });
  }
});

/**
 * GET /api/customers/:id
 * Returns a specific customer profile along with their associated accounts.
 */
router.get('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided'
      });
    }

    const [customers] = await pool.query(
      `SELECT customer_id, name, email, phone, address, date_of_birth
       FROM Customer
       WHERE customer_id = ?`,
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer #${customerId} not found`,
        data: null
      });
    }

    const customer = customers[0];

    // Fetch accounts associated with this customer
    const [accounts] = await pool.query(
      `SELECT a.account_id, a.account_number, a.account_type, a.balance,
              a.status, a.opening_date,
              b.branch_id, b.branch_name, b.IFSC_code
       FROM Account a
       JOIN Branch b ON a.branch_id = b.branch_id
       WHERE a.customer_id = ?
       ORDER BY a.account_id ASC`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Customer retrieved successfully',
      data: {
        ...customer,
        accounts
      }
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve customer details',
      error: error.message
    });
  }
});

/**
 * POST /api/customers
 * Registers a new customer after field validation and duplicate email check.
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, date_of_birth } = req.body;

    if (!name || !email || !phone || !address || !date_of_birth) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, address, and date_of_birth are all required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO Customer (name, email, phone, address, date_of_birth)
       VALUES (?, ?, ?, ?, ?)`,
      [name.trim(), trimmedEmail, phone.trim(), address.trim(), date_of_birth]
    );

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: {
        customer_id: result.insertId,
        name: name.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        address: address.trim(),
        date_of_birth
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A customer with this email address already exists.'
      });
    }
    console.error('Error adding customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add customer',
      error: error.message
    });
  }
});

/**
 * PUT /api/customers/:id
 * Updates an existing customer's contact and personal details.
 */
router.put('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided'
      });
    }

    const { name, email, phone, address, date_of_birth } = req.body;

    if (!name || !email || !phone || !address || !date_of_birth) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, address, and date_of_birth are all required.'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format.'
      });
    }

    const [existing] = await pool.query(
      `SELECT customer_id FROM Customer WHERE customer_id = ?`,
      [customerId]
    );
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer #${customerId} not found`
      });
    }

    await pool.query(
      `UPDATE Customer
       SET name = ?, email = ?, phone = ?, address = ?, date_of_birth = ?
       WHERE customer_id = ?`,
      [name.trim(), trimmedEmail, phone.trim(), address.trim(), date_of_birth, customerId]
    );

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: {
        customer_id: customerId,
        name: name.trim(),
        email: trimmedEmail,
        phone: phone.trim(),
        address: address.trim(),
        date_of_birth
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Another customer with this email address already exists.'
      });
    }
    console.error('Error updating customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
});

/**
 * DELETE /api/customers/:id
 * Deletes customer if and only if no associated accounts exist (ON DELETE RESTRICT enforcement).
 */
router.delete('/:id', async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID provided'
      });
    }

    const [customer] = await pool.query(
      `SELECT customer_id, name FROM Customer WHERE customer_id = ?`,
      [customerId]
    );
    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Customer #${customerId} not found`
      });
    }

    // Check dependent accounts
    const [accounts] = await pool.query(
      `SELECT COUNT(*) AS count FROM Account WHERE customer_id = ?`,
      [customerId]
    );

    if (accounts[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer #${customerId} ("${customer[0].name}"). Foreign key constraint: Customer has ${accounts[0].count} associated bank account(s). Close and remove accounts first.`
      });
    }

    await pool.query(
      `DELETE FROM Customer WHERE customer_id = ?`,
      [customerId]
    );

    return res.status(200).json({
      success: true,
      message: `Customer #${customerId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
});

module.exports = router;
