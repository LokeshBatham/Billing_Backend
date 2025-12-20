const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  isSkuTaken,
} = require('../services/productService');
const {
  createProductSchema,
  updateProductSchema,
  normalizeProductPayload,
} = require('../validators/productValidator');

const handleZodError = (error, res) => {
  const details = error.errors.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return res.status(400).json({
    error: 'ValidationError',
    details,
  });
};

exports.list = async (_req, res) => {
  try {
    const products = await getAllProducts();
    return res.json(products);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
};

exports.create = async (req, res) => {
  try {
    const normalized = normalizeProductPayload(req.body);
    const validated = createProductSchema.parse(normalized);

    if (await isSkuTaken(validated.sku)) {
      return res.status(409).json({ error: 'SKU already exists' });
    }

    if (validated.parentProductId) {
      const parent = await getProductById(validated.parentProductId);
      if (!parent) {
        return res.status(400).json({ error: 'Parent product not found' });
      }
    }

    try {
      const created = await createProduct(validated);
      return res.status(201).json(created);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU already exists' });
      }
      throw err;
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return handleZodError(error, res);
    }

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await getProductById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const normalized = normalizeProductPayload(req.body);
    const validated = updateProductSchema.parse(normalized);

    if (validated.sku && (await isSkuTaken(validated.sku, id))) {
      return res.status(409).json({ error: 'SKU already exists' });
    }

    if (validated.parentProductId) {
      const parent = await getProductById(validated.parentProductId);
      if (!parent) {
        return res.status(400).json({ error: 'Parent product not found' });
      }
      if (parent.id === id) {
        return res.status(400).json({ error: 'Product cannot be its own parent' });
      }
    }

    try {
      const updated = await updateProduct(id, validated);
      return res.json(updated);
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'SKU already exists' });
      }
      throw err;
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return handleZodError(error, res);
    }

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const removed = await deleteProduct(id);

    if (!removed) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(204).send();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

