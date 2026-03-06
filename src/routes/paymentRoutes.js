const express = require('express');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Create Razorpay order (MAIN ENDPOINT FOR FRONTEND)
router.post('/create-order', paymentController.createOrder);

// Verify payment (optional, for post-payment verification)
router.post('/verify', paymentController.verifyPayment);

// Get order details (optional)
router.get('/orders/:orderId', paymentController.getOrderDetails);

module.exports = router;