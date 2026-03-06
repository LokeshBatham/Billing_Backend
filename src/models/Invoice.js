const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  orgId: String,
  invoiceNumber: String,
  date: String,
  items: { type: Array, default: [] },
  subtotal: Number,
  discount: Number,
  tax: Number,
  total: Number,
  paymentMethod: String,
  customer: { type: mongoose.Schema.Types.Mixed, default: null },
  status: { type: String, default: 'paid' },
  createdDate: String,
  createdTime: String,
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema, 'invoices');
