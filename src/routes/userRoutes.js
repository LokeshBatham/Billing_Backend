const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', userController.getProfile);
router.put('/me/razorpay-key', userController.updateRazorpayKey);
router.get('/staff', userController.listStaff);
router.post('/staff', userController.createStaff);
router.put('/staff/:id', userController.updateStaff);
router.patch('/staff/:id/status', userController.updateStaffStatus);
router.delete('/staff/:id', userController.deleteStaff);

module.exports = router;
