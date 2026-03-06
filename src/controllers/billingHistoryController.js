const { getBillingHistory } = require('../services/billingHistoryService');

exports.list = async (req, res) => {
  try {
    const history = await getBillingHistory();
    return res.json(history);
  } catch (error) {
    console.error('[BillingHistoryController] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch billing history' });
  }
};
