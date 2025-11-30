const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/jsonStore');

const DATA_FILE = path.resolve(__dirname, '../../data/invoices.json');

const timestamp = () => new Date().toISOString();

const clone = (invoice) => ({ ...invoice });

const loadInvoices = async () => {
  const data = await readJsonFile(DATA_FILE, []);
  return Array.isArray(data) ? data : [];
};

const saveInvoices = async (items) => {
  await writeJsonFile(DATA_FILE, items);
};

exports.getAllInvoices = async () => {
  const invoices = await loadInvoices();
  return invoices.map(clone);
};

exports.getInvoiceById = async (id) => {
  const invoices = await loadInvoices();
  const invoice = invoices.find((item) => item.id === id);
  return invoice ? clone(invoice) : null;
};

exports.createInvoice = async (payload) => {
  const invoices = await loadInvoices();
  const now = timestamp();
  const invoice = {
    id: payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: payload.date || now,
    createdAt: now,
    updatedAt: now,
    ...payload,
  };

  invoices.push(invoice);
  await saveInvoices(invoices);
  return clone(invoice);
};

exports.updateInvoice = async (id, payload) => {
  const invoices = await loadInvoices();
  const index = invoices.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = invoices[index];
  const updated = {
    ...current,
    ...payload,
    id,
    updatedAt: timestamp(),
  };

  invoices[index] = updated;
  await saveInvoices(invoices);

  return clone(updated);
};

exports.deleteInvoice = async (id) => {
  const invoices = await loadInvoices();
  const index = invoices.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  invoices.splice(index, 1);
  await saveInvoices(invoices);
  return true;
};

