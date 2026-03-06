const Register = require('../models/Register');

exports.getProfile = async (userId) => {
  if (userId) {
    const user = await Register.findById(userId).lean();
    if (user) {
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        contact: user.contact,
        orgId: user.orgId,
        razorpayKeyId: user.razorpayKeyId,
      };
    }
  }
  return { id: 'unknown', name: 'User', email: '', role: 'admin' };
};

exports.getAllStaff = async (orgId) => {
  const filter = orgId ? { orgId, role: { $ne: 'admin' } } : { role: { $ne: 'admin' } };
  const users = await Register.find(filter).lean();
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    contact: u.contact,
    status: u.status || 'active',
    orgId: u.orgId,
  }));
};

exports.getUserById = async (id) => {
  const user = await Register.findById(id).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    contact: user.contact,
    orgId: user.orgId,
  };
};

exports.createStaff = async (payload) => {
  const bcrypt = require('bcryptjs');
  const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;
  const user = await Register.create({
    ...payload,
    passwordHash,
    role: payload.role || 'staff',
  });
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    contact: user.contact,
  };
};

exports.updateStaff = async (id, payload) => {
  const user = await Register.findByIdAndUpdate(id, payload, { new: true }).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    contact: user.contact,
    status: user.status || 'active',
  };
};

exports.updateStaffStatus = async (id, status) => {
  return exports.updateStaff(id, { status });
};

exports.deleteStaff = async (id) => {
  const result = await Register.findByIdAndDelete(id);
  return !!result;
};

exports.updateRazorpayKey = async (userId, razorpayKeyId) => {
  const user = await Register.findByIdAndUpdate(userId, { razorpayKeyId }, { new: true }).lean();
  return { razorpayKeyId: user?.razorpayKeyId, updatedAt: user?.updatedAt };
};
