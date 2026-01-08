const { v4: uuid } = require('uuid');
const Customer = require('../models/Customer');

const timestamp = () => new Date().toISOString();

const clone = (customer) => ({ ...customer });

exports.getAllCustomers = async () => {
  const docs = await Customer.find().lean();
  return docs.map(clone);
};

exports.getAllCustomersByOrg = async (orgId) => {
  if (!orgId) return exports.getAllCustomers();
  const docs = await Customer.find({ orgId }).lean();
  return docs.map(clone);
};

exports.getCustomerById = async (id) => {
  const doc = await Customer.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.getCustomerByIdAndOrg = async (id, orgId) => {
  if (!orgId) return exports.getCustomerById(id);
  const doc = await Customer.findOne({ id, orgId }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.searchCustomers = async (query) => {
  if (!query || query.trim() === '') return exports.getAllCustomers();
  const re = new RegExp(query.trim(), 'i');
  const docs = await Customer.find({ $or: [{ name: re }, { email: re }, { phone: re }] }).lean();
  return docs.map(clone);
};

exports.searchCustomersForOrg = async (orgId, query) => {
  if (!orgId) return exports.searchCustomers(query);
  if (!query || query.trim() === '') return exports.getAllCustomersByOrg(orgId);
  const re = new RegExp(query.trim(), 'i');
  const docs = await Customer.find({
    orgId,
    $or: [{ name: re }, { email: re }, { phone: re }],
  }).lean();
  return docs.map(clone);
};

exports.createCustomer = async (payload) => {
  const id = uuid();
  const now = timestamp();
  const doc = await Customer.create({ id, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.createCustomerForOrg = async (orgId, payload) => {
  if (!orgId) return exports.createCustomer(payload);
  const id = uuid();
  const now = timestamp();
  const doc = await Customer.create({ id, orgId, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.updateCustomer = async (id, payload) => {
  const existing = await Customer.findOne({ id }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Customer.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.updateCustomerForOrg = async (orgId, id, payload) => {
  if (!orgId) return exports.updateCustomer(id, payload);
  const existing = await Customer.findOne({ id, orgId }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Customer.findOneAndUpdate(
    { id, orgId },
    { ...payload, updatedAt },
    { new: true }
  ).lean();
  return clone(updated);
};

exports.deleteCustomer = async (id) => {
  const res = await Customer.deleteOne({ id });
  return res.deletedCount > 0;
};

exports.deleteCustomerForOrg = async (orgId, id) => {
  if (!orgId) return exports.deleteCustomer(id);
  const res = await Customer.deleteOne({ id, orgId });
  return res.deletedCount > 0;
};

