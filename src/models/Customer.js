const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  orgId: String,
  name: String,
  email: String,
  phone: String,
  contact: String,
  address: String,
  city: String,
  state: String,
  gst: String,
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema, 'customers');
