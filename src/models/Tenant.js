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
  // Staff details array for tenant
  staffDetail: {
    type: [{
      staffId: { type: String, required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      role: { type: String, required: true },
      permissions: [String],
      status: { type: String, required: true },
      createdAt: { type: String, required: true }
    }],
    default: []
  },
  createdAt: {
    type: String,
  },
});

module.exports = mongoose.model('Tenant', TenantSchema);
