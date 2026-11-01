const express = require('express');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./db');

// Route modules
const branchesRouter = require('./routes/branches');
const customersRouter = require('./routes/customers');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/branches', branchesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Banking Management System API is active',
    timestamp: new Date().toISOString()
  });
});

// Fallback for SPA frontend routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  Banking Management System Server`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  Serving:   ${path.join(__dirname, 'public')}`);
    console.log(`====================================================`);

    // Non-blocking database connection test
    testConnection();
  });
}

module.exports = app;
