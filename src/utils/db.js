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

let _ready = false;

const isReady = () => _ready;

const init = async () => {
  // Creates a lightweight products table if it doesn't exist yet.
  // Keeps a flexible `meta` JSON column for payloads that don't match columns.
  const createTable = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      sku VARCHAR(100) DEFAULT NULL,
      name VARCHAR(255) DEFAULT NULL,
      category VARCHAR(255) DEFAULT NULL,
      unit VARCHAR(100) DEFAULT NULL,
      purchasePrice DECIMAL(14,2) DEFAULT NULL,
      sellingPrice DECIMAL(14,2) DEFAULT NULL,
      price DECIMAL(14,2) DEFAULT NULL,
      taxRate DECIMAL(7,4) DEFAULT NULL,
      stock INT DEFAULT 0,
      reorderLevel INT DEFAULT 0,
      barcode VARCHAR(255) DEFAULT NULL,
      brand VARCHAR(255) DEFAULT NULL,
      hsn VARCHAR(100) DEFAULT NULL,
      discount DECIMAL(14,4) DEFAULT NULL,
      discountType VARCHAR(20) DEFAULT 'percentage',
      supplier VARCHAR(255) DEFAULT NULL,
      batch VARCHAR(255) DEFAULT NULL,
      expiry VARCHAR(50) DEFAULT NULL,
      mfg VARCHAR(50) DEFAULT NULL,
      image TEXT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      location VARCHAR(255) DEFAULT NULL,
      weight VARCHAR(100) DEFAULT NULL,
      color VARCHAR(100) DEFAULT NULL,
      size VARCHAR(100) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'active',
      isFavorite TINYINT(1) DEFAULT 0,
      isBestSeller TINYINT(1) DEFAULT 0,
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
      company VARCHAR(255) DEFAULT NULL,
      taxId VARCHAR(100) DEFAULT NULL,
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

  // mark ready after ensuring schema
  _ready = true;
};

module.exports = {
  pool,
  init,
  isReady,
};
