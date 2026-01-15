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
  bulkCreateProducts,
  bulkUpdateProducts,
  bulkUpsertProducts,
} = require("../services/productService");
const { isReady: dbIsReady } = require("../utils/db");
const XLSX = require("xlsx");
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

// Excel column mapping (case-insensitive, space-agnostic)
const COLUMN_MAPPING = {
  'name': 'name',
  'sku': 'sku',
  'barcode': 'barcode',
  'sellingprice': 'sellingPrice',
  'selling_price': 'sellingPrice',
  'selling price': 'sellingPrice',
  'purchaseprice': 'purchasePrice',
  'purchase_price': 'purchasePrice',
  'purchase price': 'purchasePrice',
  'stock': 'stock',
  'taxrate': 'taxRate',
  'tax_rate': 'taxRate',
  'tax rate': 'taxRate',
  'category': 'category',
  'brand': 'brand',
  'hsn': 'hsn',
  'id': 'id',
  'description': 'description',
};

const normalizeHeader = (header) => {
  if (!header) return '';
  return String(header).toLowerCase().trim().replace(/[\s_]+/g, '');
};

const mapColumnName = (header) => {
  const normalized = normalizeHeader(header);
  // Check direct mapping
  for (const [key, value] of Object.entries(COLUMN_MAPPING)) {
    if (normalizeHeader(key) === normalized) {
      return value;
    }
  }
  return null;
};

const parseNumeric = (value) => {
  if (value === null || value === undefined || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
};

const transformExcelRow = (row, headerMap, rowIndex) => {
  const product = { row: rowIndex };
  
  for (const [excelHeader, fieldName] of Object.entries(headerMap)) {
    const value = row[excelHeader];
    if (value === undefined || value === null || value === '') continue;
    
    // Convert numeric fields
    if (['sellingPrice', 'purchasePrice', 'stock', 'taxRate'].includes(fieldName)) {
      product[fieldName] = parseNumeric(value);
    } else {
      product[fieldName] = String(value).trim();
    }
  }
  
  return product;
};

const validateProductRow = (product) => {
  const errors = [];
  
  if (!product.name || !product.name.trim()) {
    errors.push('Name is required');
  }
  
  if (product.sellingPrice !== undefined && product.sellingPrice < 0) {
    errors.push('Selling price cannot be negative');
  }
  
  if (product.purchasePrice !== undefined && product.purchasePrice < 0) {
    errors.push('Purchase price cannot be negative');
  }
  
  if (product.stock !== undefined && product.stock < 0) {
    errors.push('Stock cannot be negative');
  }
  
  if (product.taxRate !== undefined && (product.taxRate < 0 || product.taxRate > 100)) {
    errors.push('Tax rate must be between 0 and 100');
  }
  
  return errors;
};

exports.bulkUpload = async (req, res) => {
  if (!dbIsReady()) {
    return res.status(503).json({ 
      error: "DatabaseUnavailable", 
      message: "Database is not ready" 
    });
  }

  try {
    // Validate file existence
    if (!req.file) {
      return res.status(400).json({ 
        error: "NoFileProvided", 
        message: "Please upload an Excel file (.xlsx or .xls)" 
      });
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
    
    if (!allowedMimeTypes.includes(req.file.mimetype) && !allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: "InvalidFileType", 
        message: "Only Excel files (.xlsx, .xls) are allowed" 
      });
    }

    // Get operation type (default: upsert)
    const operation = (req.query.operation || 'upsert').toLowerCase();
    if (!['create', 'update', 'upsert'].includes(operation)) {
      return res.status(400).json({ 
        error: "InvalidOperation", 
        message: "Operation must be 'create', 'update', or 'upsert'" 
      });
    }

    // Parse Excel file from buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return res.status(400).json({ 
        error: "EmptyWorkbook", 
        message: "Excel file has no sheets" 
      });
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawData.length < 2) {
      return res.status(400).json({ 
        error: "NoDataRows", 
        message: "Excel file must have a header row and at least one data row" 
      });
    }

    // Validate max rows (5000)
    if (rawData.length > 5001) {
      return res.status(400).json({ 
        error: "TooManyRows", 
        message: "Maximum 5000 data rows allowed per upload" 
      });
    }

    // Parse headers and create mapping
    const headers = rawData[0];
    const headerMap = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const mappedField = mapColumnName(header);
      if (mappedField) {
        headerMap[header] = mappedField;
      }
    }

    // Validate that at least 'name' column exists
    const hasMappedName = Object.values(headerMap).includes('name');
    if (!hasMappedName) {
      return res.status(400).json({ 
        error: "MissingRequiredColumn", 
        message: "Excel file must have a 'Name' column" 
      });
    }

    // Transform rows to product objects
    const products = [];
    const validationErrors = [];
    const seenSkus = new Set();
    const seenBarcodes = new Set();

    for (let i = 1; i < rawData.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = rawData[i][j];
      }

      // Skip completely empty rows
      const hasData = Object.values(row).some(v => v !== undefined && v !== null && v !== '');
      if (!hasData) continue;

      const rowNumber = i + 1; // Excel row number (1-indexed, +1 for header)
      const product = transformExcelRow(row, headerMap, rowNumber);

      // Validate row
      const rowErrors = validateProductRow(product);
      if (rowErrors.length > 0) {
        validationErrors.push({ row: rowNumber, errors: rowErrors });
        continue;
      }

      // Check for duplicate SKU within file
      if (product.sku) {
        if (seenSkus.has(product.sku.toLowerCase())) {
          validationErrors.push({ row: rowNumber, errors: [`Duplicate SKU '${product.sku}' in file`] });
          continue;
        }
        seenSkus.add(product.sku.toLowerCase());
      }

      // Check for duplicate barcode within file
      if (product.barcode) {
        if (seenBarcodes.has(product.barcode)) {
          validationErrors.push({ row: rowNumber, errors: [`Duplicate barcode '${product.barcode}' in file`] });
          continue;
        }
        seenBarcodes.add(product.barcode);
      }

      products.push(product);
    }

    if (products.length === 0 && validationErrors.length === 0) {
      return res.status(400).json({ 
        error: "NoValidData", 
        message: "No valid product data found in the Excel file" 
      });
    }

    // Execute operation
    let results;
    const orgId = req.orgId;

    switch (operation) {
      case 'create':
        results = await bulkCreateProducts(products, orgId);
        break;
      case 'update':
        results = await bulkUpdateProducts(products, orgId);
        break;
      case 'upsert':
      default:
        results = await bulkUpsertProducts(products, orgId);
        break;
    }

    // Build summary
    const summary = {
      total: rawData.length - 1, // Exclude header
      processed: products.length,
      validationErrors: validationErrors.length,
    };

    if (operation === 'create') {
      summary.created = results.success?.length || 0;
      summary.errors = (results.errors?.length || 0) + validationErrors.length;
    } else if (operation === 'update') {
      summary.updated = results.success?.length || 0;
      summary.notFound = results.notFound?.length || 0;
      summary.errors = (results.errors?.length || 0) + validationErrors.length;
    } else {
      summary.created = results.created?.length || 0;
      summary.updated = results.updated?.length || 0;
      summary.errors = (results.errors?.length || 0) + validationErrors.length;
    }

    // Combine validation errors with operation errors
    const allErrors = [
      ...validationErrors.map(e => ({ row: e.row, error: e.errors.join(', ') })),
      ...(results.errors || []),
    ];

    return res.status(200).json({
      message: "Bulk upload completed",
      operation,
      results: {
        ...(operation === 'create' && { success: results.success }),
        ...(operation === 'update' && { success: results.success, notFound: results.notFound }),
        ...(operation === 'upsert' && { created: results.created, updated: results.updated }),
        errors: allErrors,
      },
      summary,
    });

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[BulkUpload Error]', error);
    return res.status(500).json({ 
      error: "BulkUploadFailed", 
      message: error.message || "Failed to process bulk upload" 
    });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    // Create template workbook
    const workbook = XLSX.utils.book_new();
    
    // Define headers
    const headers = [
      'Name',
      'SKU',
      'Barcode',
      'Selling Price',
      'Purchase Price',
      'Stock',
      'Tax Rate',
      'Category',
      'Brand',
      'HSN',
      'Description',
    ];

    // Sample data row
    const sampleData = [
      'Sample Product',
      'SKU-001',
      '123456789012',
      '999.99',
      '500.00',
      '100',
      '18',
      'Electronics',
      'Sample Brand',
      '8471',
      'Sample product description',
    ];

    // Create worksheet with headers and sample row
    const wsData = [headers, sampleData];
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 15 }, // SKU
      { wch: 15 }, // Barcode
      { wch: 15 }, // Selling Price
      { wch: 15 }, // Purchase Price
      { wch: 10 }, // Stock
      { wch: 10 }, // Tax Rate
      { wch: 15 }, // Category
      { wch: 15 }, // Brand
      { wch: 10 }, // HSN
      { wch: 30 }, // Description
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_upload_template.xlsx');
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Template Download Error]', error);
    return res.status(500).json({ 
      error: "TemplateDownloadFailed", 
      message: "Failed to generate template file" 
    });
  }
};
