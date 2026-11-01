const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/branches
 * Returns all branches ordered by branch_id for form dropdowns and listings.
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT branch_id, branch_name, IFSC_code, address
       FROM Branch
       ORDER BY branch_id ASC`
    );

    return res.status(200).json({
      success: true,
      message: 'Branches retrieved successfully',
      data: rows
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve branches',
      error: error.message
    });
  }
});

module.exports = router;
