const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmail } = require('./userService');

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const sanitizeUser = (user) => ({
  id: user._id,
  orgId: user.orgId,
  email: user.email,
  name: user.name,
  role: user.role,
});

exports.authenticateUser = async (companyName, email, password) => {
  const user = await findByEmail(email);
  console.log("user",user);

  if (!user || !user.passwordHash) {
    return null;
  }

  const requestedCompany = String(companyName || '').trim().toLowerCase();
  const storedCompany = String(user.companyName || '').trim().toLowerCase();
  if (!requestedCompany || !storedCompany || requestedCompany !== storedCompany) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const payload = {
    sub: user._id.toString(),
    orgId: user.orgId,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });

  return {
    token,
    expiresIn: 3600,
    user: sanitizeUser(user),
  };
};

