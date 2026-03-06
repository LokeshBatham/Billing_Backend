const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize Razorpay instance with credentials from environment
const razorpay = new Razorpay({
  key_id: process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.VITE_RAZORPAY_KEY_SECRET,
});

/**
 * Create Razorpay Order
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'ValidationError',
        message: 'Invalid amount. Amount must be greater than 0.' 
      });
    }

    // Check if Razorpay credentials are configured
    if (!process.env.VITE_RAZORPAY_KEY_ID || !process.env.VITE_RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        error: 'ConfigurationError',
        message: 'Razorpay credentials not configured on server'
      });
    }

    // Create order options
    const options = {
      amount: amount, // Amount in paise (e.g., 10000 paise = ₹100)
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    console.log('[Payment] Creating Razorpay order:', options);

    // Create order using Razorpay SDK
    const order = await razorpay.orders.create(options);

    console.log('[Payment] Order created successfully:', order.id);

    // Return order details to frontend
    return res.status(201).json({
      success: true,
      orderId: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      createdAt: order.created_at,
    });
  } catch (error) {
    console.error('[Payment] Razorpay order creation error:', error);
    
    // Handle specific Razorpay errors
    if (error.error) {
      return res.status(error.statusCode || 500).json({ 
        error: 'RazorpayError',
        message: error.error.description || 'Failed to create payment order',
        code: error.error.code,
      });
    }

    return res.status(500).json({ 
      error: 'ServerError',
      message: 'Failed to create payment order. Please try again.',
    });
  }
};

/**
 * Verify Payment Signature (Optional - for webhook or post-payment verification)
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.VITE_RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === razorpay_signature) {
      console.log('[Payment] Payment verified successfully:', razorpay_payment_id);
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.error('[Payment] Payment verification failed - signature mismatch');
      return res.status(400).json({ 
        success: false, 
        message: 'Payment verification failed - Invalid signature' 
      });
    }
  } catch (error) {
    console.error('[Payment] Payment verification error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'ServerError',
      message: 'Failed to verify payment. Please try again.' 
    });
  }
};

/**
 * Fetch Order Details (Optional)
 * GET /api/payments/orders/:orderId
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Order ID is required'
      });
    }

    const order = await razorpay.orders.fetch(orderId);

    return res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        createdAt: order.created_at,
      }
    });
  } catch (error) {
    console.error('[Payment] Failed to fetch order details:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to fetch order details'
    });
  }
};