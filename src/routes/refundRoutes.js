const express = require('express');
const refundController = require('../controllers/refundController');

const router = express.Router();

router.get('/', refundController.list);
router.post('/', refundController.create);

module.exports = router;
