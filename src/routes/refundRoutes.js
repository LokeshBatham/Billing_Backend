const express = require('express');
const refundController = require('../controllers/refundController');

const router = express.Router();

router.get('/', refundController.list);
router.post('/', refundController.createRefund);

module.exports = router;
