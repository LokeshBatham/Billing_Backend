const {
  getAllProducts,
  getAllProductsByOrg,
  getProductById,
  getProductByIdAndOrg,
  createProduct,
  updateProduct,
  updateProductForOrg,
  deleteProduct,
  deleteProductForOrg,
  isSkuTaken,
  isSkuTakenForOrg,
  isBarcodeTaken,
  isBarcodeTakenForOrg,
  getProductByBarcodeForOrg,
} = require("../services/productService");
const { isReady: dbIsReady } = require("../utils/db");
const {
  createProductSchema,
  updateProductSchema,
  normalizeProductPayload,
} = require("../validators/productValidator");

const handleZodError = (error, res) => {
  const issues = error.issues || error.errors || [];
  const details = issues.map((issue) => ({
    path: Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path || ""),
    message: issue.message || "Validation error",
  }));

  return res.status(400).json({
    error: "ValidationError",
    details,
  });
};

exports.list = async (req, res) => {
  if (!dbIsReady()) {
    return res
      .status(503)
      .json({ error: "DatabaseUnavailable", message: "Database is not ready" });
  }

  try {
    const products = req.orgId ? await getAllProductsByOrg(req.orgId) : await getAllProducts();
    return res.json(products);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch products" });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = req.orgId
      ? await getProductByIdAndOrg(req.params.id, req.orgId)
      : await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
};

exports.create = async (req, res) => {
  if (!dbIsReady()) {
    return res
      .status(503)
      .json({ error: "DatabaseUnavailable", message: "Database is not ready" });
  }
  try {
    const normalized = normalizeProductPayload(req.body);
    const validated = createProductSchema.parse(normalized);
    const payload = { ...validated, orgId: req.orgId };

    if (await isSkuTakenForOrg(req.orgId, payload.sku)) {
      return res.status(409).json({ error: "SKU already exists" });
    }

    if (payload.parentProductId) {
      const parent = req.orgId
        ? await getProductByIdAndOrg(payload.parentProductId, req.orgId)
        : await getProductById(payload.parentProductId);
      if (!parent) {
        return res.status(400).json({ error: "Parent product not found" });
      }
    }

    if (payload.barcode && (await isBarcodeTakenForOrg(req.orgId, payload.barcode))) {
      return res.status(409).json({ error: "Barcode already exists" });
    }

    try {
      const created = await createProduct(payload);
      return res.status(201).json(created);
    } catch (err) {
      if (err && err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "SKU already exists" });
      }
      throw err;
    }
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(error, res);
    }

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to create product" });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;

  if (!dbIsReady()) {
    return res
      .status(503)
      .json({ error: "DatabaseUnavailable", message: "Database is not ready" });
  }

  try {
    const existing = req.orgId
      ? await getProductByIdAndOrg(id, req.orgId)
      : await getProductById(id);

    if (!existing) {
      return res.status(404).json({ error: "Product not found" });
    }

    const normalized = normalizeProductPayload(req.body);
    const validated = updateProductSchema.parse(normalized);
    const payload = { ...validated, orgId: req.orgId };

    if (payload.barcode && (await isBarcodeTakenForOrg(req.orgId, payload.barcode, id))) {
      return res.status(409).json({ error: "Barcode already exists" });
    }

    if (payload.sku && (await isSkuTakenForOrg(req.orgId, payload.sku, id))) {
      return res.status(409).json({ error: "SKU already exists" });
    }

    if (payload.parentProductId) {
      const parent = req.orgId
        ? await getProductByIdAndOrg(payload.parentProductId, req.orgId)
        : await getProductById(payload.parentProductId);
      if (!parent) {
        return res.status(400).json({ error: "Parent product not found" });
      }
      if (parent.id === id) {
        return res
          .status(400)
          .json({ error: "Product cannot be its own parent" });
      }
    }

    try {
      const updated = req.orgId
        ? await updateProductForOrg(req.orgId, id, payload)
        : await updateProduct(id, payload);
      return res.json(updated);
    } catch (err) {
      if (err && err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "SKU already exists" });
      }
      throw err;
    }
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(error, res);
    }

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to update product" });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const removed = req.orgId ? await deleteProductForOrg(req.orgId, id) : await deleteProduct(id);

    if (!removed) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(204).send();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};

exports.getByBarcode = async (req, res) => {
  const { barcode } = req.params;

  try {
    const product = await getProductByBarcodeForOrg(req.orgId, barcode);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
};
