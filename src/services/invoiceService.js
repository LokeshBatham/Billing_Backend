const { v4: uuid } = require('uuid');
const Invoice = require('../models/Invoice');

const timestamp = () => new Date().toISOString();

const clone = (invoice) => ({ ...invoice });

exports.getAllInvoices = async () => {
  const docs = await Invoice.find().lean();
  return docs.map(clone);
};

exports.getInvoiceById = async (id) => {
  const doc = await Invoice.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.createInvoice = async (payload) => {
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const doc = await Invoice.create({ id, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.updateInvoice = async (id, payload) => {
  const existing = await exports.getInvoiceById(id);
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Invoice.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.deleteInvoice = async (id) => {
  const res = await Invoice.deleteOne({ id });
  return res.deletedCount > 0;
};
