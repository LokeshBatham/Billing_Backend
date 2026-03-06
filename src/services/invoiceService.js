const { v4: uuid } = require('uuid');
const Invoice = require('../models/Invoice');

const timestamp = () => new Date().toISOString();

const clone = (invoice) => ({ ...invoice });

exports.getAllInvoices = async () => {
  const docs = await Invoice.find().lean();
  return docs.map(clone);
};

exports.getAllInvoicesByOrg = async (orgId) => {
  if (!orgId) return exports.getAllInvoices();
  const docs = await Invoice.find({ orgId }).lean();
  return docs.map(clone);
};

exports.getInvoiceById = async (id) => {
  const doc = await Invoice.findOne({ id }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.getInvoiceByIdAndOrg = async (id, orgId) => {
  if (!orgId) return exports.getInvoiceById(id);
  const doc = await Invoice.findOne({ id, orgId }).lean();
  if (!doc) return null;
  return clone(doc);
};

exports.createInvoice = async (payload) => {
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const doc = await Invoice.create({ id, ...payload, createdAt: now, updatedAt: now });

  // Best-effort: decrement stock for each item (no orgId)
  try {
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      const Product = require('../models/Product');
      // eslint-disable-next-line no-console
      console.log('[Invoice] Starting stock decrement for invoice', id, 'items count:', payload.items.length);
      for (const it of payload.items) {
        try {
          const pid = it.productId || it.id || it.product || null;
          const qty = Number(it.qty || it.quantity || 0) || 0;
          // eslint-disable-next-line no-console
          console.log('[Invoice] Processing item:', { pid, qty, itemKeys: Object.keys(it) });
          if (!pid || qty <= 0) {
            // eslint-disable-next-line no-console
            console.log('[Invoice] Skipping item - invalid pid or qty');
            continue;
          }
          const prod = await Product.findOne({ id: pid }).exec();
          if (!prod) {
            // eslint-disable-next-line no-console
            console.log('[Invoice] Product not found for id:', pid);
            continue;
          }
          const oldStock = prod.stock || 0;
          const newStock = Math.max(0, oldStock - qty);
          prod.stock = newStock;
          prod.updatedAt = timestamp();
          await prod.save();
          // eslint-disable-next-line no-console
          console.log('[Invoice] Stock decremented:', { pid, oldStock, newStock, qty });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[Invoice] Failed to decrement stock for item', it, e && e.message);
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('[Invoice] No items to decrement or items not an array:', payload.items);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Invoice] Unexpected error while adjusting stock', e && e.message);
  }

  // Create a billing history record (best-effort)
  try {
    const BillingHistory = require('../models/BillingHistory');
    const billingRecord = {
      invoiceId: id,
      orgId: payload.orgId || null,
      userId: payload.userId || null,
      billingDate: payload.billingDate || timestamp(),
      billingPeriod: payload.billingPeriod || null,
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      tax: payload.tax || 0,
      discount: payload.discount || 0,
      total: payload.total || 0,
      paymentStatus: payload.paymentStatus || 'pending',
      paymentMethod: payload.paymentMethod || null,
      transactionId: payload.transactionId || null,
      currency: payload.currency || 'INR',
      customer: payload.customer || null,
      createdAt: timestamp(),
      updatedAt: timestamp(),
      meta: payload.meta || {},
    };
    await BillingHistory.create(billingRecord);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Invoice] Failed to create billing history', e && e.message);
  }

  return clone(doc.toObject());
};

exports.createInvoiceForOrg = async (orgId, payload) => {
  if (!orgId) return exports.createInvoice(payload);
  const now = timestamp();
  const id = payload.id || `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const doc = await Invoice.create({ id, orgId, ...payload, createdAt: now, updatedAt: now });

  // Best-effort: decrement stock for each item for this org
  try {
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      const Product = require('../models/Product');
      for (const it of payload.items) {
        try {
          const pid = it.productId || it.id || it.product || null;
          const qty = Number(it.qty || it.quantity || 0) || 0;
          if (!pid || qty <= 0) continue;
          // Try org-specific product first, fall back to global product if not found
          let prod = await Product.findOne({ id: pid, orgId }).exec();
          if (!prod) {
            prod = await Product.findOne({ id: pid }).exec();
          }
          if (!prod) continue;
          const newStock = Math.max(0, (prod.stock || 0) - qty);
          prod.stock = newStock;
          prod.updatedAt = timestamp();
          await prod.save();
        } catch (e) {
          // log and continue
          // eslint-disable-next-line no-console
          console.warn('[Invoice] Failed to decrement stock for item', it, e && e.message);
        }
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Invoice] Unexpected error while adjusting stock', e && e.message);
  }

  // Create a billing history record (best-effort)
  try {
    const BillingHistory = require('../models/BillingHistory');
    const billingRecord = {
      invoiceId: id,
      orgId: orgId,
      userId: payload.userId || null,
      billingDate: payload.billingDate || timestamp(),
      billingPeriod: payload.billingPeriod || null,
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      tax: payload.tax || 0,
      discount: payload.discount || 0,
      total: payload.total || 0,
      paymentStatus: payload.paymentStatus || 'pending',
      paymentMethod: payload.paymentMethod || null,
      transactionId: payload.transactionId || null,
      currency: payload.currency || 'INR',
      customer: payload.customer || null,
      createdAt: timestamp(),
      updatedAt: timestamp(),
      meta: payload.meta || {},
    };
    await BillingHistory.create(billingRecord);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Invoice] Failed to create billing history for org invoice', e && e.message);
  }

  return clone(doc.toObject());
};

exports.updateInvoice = async (id, payload) => {
  const existing = await exports.getInvoiceById(id);
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Invoice.findOneAndUpdate({ id }, { ...payload, updatedAt }, { new: true }).lean();
  return clone(updated);
};

exports.updateInvoiceForOrg = async (orgId, id, payload) => {
  if (!orgId) return exports.updateInvoice(id, payload);
  const existing = await exports.getInvoiceByIdAndOrg(id, orgId);
  if (!existing) return null;
  const updatedAt = timestamp();
  const updated = await Invoice.findOneAndUpdate(
    { id, orgId },
    { ...payload, updatedAt },
    { new: true }
  ).lean();
  return clone(updated);
};

exports.deleteInvoice = async (id) => {
  const res = await Invoice.deleteOne({ id });
  return res.deletedCount > 0;
};

exports.deleteInvoiceForOrg = async (orgId, id) => {
  if (!orgId) return exports.deleteInvoice(id);
  const res = await Invoice.deleteOne({ id, orgId });
  return res.deletedCount > 0;
};
