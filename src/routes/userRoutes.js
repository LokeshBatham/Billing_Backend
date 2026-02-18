const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/me", userController.getMe);
router.put("/me/razorpay-key", userController.updateRazorpayKeyId);

module.exports = router;
