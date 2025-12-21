const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const ProductSchema = new mongoose.Schema({
  id: { type: String, default: () => uuid(), index: { unique: true } },
  sku: { type: String, index: { unique: true, sparse: true } },
  name: { type: String, required: true },
  category: { type: String },
  unit: { type: String },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  price: { type: Number },
  taxRate: { type: Number },
  stock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  barcode: { type: String },
  brand: { type: String },
  hsn: { type: String },
  discount: { type: Number },
  discountType: { type: String, default: 'percentage' },
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
  status: { type: String, default: 'active' },
  isFavorite: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  parentProductId: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);
