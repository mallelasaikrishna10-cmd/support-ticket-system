const mysql = require('mysql2/promise');
const config = require('./environment');

// Create MySQL connection pool using parameterized configuration
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Test Database Connection
 */
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(` MySQL Database Connected: ${config.db.database} on ${config.db.host}:${config.db.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(' MySQL Database Connection Failed:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
