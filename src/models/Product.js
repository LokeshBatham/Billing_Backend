const mongoose = require("mongoose");
const { v4: uuid } = require("uuid");

const ProductSchema = new mongoose.Schema({
  orgId: { type: String, index: true },
  id: { type: String, default: () => uuid(), index: { unique: true } },
  sku: { type: String },
  name: { type: String, required: true },
  category: { type: String },
  unit: { type: String },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  price: { type: Number },
  taxRate: { type: Number },
  stock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  barcode: {
    type: String,
  },
  barcodeImage: { type: String },
  brand: { type: String },
  hsn: { type: String },
  discount: { type: Number },
  discountType: { type: String, default: "percentage" },
  supplier: { type: String },
  batch: { type: String },
  expiry: { type: String },
  mfg: { type: String },
  image: { type: String },
  description: { type: String },
  location: { type: String },
  weight: { type: String },
  color: { type: String },
  size: { type: String },
  status: { type: String, default: "active" },
  isFavorite: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  parentProductId: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
});

// Uniqueness should be per-tenant
ProductSchema.index({ orgId: 1, sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ orgId: 1, barcode: 1 }, { unique: true, sparse: true });

module.exports =
  mongoose.models.Product || mongoose.model("Product", ProductSchema);
