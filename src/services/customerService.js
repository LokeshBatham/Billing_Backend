const { v4: uuid } = require('uuid');
const Customer = require('../models/Customer');

const timestamp = () => new Date().toISOString();

const clone = (customer) => ({ ...customer });

exports.getAllCustomers = async () => {
  const docs = await Customer.find().lean();
  return docs.map(clone);
};

exports.getCustomerById = async (id) => {
  const doc = await Customer.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.searchCustomers = async (query) => {
  if (!query || query.trim() === '') return exports.getAllCustomers();
  const re = new RegExp(query.trim(), 'i');
  const docs = await Customer.find({ $or: [{ name: re }, { email: re }, { phone: re }] }).lean();
  return docs.map(clone);
};

exports.createCustomer = async (payload) => {
  const id = uuid();
  const now = timestamp();
  const doc = await Customer.create({ id, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.updateCustomer = async (id, payload) => {
  const existing = await Customer.findOne({ id }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Customer.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.deleteCustomer = async (id) => {
  const res = await Customer.deleteOne({ id });
  return res.deletedCount > 0;
};

