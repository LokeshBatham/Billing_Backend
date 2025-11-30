const express = require('express');
const reportsController = require('../controllers/reportsController');

const router = express.Router();

router.get('/sales', reportsController.getSales);

module.exports = router;

