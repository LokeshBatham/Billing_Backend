const { v4: uuid } = require('uuid');
const { pool } = require('../utils/db');

const timestamp = () => new Date().toISOString();

const clone = (product) => ({ ...product });

const rowToProduct = (row) => {
  if (!row) return null;
  let meta = {};
  try {
    meta = row.meta ? JSON.parse(row.meta) : {};
  } catch (e) {
    meta = {};
  }

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
    ...meta,
  };
};

exports.getAllProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM products');
  return rows.map(rowToProduct).map(clone);
};

exports.getProductById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return clone(rowToProduct(rows[0]));
};

exports.isSkuTaken = async (sku, excludeId) => {
  if (!sku) return false;
  if (excludeId) {
    const [rows] = await pool.execute('SELECT id FROM products WHERE sku = ? AND id != ? LIMIT 1', [sku, excludeId]);
    return rows && rows.length > 0;
  }
  const [rows] = await pool.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', [sku]);
  return rows && rows.length > 0;
};

exports.createProduct = async (payload) => {
  const id = uuid();
  const now = timestamp();

  const sku = payload.sku || null;
  const name = payload.name || null;
  const description = payload.description || null;
  const price = payload.price !== undefined ? payload.price : null;
  const meta = { ...payload };

  // Remove known columns from meta to avoid duplication
  delete meta.sku;
  delete meta.name;
  delete meta.description;
  delete meta.price;

  await pool.execute(
    `INSERT INTO products (id, sku, name, description, price, meta, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, sku, name, description, price, JSON.stringify(meta), now, now]
  );

  return clone({ id, sku, name, description, price, createdAt: now, updatedAt: now, ...meta });
};

exports.updateProduct = async (id, payload) => {
  const existing = await exports.getProductById(id);
  if (!existing) return null;

  const updatedAt = timestamp();

  const sku = payload.sku !== undefined ? payload.sku : existing.sku;
  const name = payload.name !== undefined ? payload.name : existing.name;
  const description = payload.description !== undefined ? payload.description : existing.description;
  const price = payload.price !== undefined ? payload.price : existing.price;

  const meta = { ...existing };
  // Remove known fields
  delete meta.id;
  delete meta.sku;
  delete meta.name;
  delete meta.description;
  delete meta.price;
  delete meta.createdAt;
  delete meta.updatedAt;

  // Merge with new payload fields that are not primary columns
  const newMeta = { ...meta, ...(payload.meta || {}) };

  await pool.execute(
    `UPDATE products SET sku = ?, name = ?, description = ?, price = ?, meta = ?, updatedAt = ? WHERE id = ?`,
    [sku, name, description, price, JSON.stringify(newMeta), updatedAt, id]
  );

  return clone({ id, sku, name, description, price, createdAt: existing.createdAt, updatedAt, ...newMeta });
};

exports.deleteProduct = async (id) => {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  // result.affectedRows or result.affectedRows depending on driver
  const affected = result && (result.affectedRows || result.affectedRows === 0 ? result.affectedRows : result.affectedRows);
  return affected > 0;
};

