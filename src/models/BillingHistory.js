const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const BillingHistorySchema = new mongoose.Schema({
  id: { type: String, default: () => uuid(), index: { unique: true } },
  orgId: { type: String, index: true },
  invoiceId: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  billingDate: { type: String },
  billingPeriod: { type: String },
  items: [
    {
      name: { type: String },
      qty: { type: Number },
      price: { type: Number },
      productId: { type: String },
      description: { type: String },
      _id: false, // Disable auto _id for items
    }
  ],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'pending' },
  paymentMethod: { type: String },
  transactionId: { type: String },
  currency: { type: String, default: 'INR' },
  customer: { type: Object },
  createdAt: { type: String },
  updatedAt: { type: String },
  meta: { type: Object },
});

module.exports = mongoose.models.BillingHistory || mongoose.model('BillingHistory', BillingHistorySchema);
