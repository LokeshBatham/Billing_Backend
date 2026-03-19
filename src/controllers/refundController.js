const refundService = require('../services/refundService');

async function createRefund(req, res) {
  try {
    // Extract orgId from request (set by auth middleware)
    const orgId = req.orgId || req.user?.orgId;
    
    // Log for debugging
    console.log('[RefundController] Request body:', req.body);
    console.log('[RefundController] orgId from request:', orgId);
    
    // Merge orgId into request body
    const refundData = {
      ...req.body,
      orgId: orgId || req.body.orgId,
    };
    
    console.log('[RefundController] Refund data being sent to service:', refundData);
    
    const updatedInvoice = await refundService.createRefund(refundData);
    res.status(201).json(updatedInvoice);
  } catch (error) {
    console.error('[RefundController] Error:', error.message);
    console.error('[RefundController] Error stack:', error.stack);
    res.status(400).json({ message: error.message });
  }
}

async function list(req, res) {
  res.status(501).json({ message: 'Not implemented' });
}

module.exports = {
  createRefund,
  list,
};