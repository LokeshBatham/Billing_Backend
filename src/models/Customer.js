const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const CustomerSchema = new mongoose.Schema({
  orgId: { type: String, index: true },
  id: { type: String, default: () => uuid(), index: { unique: true } },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  company: { type: String },
  taxId: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
});

CustomerSchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
