const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  orgId: String,
  name: String,
  barcode: String,
  category: String,
  price: Number,
  mrp: Number,
  costPrice: Number,
  stock: Number,
  unit: String,
  hsn: String,
  gst: Number,
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema, 'products');
