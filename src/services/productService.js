const Product = require('../models/Product');

exports.getAllProducts = async () => {
  const products = await Product.find().lean();
  return products.map((p) => ({ ...p, id: p._id.toString() }));
};

exports.getProductById = async (id) => {
  const product = await Product.findById(id).lean();
  return product ? { ...product, id: product._id.toString() } : null;
};

exports.getProductByBarcode = async (barcode) => {
  const product = await Product.findOne({ barcode }).lean();
  return product ? { ...product, id: product._id.toString() } : null;
};

exports.createProduct = async (payload) => {
  const product = await Product.create(payload);
  return { ...product.toObject(), id: product._id.toString() };
};

exports.updateProduct = async (id, payload) => {
  const product = await Product.findByIdAndUpdate(id, payload, { new: true }).lean();
  return product ? { ...product, id: product._id.toString() } : null;
};

exports.deleteProduct = async (id) => {
  const result = await Product.findByIdAndDelete(id);
  return !!result;
};
