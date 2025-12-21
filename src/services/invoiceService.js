const { v4: uuid } = require('uuid');
const { pool } = require('../utils/db');

const timestamp = () => new Date().toISOString();

const clone = (invoice) => ({ ...invoice });

const rowToInvoice = (row) => {
  if (!row) return null;
  let items = [];
  try {
    items = row.items ? JSON.parse(row.items) : [];
  } catch (e) {
    items = [];
  }

  return {
    id: row.id,
    customerId: row.customerId,
    date: row.date || null,
    items,
    total: row.total !== null && row.total !== undefined ? Number(row.total) : null,
    status: row.status || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
};

exports.getAllInvoices = async () => {
  const [rows] = await pool.query('SELECT * FROM invoices');
  return rows.map(rowToInvoice).map(clone);
};

exports.getInvoiceById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM invoices WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return clone(rowToInvoice(rows[0]));
};

exports.createInvoice = async (payload) => {
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const date = payload.date || now;
  const customerId = payload.customerId || null;
  const items = payload.items || [];
  const total = payload.total !== undefined ? payload.total : null;
  const status = payload.status || 'draft';
  await pool.execute(
    `INSERT INTO invoices (id, customerId, date, items, total, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customerId, date, JSON.stringify(items), total, status, now, now]
  );

  return clone({ id, customerId, date, items, total, status, createdAt: now, updatedAt: now });
};

exports.updateInvoice = async (id, payload) => {
  const existing = await exports.getInvoiceById(id);
  if (!existing) return null;

  const updatedAt = timestamp();

  const date = payload.date !== undefined ? payload.date : existing.date;
  const customerId = payload.customerId !== undefined ? payload.customerId : existing.customerId;
  const items = payload.items !== undefined ? payload.items : existing.items;
  const total = payload.total !== undefined ? payload.total : existing.total;
  const status = payload.status !== undefined ? payload.status : existing.status;
  await pool.execute(
    `UPDATE invoices SET customerId = ?, date = ?, items = ?, total = ?, status = ?, updatedAt = ? WHERE id = ?`,
    [customerId, date, JSON.stringify(items), total, status, updatedAt, id]
  );

  return clone({ id, customerId, date, items, total, status, createdAt: existing.createdAt, updatedAt });
};

exports.deleteInvoice = async (id) => {
  const [result] = await pool.execute('DELETE FROM invoices WHERE id = ?', [id]);
  const affected = result && (result.affectedRows || result.affectedRows === 0 ? result.affectedRows : result.affectedRows);
  return affected > 0;
};

