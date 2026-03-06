const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Register = require('../models/Register');

const getJwtSecret = () => process.env.VITE_JWT_SECRET || process.env.JWT_SECRET || 'change_me_in_production';

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  companyName: user.companyName,
  contact: user.contact,
  orgId: user.orgId,
});

exports.authenticateUser = async (email, password) => {
  const user = await Register.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    orgId: user.orgId,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });

  return {
    token,
    expiresIn: 86400,
    user: sanitizeUser(user),
  };
};

exports.registerUser = async ({ name, email, password, companyName, contact, state, city }) => {
  // Check if email already exists
  const existing = await Register.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
  if (existing) {
    return { error: 'Email already registered' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const orgId = `org_${Date.now().toString(36)}`;

  const newUser = await Register.create({
    orgId,
    name: name || '',
    email,
    passwordHash,
    role: 'admin',
    companyName: companyName || '',
    contact: contact || '',
    state: state || '',
    city: city || '',
  });

  return { user: sanitizeUser(newUser) };
};
