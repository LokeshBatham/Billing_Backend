const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard route - GET /api/dashboard or /api/dashboard/
router.get('/', dashboardController.getDashboard);

module.exports = router;

