const express = require('express');
const billingHistoryController = require('../controllers/billingHistoryController');

const router = express.Router();

router.get('/', billingHistoryController.list);

module.exports = router;
