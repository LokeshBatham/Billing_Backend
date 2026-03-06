const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
  orgId: String,
  name: String,
  contact: String,
  email: { type: String, required: true },
  companyName: String,
  state: String,
  city: String,
  passwordHash: String,
  role: { type: String, default: 'admin' },
  razorpayKeyId: String,
  staffDetail: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Register', registerSchema, 'registers');
