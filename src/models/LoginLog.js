const mongoose = require('mongoose');

const LoginLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Register', required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    mobile: { type: String, trim: true },
    ip: { type: String },
    userAgent: { type: String },
    loginAt: { type: Date, default: () => new Date(), index: true },
    logoutAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.models.LoginLog || mongoose.model('LoginLog', LoginLogSchema);
