const { v4: uuid } = require('uuid');
const Invoice = require('../models/Invoice');

const timestamp = () => new Date().toISOString();

const clone = (invoice) => ({ ...invoice });

exports.getAllInvoices = async () => {
  const docs = await Invoice.find().lean();
  return docs.map(clone);
};

exports.getAllInvoicesByOrg = async (orgId) => {
  if (!orgId) return exports.getAllInvoices();
  const docs = await Invoice.find({ orgId }).lean();
  return docs.map(clone);
};

exports.getInvoiceById = async (id) => {
  const doc = await Invoice.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.getInvoiceByIdAndOrg = async (id, orgId) => {
  if (!orgId) return exports.getInvoiceById(id);
  const doc = await Invoice.findOne({ id, orgId }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.createInvoice = async (payload) => {
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const doc = await Invoice.create({ id, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.createInvoiceForOrg = async (orgId, payload) => {
  if (!orgId) return exports.createInvoice(payload);
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const doc = await Invoice.create({ id, orgId, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.updateInvoice = async (id, payload) => {
  const existing = await exports.getInvoiceById(id);
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Invoice.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.updateInvoiceForOrg = async (orgId, id, payload) => {
  if (!orgId) return exports.updateInvoice(id, payload);
  const existing = await exports.getInvoiceByIdAndOrg(id, orgId);
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Invoice.findOneAndUpdate(
    { id, orgId },
    { ...payload, updatedAt },
    { new: true }
  ).lean();
  return clone(updated);
};

exports.deleteInvoice = async (id) => {
  const res = await Invoice.deleteOne({ id });
  return res.deletedCount > 0;
};

exports.deleteInvoiceForOrg = async (orgId, id) => {
  if (!orgId) return exports.deleteInvoice(id);
  const res = await Invoice.deleteOne({ id, orgId });
  return res.deletedCount > 0;
};
