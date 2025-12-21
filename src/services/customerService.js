const { v4: uuid } = require('uuid');
const { pool } = require('../utils/db');

const timestamp = () => new Date().toISOString();

const clone = (customer) => ({ ...customer });

const rowToCustomer = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    company: row.company || null,
    taxId: row.taxId || null,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
};

exports.getAllCustomers = async () => {
  const [rows] = await pool.query('SELECT * FROM customers');
  return rows.map(rowToCustomer).map(clone);
};

exports.getCustomerById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM customers WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return clone(rowToCustomer(rows[0]));
};

exports.searchCustomers = async (query) => {
  if (!query || query.trim() === '') {
    return exports.getAllCustomers();
  }

  const term = `%${query.trim()}%`;
  const [rows] = await pool.execute(
    `SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?`,
    [term, term, term]
  );

  return rows.map(rowToCustomer).map(clone);
};

exports.createCustomer = async (payload) => {
  const id = uuid();
  const now = timestamp();
  const name = payload.name || null;
  const email = payload.email || null;
  const phone = payload.phone || null;
  const address = payload.address || null;
  const company = payload.company || null;
  const taxId = payload.taxId || null;

  await pool.execute(
    `INSERT INTO customers (id, name, email, phone, address, company, taxId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email, phone, address, company, taxId, now, now]
  );

  return clone({ id, name, email, phone, address, company, taxId, createdAt: now, updatedAt: now });
};

exports.updateCustomer = async (id, payload) => {
  const existing = await exports.getCustomerById(id);
  if (!existing) return null;

  const updatedAt = timestamp();

  const name = payload.name !== undefined ? payload.name : existing.name;
  const email = payload.email !== undefined ? payload.email : existing.email;
  const phone = payload.phone !== undefined ? payload.phone : existing.phone;
  const address = payload.address !== undefined ? payload.address : existing.address;
  const company = payload.company !== undefined ? payload.company : existing.company;
  const taxId = payload.taxId !== undefined ? payload.taxId : existing.taxId;

  await pool.execute(
    `UPDATE customers SET name = ?, email = ?, phone = ?, address = ?, company = ?, taxId = ?, updatedAt = ? WHERE id = ?`,
    [name, email, phone, address, company, taxId, updatedAt, id]
  );

  return clone({ id, name, email, phone, address, company, taxId, createdAt: existing.createdAt, updatedAt, });
};

exports.deleteCustomer = async (id) => {
  const [result] = await pool.execute('DELETE FROM customers WHERE id = ?', [id]);
  const affected = result && (result.affectedRows || result.affectedRows === 0 ? result.affectedRows : result.affectedRows);
  return affected > 0;
};

