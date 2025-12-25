const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    companyName: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    passwordHash: { type: String },
    role: { type: String, default: 'user' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('Register', userSchema);
