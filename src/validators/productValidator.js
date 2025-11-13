const { z } = require('zod');

const numericFields = [
  'purchasePrice',
  'sellingPrice',
  'price',
  'mrp',
  'taxRate',
  'taxPercent',
  'stock',
  'discount',
  'discountPrice',
  'discountAmount',
  'discountValue',
  'reorderLevel',
];

const booleanFields = ['isFavorite', 'isBestSeller'];

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'on'].includes(normalized);
  }
  return Boolean(value);
};

exports.normalizeProductPayload = (payload = {}) => {
  const result = {};

  Object.entries(payload).forEach(([key, rawValue]) => {
    if (numericFields.includes(key)) {
      result[key] = normalizeNumber(rawValue);
      return;
    }

    if (booleanFields.includes(key)) {
      result[key] = normalizeBoolean(rawValue);
      return;
    }

    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      result[key] = trimmed.length > 0 ? trimmed : undefined;
      return;
    }

    result[key] = rawValue;
  });

  return result;
};

const baseProductSchema = z
  .object({
    name: z.string().min(1, 'Product name is required'),
    sku: z.string().min(1, 'SKU is required'),
    category: z.string().min(1, 'Category is required'),
    unit: z.string().min(1, 'Unit is required'),
    sellingPrice: z.number().nonnegative('Selling price must be zero or positive'),
    stock: z.number().int('Stock must be an integer').nonnegative('Stock must be zero or positive'),
    purchasePrice: z.number().nonnegative('Purchase price must be zero or positive').optional(),
    mrp: z.number().nonnegative('MRP must be zero or positive').optional(),
    price: z.number().nonnegative('Price must be zero or positive').optional(),
    taxRate: z.number().min(0, 'Tax rate must be zero or positive').max(100, 'Tax rate must be <= 100').optional(),
    taxPercent: z.number().min(0).max(100).optional(),
    discount: z.number().min(0, 'Discount must be zero or positive').max(100, 'Discount must be <= 100').optional(),
    discountPrice: z.number().min(0, 'Discount must be zero or positive').max(100, 'Discount must be <= 100').optional(),
    discountAmount: z.number().min(0, 'Discount amount must be zero or positive').optional(),
    discountValue: z.number().min(0, 'Discount value must be zero or positive').optional(),
    discountType: z.enum(['percentage', 'flat']).optional(),
    reorderLevel: z
      .number()
      .int('Reorder level must be an integer')
      .nonnegative('Reorder level must be zero or positive')
      .optional(),
    barcode: z.string().optional(),
    brand: z.string().optional(),
    hsn: z.string().optional(),
    supplier: z.string().optional(),
    batch: z.string().optional(),
    expiry: z.string().optional(),
    mfg: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    weight: z.string().optional(),
    color: z.string().optional(),
    size: z.string().optional(),
    status: z.enum(['active', 'inactive']).default('active'),
    isFavorite: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    parentProductId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const percentageFields = [
      data.discount,
      data.discountPrice,
      data.discountValue !== undefined && data.discountType !== 'flat' ? data.discountValue : undefined,
    ].filter((value) => value !== undefined);

    const flatFields = [
      data.discountAmount,
      data.discountType === 'flat' ? data.discountValue : undefined,
    ].filter((value) => value !== undefined);

    if (data.discountType === 'percentage') {
      if (percentageFields.length === 0) {
        ctx.addIssue({
          path: ['discount'],
          code: z.ZodIssueCode.custom,
          message: 'Provide a percentage value for the discount',
        });
      }
      if (flatFields.length > 0) {
        ctx.addIssue({
          path: ['discountAmount'],
          code: z.ZodIssueCode.custom,
          message: 'Flat discount fields cannot be used with percentage discount type',
        });
      }
    }

    if (data.discountType === 'flat') {
      if (flatFields.length === 0) {
        ctx.addIssue({
          path: ['discountAmount'],
          code: z.ZodIssueCode.custom,
          message: 'Provide a flat amount for the discount',
        });
      }
      if (percentageFields.length > 0) {
        ctx.addIssue({
          path: ['discount'],
          code: z.ZodIssueCode.custom,
          message: 'Percentage discount fields cannot be used with flat discount type',
        });
      }
    }

    if (!data.discountType) {
      const hasPercentage = percentageFields.length > 0;
      const hasFlat = flatFields.length > 0;

      if (hasPercentage && hasFlat) {
        ctx.addIssue({
          path: ['discountType'],
          code: z.ZodIssueCode.custom,
          message: 'Specify discountType when both percentage and flat discount values are provided',
        });
      }
    }
  });

exports.createProductSchema = baseProductSchema;

exports.updateProductSchema = baseProductSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' },
);

