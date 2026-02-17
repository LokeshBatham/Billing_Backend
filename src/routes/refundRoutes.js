const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');

// Note: Auth middleware is applied globally in app.js for /api/* routes
// This route will use the global auth middleware
router.post('/', refundController.createRefund);

module.exports = router;
