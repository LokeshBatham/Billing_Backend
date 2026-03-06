const express = require('express');
const billingController = require('../controllers/billingController');

const router = express.Router();

// List billing history
router.get('/', billingController.list);

module.exports = router;
