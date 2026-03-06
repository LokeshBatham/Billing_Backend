const refundService = require('../services/refundService');

exports.list = async (req, res) => {
  try {
    const refunds = await refundService.getAllRefunds();
    return res.json(refunds);
  } catch (error) {
    console.error('[RefundController] Error listing refunds:', error);
    return res.status(500).json({ error: 'Failed to fetch refunds' });
  }
};

exports.create = async (req, res) => {
  try {
    const refund = await refundService.createRefund(req.body);
    return res.status(201).json(refund);
  } catch (error) {
    console.error('[RefundController] Error creating refund:', error);
    return res.status(500).json({ error: 'Failed to create refund' });
  }
};
