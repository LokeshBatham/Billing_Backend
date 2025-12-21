const mongoose = require('mongoose');
const { v4: uuid } = require('uuid');

const CustomerSchema = new mongoose.Schema({
  id: { type: String, default: () => uuid(), index: { unique: true } },
  name: { type: String },
  email: { type: String, index: { unique: true, sparse: true } },
  phone: { type: String },
  address: { type: String },
  company: { type: String },
  taxId: { type: String },
  createdAt: { type: String },
  updatedAt: { type: String },
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
