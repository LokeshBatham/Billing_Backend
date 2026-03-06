const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema({
  orgId: {
    type: String,
    unique: true,
    index: true,
  },
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    default: 'IN',
  },
  stateName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  createdAt: {
    type: String,
  },
});

module.exports = mongoose.model('Tenant', TenantSchema);
