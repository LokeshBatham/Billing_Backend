const { pool } = require('../src/utils/db');
const dotenv = require('dotenv');

dotenv.config();

const up = async () => {
  console.log('[migrate] Running UP migrations...');

  const migrationName = '001_initial';

  const createMigrations = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      run_at VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await pool.query(createMigrations);

  // Check if migration was already applied
  const [existing] = await pool.execute('SELECT name FROM migrations WHERE name = ? LIMIT 1', [migrationName]);
  if (existing && existing.length > 0) {
    console.log('[migrate] Migration already applied:', migrationName);
    process.exit(0);
  }

  const createProducts = `
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

  await pool.query(createProducts);
  await pool.query(createCustomers);
  await pool.query(createInvoices);

  // Insert migration record
  await pool.execute('INSERT INTO migrations (name, run_at) VALUES (?, ?)', [migrationName, new Date().toISOString()]);

  console.log('[migrate] UP complete');
  process.exit(0);
};

const down = async () => {
  console.log('[migrate] Running DOWN migrations (dropping tables)...');
  await pool.query('DROP TABLE IF EXISTS invoices');
  await pool.query('DROP TABLE IF EXISTS customers');
  await pool.query('DROP TABLE IF EXISTS products');

  // remove migration record
  await pool.execute('DELETE FROM migrations WHERE name = ?', ['001_initial']);

  console.log('[migrate] DOWN complete');
  process.exit(0);
};

const run = async () => {
  const arg = process.argv[2] || 'up';
  try {
    if (arg === 'up') await up();
    else if (arg === 'down') await down();
    else {
      console.error('Usage: node migrate.js [up|down]');
      process.exit(1);
    }
  } catch (err) {
    console.error('[migrate] Error:', err);
    process.exit(1);
  }
};

run();
