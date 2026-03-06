const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  orgId: String,
  invoiceId: String,
  items: { type: Array, default: [] },
  amount: Number,
  reason: String,
  status: { type: String, default: 'processed' },
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema, 'refunds');
