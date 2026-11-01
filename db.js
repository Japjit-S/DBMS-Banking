const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'banking_management_system',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Non-blocking database connection test.
 * Allows the Express server to boot smoothly even if MySQL service is momentarily offline.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL pool (${process.env.DB_NAME || 'banking_management_system'})`);
    connection.release();
    return true;
  } catch (err) {
    console.warn(`[Database] Warning: MySQL service unreachable at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}.`);
    console.warn(`[Database] Error message: ${err.message}`);
    console.warn(`[Database] Server will continue running; please ensure MySQL is started and credentials in .env are correct.`);
    return false;
  }
}

// Support both direct pool export and destructuring
module.exports = pool;
module.exports.pool = pool;
module.exports.testConnection = testConnection;
