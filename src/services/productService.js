const path = require('path');
const { v4: uuid } = require('uuid');
const { readJsonFile, writeJsonFile } = require('../utils/jsonStore');

const DATA_FILE = path.resolve(__dirname, '../../data/products.json');

const timestamp = () => new Date().toISOString();

const clone = (product) => ({ ...product });

const loadProducts = async () => {
  const data = await readJsonFile(DATA_FILE, []);
  return Array.isArray(data) ? data : [];
};

const saveProducts = async (items) => {
  await writeJsonFile(DATA_FILE, items);
};

exports.getAllProducts = async () => {
  const products = await loadProducts();
  return products.map(clone);
};

exports.getProductById = async (id) => {
  const products = await loadProducts();
  const product = products.find((item) => item.id === id);
  return product ? clone(product) : null;
};

exports.isSkuTaken = async (sku, excludeId) => {
  const products = await loadProducts();
  return products.some((product) => product.sku === sku && product.id !== excludeId);
};

exports.createProduct = async (payload) => {
  const products = await loadProducts();
  const now = timestamp();
  const product = {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    ...payload,
  };

  products.push(product);
  await saveProducts(products);
  return clone(product);
};

exports.updateProduct = async (id, payload) => {
  const products = await loadProducts();
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = products[index];
  const updated = {
    ...current,
    ...payload,
    id,
    updatedAt: timestamp(),
  };

  products[index] = updated;
  await saveProducts(products);

  return clone(updated);
};

exports.deleteProduct = async (id) => {
  const products = await loadProducts();
  const index = products.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  products.splice(index, 1);
  await saveProducts(products);
  return true;
};

