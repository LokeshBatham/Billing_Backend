const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');
const Customer = require('../src/models/Customer');
const Invoice = require('../src/models/Invoice');

dotenv.config();

const up = async () => {
  console.log('[migrate] Connecting to MongoDB...');
  const uri = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/billing_db';
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB_NAME || 'billing_db' });

  console.log('[migrate] Ensuring indexes...');
  try {
    await Promise.all([Product.init(), Customer.init(), Invoice.init()]);
  } catch (err) {
    console.error('[migrate] Index creation error:', err);
  }

  console.log('[migrate] UP complete');
  await mongoose.disconnect();
  process.exit(0);
};

const down = async () => {
  console.log('[migrate] DOWN is destructive for MongoDB and not implemented.');
  process.exit(1);
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
