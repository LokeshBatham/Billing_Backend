const express = require('express');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.get('/', customerController.list);
router.get('/search', customerController.list); // Alias for search with query param
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.patch('/:id', customerController.update);
router.delete('/:id', customerController.remove);

module.exports = router;

