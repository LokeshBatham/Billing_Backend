const { v4: uuid } = require("uuid");
const {
  generateUniqueBarcode,
  generateBarcodeImage,
} = require("../utils/barcode");
const Product = require("../models/Product");

const timestamp = () => new Date().toISOString();

const clone = (product) => ({ ...product });

exports.getAllProducts = async () => {
  const docs = await Product.find().lean();
  return docs.map(clone);
};

exports.getAllProductsByOrg = async (orgId) => {
  if (!orgId) return exports.getAllProducts();
  const docs = await Product.find({ orgId }).lean();
  return docs.map(clone);
};

exports.getProductById = async (id) => {
  const doc = await Product.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.getProductByIdAndOrg = async (id, orgId) => {
  if (!orgId) return exports.getProductById(id);
  const doc = await Product.findOne({ id, orgId }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.isSkuTaken = async (sku, excludeId) => {
  if (!sku) return false;
  const query = { sku };
  if (excludeId) query.id = { $ne: excludeId };
  return !!(await Product.exists(query));
};

exports.isSkuTakenForOrg = async (orgId, sku, excludeId) => {
  if (!sku) return false;
  if (!orgId) return exports.isSkuTaken(sku, excludeId);
  const query = { orgId, sku };
  if (excludeId) query.id = { $ne: excludeId };
  return !!(await Product.exists(query));
};

exports.createProduct = async (payload) => {
  const now = timestamp();
  const id = uuid();

  let barcode = payload.barcode;

  if (!barcode) {
    barcode = await generateUniqueBarcode();
  }

  const barcodeImage = await generateBarcodeImage(barcode);

  const doc = await Product.create({
    id,
    ...payload,
    barcode,
    barcodeImage,
    createdAt: now,
    updatedAt: now,
  });

  return clone(doc.toObject());
};

exports.updateProduct = async (id, payload) => {
  const existing = await Product.findOne({ id }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Product.findOneAndUpdate(
    { id },
    { ...payload, updatedAt },
    { new: true }
  ).lean();
  return clone(updated);
};

exports.updateProductForOrg = async (orgId, id, payload) => {
  if (!orgId) return exports.updateProduct(id, payload);
  const existing = await Product.findOne({ id, orgId }).lean();
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Product.findOneAndUpdate(
    { id, orgId },
    { ...payload, updatedAt },
    { new: true }
  ).lean();
  return clone(updated);
};

exports.deleteProduct = async (id) => {
  const res = await Product.deleteOne({ id });
  return res.deletedCount > 0;
};

exports.deleteProductForOrg = async (orgId, id) => {
  if (!orgId) return exports.deleteProduct(id);
  const res = await Product.deleteOne({ id, orgId });
  return res.deletedCount > 0;
};

exports.isBarcodeTaken = async (barcode, excludeId) => {
  if (!barcode) return false;

  const query = { barcode };
  if (excludeId) query.id = { $ne: excludeId };

  return !!(await Product.exists(query));
};

exports.isBarcodeTakenForOrg = async (orgId, barcode, excludeId) => {
  if (!barcode) return false;
  if (!orgId) return exports.isBarcodeTaken(barcode, excludeId);

  const query = { orgId, barcode };
  if (excludeId) query.id = { $ne: excludeId };

  return !!(await Product.exists(query));
};

exports.getProductByBarcodeForOrg = async (orgId, barcode) => {
  if (!barcode) return null;
  if (!orgId) {
    const doc = await Product.findOne({ barcode }).lean();
    return doc ? clone(doc) : null;
  }
  const doc = await Product.findOne({ orgId, barcode }).lean();
  return doc ? clone(doc) : null;
};
