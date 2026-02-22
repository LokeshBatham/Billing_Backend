const User = require("../models/User");
const Tenant = require("../models/Tenant");
const { createUser } = require("../services/userService");

exports.getMe = async (req, res) => {
  try {
    const decoded = req.user || null;
    const userId = decoded?.sub || decoded?.userId || null;
    const orgId = req.orgId || decoded?.orgId || null;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const query = { _id: userId };
    if (orgId) query.orgId = orgId;

    const user = await User.findOne(query).select("-passwordHash").exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: user.toObject() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[User] getMe error", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const creatorRole = String(req.user?.role || '').toLowerCase();
    const orgId = req.orgId || req.user?.orgId;
    const creatorId = req.user?.sub || req.user?.userId;
    
    if (!orgId) return res.status(400).json({ error: 'Missing orgId' });

    if (creatorRole !== 'admin' && creatorRole !== 'staffadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const role = String(req.body?.role || '').trim();
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!email) return res.status(400).json({ error: 'email is required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'password is required' });

    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'admin') {
      return res.status(400).json({ error: 'Cannot create admin user' });
    }
    if (normalizedRole !== 'staffadmin' && normalizedRole !== 'staff') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // staffAdmin can ONLY create staff
    if (creatorRole === 'staffadmin' && normalizedRole !== 'staff') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Ensure unique email per org
    const existing = await User.findOne({ orgId, email }).exec();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const created = await createUser({
      orgId,
      name,
      email,
      password,
      role: normalizedRole === 'staffadmin' ? 'staffAdmin' : 'staff',
      permissions,
      status: 'active',
      createdAt: new Date().toISOString(),
    });

    // Add staff details to tenant record (only if creator is admin)
    if (creatorRole === 'admin') {
      try {
        const staffDetailObject = {
          staffId: created._id.toString(),
          name: created.name,
          email: created.email,
          role: created.role,
          permissions: Array.isArray(created.permissions) ? created.permissions : [],
          status: created.status,
          createdAt: created.createdAt || new Date().toISOString()
        };

        await Tenant.findOneAndUpdate(
          { orgId },
          { 
            $push: { 
              staffDetail: staffDetailObject 
            } 
          },
          { new: true }
        );

        console.log('[User] Staff details added to tenant record:', staffDetailObject);
      } catch (updateError) {
        console.error('[User] Failed to add staff details to tenant record:', updateError);
        // Don't fail the request, but log the error
      }
    }

    return res.status(201).json({
      id: created._id,
      name: created.name,
      email: created.email,
      role: created.role,
      permissions: Array.isArray(created.permissions) ? created.permissions : [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[User] createStaff error', error);
    if (error && error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(500).json({ error: 'Failed to create staff' });
  }
};

exports.updateRazorpayKeyId = async (req, res) => {
  try {
    const decoded = req.user || null;
    const userId = decoded?.sub || decoded?.userId || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const role = String(decoded?.role || "").toLowerCase();

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const razorpayKeyId = String(req.body?.razorpayKeyId || "").trim();
    if (!razorpayKeyId) {
      return res.status(400).json({ error: "razorpayKeyId is required" });
    }

    const query = { _id: userId };
    if (orgId) query.orgId = orgId;

    const user = await User.findOneAndUpdate(
      query,
      { $set: { razorpayKeyId } },
      { new: true }
    )
      .select("-passwordHash")
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: user.toObject() });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[User] updateRazorpayKeyId error", error);
    return res.status(500).json({ error: "Failed to update Razorpay key" });
  }
};

// Get all staff users for the organization
exports.getStaff = async (req, res) => {
  try {
    const decoded = req.user || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const role = String(decoded?.role || "").toLowerCase();

    if (!orgId) {
      return res.status(400).json({ error: "Organization ID required" });
    }

    // Build query based on user role
    let query = { orgId };
    
    // Staff admins can only see staff and staffAdmin, not other admins
    if (role === 'staffAdmin') {
      query.role = { $in: ['staff', 'staffAdmin'] };
    }

    const staff = await User.find(query)
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ staff });
  } catch (error) {
    console.error("[User] getStaff error", error);
    return res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// Update staff user
exports.updateStaff = async (req, res) => {
  try {
    console.log('[User] updateStaff called with:', { params: req.params, body: req.body, user: req.user });
    const decoded = req.user || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const requesterId = decoded?.sub || decoded?.userId;
    const { id } = req.params;
    const { name, email, role, permissions } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    // Find the staff user
    const staffUser = await User.findOne({ _id: id, orgId });
    if (!staffUser) {
      console.log('[User] Staff user not found:', { id, orgId });
      return res.status(404).json({ error: "Staff user not found" });
    }

    // Prevent role escalation for staffAdmin
    const requesterRole = String(decoded?.role || "").toLowerCase();
    if (requesterRole === 'staffAdmin' && staffUser.role === 'admin') {
      return res.status(403).json({ error: "Cannot modify admin users" });
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (role && ['staff', 'staffAdmin'].includes(role)) updateData.role = role;
    if (Array.isArray(permissions)) updateData.permissions = permissions;

    console.log('[User] Updating staff with data:', updateData);
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, orgId },
      { $set: updateData },
      { new: true }
    ).select("-passwordHash");

    // Update staff details in tenant record (only if requester is admin)
    if (requesterRole === 'admin') {
      try {
        const staffDetailUpdate = {};
        if (name) staffDetailUpdate['staffDetail.$.name'] = name;
        if (email) staffDetailUpdate['staffDetail.$.email'] = email.toLowerCase();
        if (role) staffDetailUpdate['staffDetail.$.role'] = role;
        if (Array.isArray(permissions)) staffDetailUpdate['staffDetail.$.permissions'] = permissions;

        await Tenant.findOneAndUpdate(
          { 
            orgId,
            'staffDetail.staffId': id
          },
          { $set: staffDetailUpdate },
          { new: true }
        );

        console.log('[User] Staff details updated in tenant record for staff ID:', id);
      } catch (updateError) {
        console.error('[User] Failed to update staff details in tenant record:', updateError);
        // Don't fail the request, but log the error
      }
    }

    console.log('[User] Staff updated successfully:', updatedUser);
    return res.json({ user: updatedUser.toObject() });
  } catch (error) {
    console.error("[User] updateStaff error", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Failed to update staff" });
  }
};

// Delete staff user
exports.deleteStaff = async (req, res) => {
  try {
    console.log('[User] deleteStaff called with:', { params: req.params, user: req.user });
    const decoded = req.user || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const requesterId = decoded?.sub || decoded?.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    // Find the staff user
    const staffUser = await User.findOne({ _id: id, orgId });
    if (!staffUser) {
      console.log('[User] Staff user not found for deletion:', { id, orgId });
      return res.status(404).json({ error: "Staff user not found" });
    }

    // Prevent deletion of admins
    if (staffUser.role === 'admin') {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    console.log('[User] Deleting staff user:', { id, name: staffUser.name, email: staffUser.email });
    await User.findOneAndDelete({ _id: id, orgId });

    // Remove staff details from tenant record (only if requester is admin)
    if (requesterId && decoded?.role === 'admin') {
      try {
        await Tenant.findOneAndUpdate(
          { 
            orgId
          },
          { 
            $pull: { 
              staffDetail: { staffId: id } 
            } 
          },
          { new: true }
        );

        console.log('[User] Staff details removed from tenant record for staff ID:', id);
      } catch (updateError) {
        console.error('[User] Failed to remove staff details from tenant record:', updateError);
        // Don't fail the request, but log the error
      }
    }

    console.log('[User] Staff deleted successfully');
    return res.json({ success: true });
  } catch (error) {
    console.error("[User] deleteStaff error", error);
    return res.status(500).json({ error: "Failed to delete staff" });
  }
};

// Toggle staff status
exports.toggleStaffStatus = async (req, res) => {
  try {
    console.log('[User] toggleStaffStatus called with:', { params: req.params, body: req.body, user: req.user });
    const decoded = req.user || null;
    const orgId = req.orgId || decoded?.orgId || null;
    const requesterId = decoded?.sub || decoded?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Find the staff user
    const staffUser = await User.findOne({ _id: id, orgId });
    if (!staffUser) {
      console.log('[User] Staff user not found for status toggle:', { id, orgId });
      return res.status(404).json({ error: "Staff user not found" });
    }

    // Prevent status changes for admins (only admins can do this)
    const requesterRole = String(decoded?.role || "").toLowerCase();
    if (requesterRole !== 'admin' && staffUser.role === 'admin') {
      return res.status(403).json({ error: "Cannot modify admin users" });
    }

    console.log('[User] Toggling staff status:', { id, currentStatus: staffUser.status, newStatus: status });
    const updatedUser = await User.findOneAndUpdate(
      { _id: id, orgId },
      { $set: { status } },
      { new: true }
    ).select("-passwordHash");

    // Update staff status in tenant record (only if requester is admin)
    if (requesterRole === 'admin') {
      try {
        await Tenant.findOneAndUpdate(
          { 
            orgId,
            'staffDetail.staffId': id
          },
          { 
            $set: { 
              'staffDetail.$.status': status 
            } 
          },
          { new: true }
        );

        console.log('[User] Staff status updated in tenant record for staff ID:', id);
      } catch (updateError) {
        console.error('[User] Failed to update staff status in tenant record:', updateError);
        // Don't fail the request, but log the error
      }
    }

    console.log('[User] Staff status updated successfully:', updatedUser);
    return res.json({ success: true, user: updatedUser.toObject() });
  } catch (error) {
    console.error("[User] toggleStaffStatus error", error);
    return res.status(500).json({ error: "Failed to update staff status" });
  }
};
