const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      index: true,
      required: true,
    },
    name: { type: String, required: true, trim: true },
    contact: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    companyName: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    razorpayKeyId: { type: String, trim: true },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ["admin", "staffAdmin", "staff"],
      default: "staff",
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdAt: {type: String},
  },
  { timestamps: true }
);

userSchema.index({ orgId: 1, email: 1 }, { unique: true });

module.exports = mongoose.models.Register || mongoose.model("Register", userSchema);
