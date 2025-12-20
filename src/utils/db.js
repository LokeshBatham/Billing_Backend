const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'localhost',
  database: 'billing_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL || '10', 10),
  queueLimit: 0,
});

const init = async () => {
  // Creates a lightweight products table if it doesn't exist yet.
  // Keeps a flexible `meta` JSON column for payloads that don't match columns.
  const createTable = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      sku VARCHAR(100) DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      description TEXT DEFAULT NULL,
      price DECIMAL(14,2) DEFAULT NULL,
      meta JSON DEFAULT (JSON_OBJECT()),
      createdAt VARCHAR(50) DEFAULT NULL,
      updatedAt VARCHAR(50) DEFAULT NULL,
      UNIQUE KEY unique_sku (sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createTable);

  const createCustomers = `
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      name VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      phone VARCHAR(50) DEFAULT NULL,
      address TEXT DEFAULT NULL,
      meta JSON DEFAULT (JSON_OBJECT()),
      createdAt VARCHAR(50) DEFAULT NULL,
      updatedAt VARCHAR(50) DEFAULT NULL,
      UNIQUE KEY unique_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createCustomers);

  const createInvoices = `
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(100) NOT NULL PRIMARY KEY,
      customerId VARCHAR(36) DEFAULT NULL,
      date VARCHAR(50) DEFAULT NULL,
      items JSON DEFAULT (JSON_ARRAY()),
      total DECIMAL(14,2) DEFAULT NULL,
      status VARCHAR(50) DEFAULT NULL,
      meta JSON DEFAULT (JSON_OBJECT()),
      createdAt VARCHAR(50) DEFAULT NULL,
      updatedAt VARCHAR(50) DEFAULT NULL,
      INDEX idx_customer (customerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createInvoices);

  const createMigrations = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      run_at VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createMigrations);
};

module.exports = {
  pool,
  init,
};
