const BillingHistory = require('../models/BillingHistory');

exports.list = async (req, res) => {
  try {
    const orgId = req.orgId || null;
    const query = {};
    if (orgId) query.orgId = orgId;
    const docs = await BillingHistory.find(query).sort({ createdAt: -1 }).lean();
    return res.json(docs.map(d => ({ ...d })));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Billing] list error', err && err.message);
    return res.status(500).json({ error: 'ServerError', message: 'Failed to list billing history' });
  }
};
