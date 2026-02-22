const express = require("express");
const userController = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", userController.getMe);
router.put("/me/razorpay-key", userController.updateRazorpayKeyId);

// Staff management routes
router.get(
  "/staff",
  auth.authorizeRoles("admin", "staffAdmin"),
  userController.getStaff
);
router.post(
  "/staff",
  auth.authorizeRoles("admin", "staffAdmin"),
  userController.createStaff
);
router.put(
  "/staff/:id",
  auth.authorizeRoles("admin", "staffAdmin"),
  userController.updateStaff
);
router.delete(
  "/staff/:id",
  auth.authorizeRoles("admin"),
  userController.deleteStaff
);
router.patch(
  "/staff/:id/status",
  auth.authorizeRoles("admin", "staffAdmin"),
  userController.toggleStaffStatus
);

module.exports = router;
