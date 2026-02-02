const { createInvoiceForOrg, createInvoice } = require('../services/invoiceService');

exports.create = async (req, res) => {
  try {
    const orgId = req.orgId || null;
    const payload = req.body || {};

    // Always include orgId in payload for billing history
    if (orgId) {
      payload.orgId = orgId;
    }

    // Basic sanity checks
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'ValidationError', message: 'Invoice must contain at least one item' });
    }

    let invoice;
    if (orgId) {
      invoice = await createInvoiceForOrg(orgId, payload);
    } else {
      invoice = await createInvoice(payload);
    }

    return res.status(201).json({ success: true, invoice });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Invoice] create error', err && err.message);
    return res.status(500).json({ error: 'ServerError', message: 'Failed to create invoice' });
  }
};
