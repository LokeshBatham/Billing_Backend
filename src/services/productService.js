const { v4: uuid } = require('uuid');
const Product = require('../models/Product');

const timestamp = () => new Date().toISOString();

const clone = (product) => ({ ...product });

exports.getAllProducts = async () => {
  const docs = await Product.find().lean();
  return docs.map(clone);
};

exports.getProductById = async (id) => {
  const doc = await Product.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.isSkuTaken = async (sku, excludeId) => {
  if (!sku) return false;
  const query = { sku };
  if (excludeId) query.id = { $ne: excludeId };
  return !!(await Product.exists(query));
};

exports.createProduct = async (payload) => {
  const now = timestamp();
  const id = uuid();
  const doc = await Product.create({ id, ...payload, createdAt: now, updatedAt: now });
  return clone(doc.toObject());
};

exports.updateProduct = async (id, payload) => {
  const existing = await Product.findOne({ id }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Product.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.deleteProduct = async (id) => {
  const res = await Product.deleteOne({ id });
  return res.deletedCount > 0;
};
