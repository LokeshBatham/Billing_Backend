const { v4: uuid } = require('uuid');
const { pool } = require('../utils/db');

const timestamp = () => new Date().toISOString();

const clone = (product) => ({ ...product });

const rowToProduct = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    purchasePrice: row.purchasePrice !== null && row.purchasePrice !== undefined ? Number(row.purchasePrice) : null,
    sellingPrice: row.sellingPrice !== null && row.sellingPrice !== undefined ? Number(row.sellingPrice) : null,
    price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
    taxRate: row.taxRate !== null && row.taxRate !== undefined ? Number(row.taxRate) : null,
    stock: row.stock !== null && row.stock !== undefined ? Number(row.stock) : 0,
    reorderLevel: row.reorderLevel !== null && row.reorderLevel !== undefined ? Number(row.reorderLevel) : 0,
    barcode: row.barcode,
    brand: row.brand,
    hsn: row.hsn,
    discount: row.discount !== null && row.discount !== undefined ? Number(row.discount) : null,
    discountType: row.discountType,
    supplier: row.supplier,
    batch: row.batch,
    expiry: row.expiry,
    mfg: row.mfg,
    image: row.image,
    description: row.description,
    location: row.location,
    weight: row.weight,
    color: row.color,
    size: row.size,
    status: row.status,
    isFavorite: !!row.isFavorite,
    isBestSeller: !!row.isBestSeller,
    createdAt: row.createdAt || null,
    updatedAt: row.updatedAt || null,
  };
};

exports.getAllProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM products');
  return rows.map(rowToProduct).map(clone);
};

exports.getProductById = async (id) => {
  const [rows] = await pool.execute('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  return clone(rowToProduct(rows[0]));
};

exports.isSkuTaken = async (sku, excludeId) => {
  if (!sku) return false;
  if (excludeId) {
    const [rows] = await pool.execute('SELECT id FROM products WHERE sku = ? AND id != ? LIMIT 1', [sku, excludeId]);
    return rows && rows.length > 0;
  }
  const [rows] = await pool.execute('SELECT id FROM products WHERE sku = ? LIMIT 1', [sku]);
  return rows && rows.length > 0;
};

exports.createProduct = async (payload) => {
  const id = uuid();
  const now = timestamp();
  const cols = {
    sku: payload.sku || null,
    name: payload.name || null,
    category: payload.category || null,
    unit: payload.unit || null,
    purchasePrice: payload.purchasePrice !== undefined ? payload.purchasePrice : null,
    sellingPrice: payload.sellingPrice !== undefined ? payload.sellingPrice : null,
    price: payload.price !== undefined ? payload.price : null,
    taxRate: payload.taxRate !== undefined ? payload.taxRate : null,
    stock: payload.stock !== undefined ? payload.stock : 0,
    reorderLevel: payload.reorderLevel !== undefined ? payload.reorderLevel : 0,
    barcode: payload.barcode || null,
    brand: payload.brand || null,
    hsn: payload.hsn || null,
    discount: payload.discount !== undefined ? payload.discount : null,
    discountType: payload.discountType || 'percentage',
    supplier: payload.supplier || null,
    batch: payload.batch || null,
    expiry: payload.expiry || null,
    mfg: payload.mfg || null,
    image: payload.image || null,
    description: payload.description || null,
    location: payload.location || null,
    weight: payload.weight || null,
    color: payload.color || null,
    size: payload.size || null,
    status: payload.status || 'active',
    isFavorite: payload.isFavorite ? 1 : 0,
    isBestSeller: payload.isBestSeller ? 1 : 0,
  };

  await pool.execute(
    `INSERT INTO products (
      id, sku, name, category, unit, purchasePrice, sellingPrice, price,
      taxRate, stock, reorderLevel, barcode, brand, hsn, discount, discountType,
      supplier, batch, expiry, mfg, image, description, location, weight,
      color, size, status, isFavorite, isBestSeller, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      cols.sku,
      cols.name,
      cols.category,
      cols.unit,
      cols.purchasePrice,
      cols.sellingPrice,
      cols.price,
      cols.taxRate,
      cols.stock,
      cols.reorderLevel,
      cols.barcode,
      cols.brand,
      cols.hsn,
      cols.discount,
      cols.discountType,
      cols.supplier,
      cols.batch,
      cols.expiry,
      cols.mfg,
      cols.image,
      cols.description,
      cols.location,
      cols.weight,
      cols.color,
      cols.size,
      cols.status,
      cols.isFavorite,
      cols.isBestSeller,
      now,
      now,
    ]
  );

  return clone({ id, ...cols, createdAt: now, updatedAt: now });
};

exports.updateProduct = async (id, payload) => {
  const existing = await exports.getProductById(id);
  if (!existing) return null;

  const updatedAt = timestamp();

  const sku = payload.sku !== undefined ? payload.sku : existing.sku;
  const name = payload.name !== undefined ? payload.name : existing.name;
  const description = payload.description !== undefined ? payload.description : existing.description;
  const price = payload.price !== undefined ? payload.price : existing.price;

  const cols = {
    sku: payload.sku !== undefined ? payload.sku : existing.sku,
    name: payload.name !== undefined ? payload.name : existing.name,
    category: payload.category !== undefined ? payload.category : existing.category,
    unit: payload.unit !== undefined ? payload.unit : existing.unit,
    purchasePrice: payload.purchasePrice !== undefined ? payload.purchasePrice : existing.purchasePrice,
    sellingPrice: payload.sellingPrice !== undefined ? payload.sellingPrice : existing.sellingPrice,
    price: payload.price !== undefined ? payload.price : existing.price,
    taxRate: payload.taxRate !== undefined ? payload.taxRate : existing.taxRate,
    stock: payload.stock !== undefined ? payload.stock : existing.stock,
    reorderLevel: payload.reorderLevel !== undefined ? payload.reorderLevel : existing.reorderLevel,
    barcode: payload.barcode !== undefined ? payload.barcode : existing.barcode,
    brand: payload.brand !== undefined ? payload.brand : existing.brand,
    hsn: payload.hsn !== undefined ? payload.hsn : existing.hsn,
    discount: payload.discount !== undefined ? payload.discount : existing.discount,
    discountType: payload.discountType !== undefined ? payload.discountType : existing.discountType,
    supplier: payload.supplier !== undefined ? payload.supplier : existing.supplier,
    batch: payload.batch !== undefined ? payload.batch : existing.batch,
    expiry: payload.expiry !== undefined ? payload.expiry : existing.expiry,
    mfg: payload.mfg !== undefined ? payload.mfg : existing.mfg,
    image: payload.image !== undefined ? payload.image : existing.image,
    description: payload.description !== undefined ? payload.description : existing.description,
    location: payload.location !== undefined ? payload.location : existing.location,
    weight: payload.weight !== undefined ? payload.weight : existing.weight,
    color: payload.color !== undefined ? payload.color : existing.color,
    size: payload.size !== undefined ? payload.size : existing.size,
    status: payload.status !== undefined ? payload.status : existing.status,
    isFavorite: payload.isFavorite !== undefined ? (payload.isFavorite ? 1 : 0) : (existing.isFavorite ? 1 : 0),
    isBestSeller: payload.isBestSeller !== undefined ? (payload.isBestSeller ? 1 : 0) : (existing.isBestSeller ? 1 : 0),
  };

  await pool.execute(
    `UPDATE products SET
      sku = ?, name = ?, category = ?, unit = ?, purchasePrice = ?, sellingPrice = ?, price = ?,
      taxRate = ?, stock = ?, reorderLevel = ?, barcode = ?, brand = ?, hsn = ?, discount = ?, discountType = ?,
      supplier = ?, batch = ?, expiry = ?, mfg = ?, image = ?, description = ?, location = ?, weight = ?,
      color = ?, size = ?, status = ?, isFavorite = ?, isBestSeller = ?, updatedAt = ?
     WHERE id = ?`,
    [
      cols.sku,
      cols.name,
      cols.category,
      cols.unit,
      cols.purchasePrice,
      cols.sellingPrice,
      cols.price,
      cols.taxRate,
      cols.stock,
      cols.reorderLevel,
      cols.barcode,
      cols.brand,
      cols.hsn,
      cols.discount,
      cols.discountType,
      cols.supplier,
      cols.batch,
      cols.expiry,
      cols.mfg,
      cols.image,
      cols.description,
      cols.location,
      cols.weight,
      cols.color,
      cols.size,
      cols.status,
      cols.isFavorite,
      cols.isBestSeller,
      updatedAt,
      id,
    ]
  );

  return clone({ id, ...cols, createdAt: existing.createdAt, updatedAt });
};

exports.deleteProduct = async (id) => {
  const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
  // result.affectedRows or result.affectedRows depending on driver
  const affected = result && (result.affectedRows || result.affectedRows === 0 ? result.affectedRows : result.affectedRows);
  return affected > 0;
};

