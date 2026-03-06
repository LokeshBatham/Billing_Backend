const userService = require('../services/userService');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }
    const profile = await userService.getProfile(userId);
    return res.json({ user: profile });
  } catch (error) {
    console.error('[UserController] Error getting profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateRazorpayKey = async (req, res) => {
  try {
    const result = await userService.updateRazorpayKey(req.body.razorpayKeyId);
    return res.json(result);
  } catch (error) {
    console.error('[UserController] Error updating Razorpay key:', error);
    return res.status(500).json({ error: 'Failed to update Razorpay key' });
  }
};

exports.listStaff = async (req, res) => {
  try {
    const orgId = req.user?.orgId;
    const staff = await userService.getAllStaff(orgId);
    return res.json(staff);
  } catch (error) {
    console.error('[UserController] Error listing staff:', error);
    return res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const payload = { ...req.body, orgId: req.user?.orgId };
    const staff = await userService.createStaff(payload);
    return res.status(201).json(staff);
  } catch (error) {
    console.error('[UserController] Error creating staff:', error);
    return res.status(500).json({ error: 'Failed to create staff' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const staff = await userService.updateStaff(req.params.id, req.body);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    return res.json(staff);
  } catch (error) {
    console.error('[UserController] Error updating staff:', error);
    return res.status(500).json({ error: 'Failed to update staff' });
  }
};

exports.updateStaffStatus = async (req, res) => {
  try {
    const staff = await userService.updateStaffStatus(req.params.id, req.body.status);
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    return res.json(staff);
  } catch (error) {
    console.error('[UserController] Error updating staff status:', error);
    return res.status(500).json({ error: 'Failed to update staff status' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const deleted = await userService.deleteStaff(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Staff not found' });
    return res.json({ message: 'Staff deleted' });
  } catch (error) {
    console.error('[UserController] Error deleting staff:', error);
    return res.status(500).json({ error: 'Failed to delete staff' });
  }
};
