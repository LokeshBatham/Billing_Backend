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

exports.getProductBySkuForOrg = async (orgId, sku) => {
  if (!sku) return null;
  if (!orgId) {
    const doc = await Product.findOne({ sku }).lean();
    return doc ? clone(doc) : null;
  }
  const doc = await Product.findOne({ orgId, sku }).lean();
  return doc ? clone(doc) : null;
};

/**
 * Find existing product by id, barcode, or sku (in priority order)
 */
exports.findExistingProduct = async (orgId, product) => {
  if (product.id) {
    const doc = await Product.findOne({ id: product.id, orgId }).lean();
    if (doc) return clone(doc);
  }
  if (product.barcode) {
    const doc = await Product.findOne({ barcode: product.barcode, orgId }).lean();
    if (doc) return clone(doc);
  }
  if (product.sku) {
    const doc = await Product.findOne({ sku: product.sku, orgId }).lean();
    if (doc) return clone(doc);
  }
  return null;
};

/**
 * Bulk create products - creates only new products
 * @param {Array} products - Array of product objects with row numbers
 * @param {string} orgId - Organization ID from JWT
 * @returns {Object} { success: [], errors: [] }
 */
exports.bulkCreateProducts = async (products, orgId) => {
  const success = [];
  const errors = [];
  const now = timestamp();

  for (let i = 0; i < products.length; i++) {
    const { row, ...productData } = products[i];
    try {
      // Check for duplicate SKU
      if (productData.sku) {
        const skuExists = await exports.isSkuTakenForOrg(orgId, productData.sku);
        if (skuExists) {
          errors.push({ row, error: `SKU '${productData.sku}' already exists` });
          continue;
        }
      }

      // Check for duplicate barcode
      if (productData.barcode) {
        const barcodeExists = await exports.isBarcodeTakenForOrg(orgId, productData.barcode);
        if (barcodeExists) {
          errors.push({ row, error: `Barcode '${productData.barcode}' already exists` });
          continue;
        }
      }

      // Generate barcode if not provided
      let barcode = productData.barcode;
      if (!barcode) {
        barcode = await generateUniqueBarcode();
      }

      const barcodeImage = await generateBarcodeImage(barcode);
      const id = uuid();

      const doc = await Product.create({
        id,
        ...productData,
        orgId,
        barcode,
        barcodeImage,
        createdAt: now,
        updatedAt: now,
      });

      success.push({ row, product: clone(doc.toObject()) });
    } catch (err) {
      errors.push({ row, error: err.message || 'Failed to create product' });
    }
  }

  return { success, errors };
};

/**
 * Bulk update products - updates only existing products
 * @param {Array} products - Array of product objects with row numbers
 * @param {string} orgId - Organization ID from JWT
 * @returns {Object} { success: [], notFound: [], errors: [] }
 */
exports.bulkUpdateProducts = async (products, orgId) => {
  const success = [];
  const notFound = [];
  const errors = [];
  const now = timestamp();

  for (let i = 0; i < products.length; i++) {
    const { row, ...productData } = products[i];
    try {
      // Find existing product by id, barcode, or sku
      const existing = await exports.findExistingProduct(orgId, productData);
      
      if (!existing) {
        notFound.push({ row, data: productData });
        continue;
      }

      // Check SKU uniqueness if changing
      if (productData.sku && productData.sku !== existing.sku) {
        const skuExists = await exports.isSkuTakenForOrg(orgId, productData.sku, existing.id);
        if (skuExists) {
          errors.push({ row, error: `SKU '${productData.sku}' already exists` });
          continue;
        }
      }

      // Check barcode uniqueness if changing
      if (productData.barcode && productData.barcode !== existing.barcode) {
        const barcodeExists = await exports.isBarcodeTakenForOrg(orgId, productData.barcode, existing.id);
        if (barcodeExists) {
          errors.push({ row, error: `Barcode '${productData.barcode}' already exists` });
          continue;
        }
      }

      // Regenerate barcode image if barcode changed
      let updateData = { ...productData, updatedAt: now };
      if (productData.barcode && productData.barcode !== existing.barcode) {
        updateData.barcodeImage = await generateBarcodeImage(productData.barcode);
      }

      const updated = await Product.findOneAndUpdate(
        { id: existing.id, orgId },
        updateData,
        { new: true }
      ).lean();

      success.push({ row, product: clone(updated) });
    } catch (err) {
      errors.push({ row, error: err.message || 'Failed to update product' });
    }
  }

  return { success, notFound, errors };
};

/**
 * Bulk upsert products - creates if not found, updates if found (RECOMMENDED)
 * @param {Array} products - Array of product objects with row numbers
 * @param {string} orgId - Organization ID from JWT
 * @returns {Object} { created: [], updated: [], errors: [] }
 */
exports.bulkUpsertProducts = async (products, orgId) => {
  const created = [];
  const updated = [];
  const errors = [];
  const now = timestamp();

  for (let i = 0; i < products.length; i++) {
    const { row, ...productData } = products[i];
    try {
      // Find existing product by id, barcode, or sku
      const existing = await exports.findExistingProduct(orgId, productData);

      if (existing) {
        // UPDATE existing product
        // Check SKU uniqueness if changing
        if (productData.sku && productData.sku !== existing.sku) {
          const skuExists = await exports.isSkuTakenForOrg(orgId, productData.sku, existing.id);
          if (skuExists) {
            errors.push({ row, error: `SKU '${productData.sku}' already exists` });
            continue;
          }
        }

        // Check barcode uniqueness if changing
        if (productData.barcode && productData.barcode !== existing.barcode) {
          const barcodeExists = await exports.isBarcodeTakenForOrg(orgId, productData.barcode, existing.id);
          if (barcodeExists) {
            errors.push({ row, error: `Barcode '${productData.barcode}' already exists` });
            continue;
          }
        }

        // Regenerate barcode image if barcode changed
        let updateData = { ...productData, updatedAt: now };
        if (productData.barcode && productData.barcode !== existing.barcode) {
          updateData.barcodeImage = await generateBarcodeImage(productData.barcode);
        }

        const updatedDoc = await Product.findOneAndUpdate(
          { id: existing.id, orgId },
          updateData,
          { new: true }
        ).lean();

        updated.push({ row, product: clone(updatedDoc) });
      } else {
        // CREATE new product
        // Check for duplicate SKU
        if (productData.sku) {
          const skuExists = await exports.isSkuTakenForOrg(orgId, productData.sku);
          if (skuExists) {
            errors.push({ row, error: `SKU '${productData.sku}' already exists` });
            continue;
          }
        }

        // Check for duplicate barcode
        if (productData.barcode) {
          const barcodeExists = await exports.isBarcodeTakenForOrg(orgId, productData.barcode);
          if (barcodeExists) {
            errors.push({ row, error: `Barcode '${productData.barcode}' already exists` });
            continue;
          }
        }

        // Generate barcode if not provided
        let barcode = productData.barcode;
        if (!barcode) {
          barcode = await generateUniqueBarcode();
        }

        const barcodeImage = await generateBarcodeImage(barcode);
        const id = uuid();

        const doc = await Product.create({
          id,
          ...productData,
          orgId,
          barcode,
          barcodeImage,
          createdAt: now,
          updatedAt: now,
        });

        created.push({ row, product: clone(doc.toObject()) });
      }
    } catch (err) {
      errors.push({ row, error: err.message || 'Failed to process product' });
    }
  }

  return { created, updated, errors };
};
