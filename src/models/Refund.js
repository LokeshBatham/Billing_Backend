// Billing_Backend/src/models/Refund.js
const mongoose = require('mongoose');

const refundItemSchema = new mongoose.Schema({
    productId: { type: String, required: true }, // Changed to String to support UUID/custom IDs
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true }
});

const refundSchema = new mongoose.Schema({
    orgId: { type: String, required: true }, // Assuming orgId is a tenant identifier
    invoiceId: { type: String, required: true, index: true }, // Changed to String to support UUID/custom IDs
    refundNumber: { type: String, required: true, unique: true },
    items: [refundItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    reason: { type: String, required: true },
    refundMethod: { type: String, enum: ['Cash', 'UPI', 'Bank', 'Card'], required: true },
    restock: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.Refund || mongoose.model('Refund', refundSchema);
