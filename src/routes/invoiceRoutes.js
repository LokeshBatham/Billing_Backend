const express = require('express');
const invoiceController = require('../controllers/invoiceController');

const router = express.Router();

// Create invoice
router.post('/', invoiceController.create);

module.exports = router;
