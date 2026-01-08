const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const InvoiceSchema = new mongoose.Schema({
  orgId: { type: String, index: true },
  id: { type: String, default: () => `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, index: { unique: true } },
  customerId: { type: String },
  date: { type: String },
  items: { type: Array, default: [] },
  total: { type: Number },
  status: { type: String, default: 'draft' },
  createdAt: { type: String },
  updatedAt: { type: String },
});

InvoiceSchema.index({ orgId: 1, date: 1 });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
