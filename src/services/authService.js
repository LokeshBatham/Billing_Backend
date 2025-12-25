const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmail } = require('./userService');

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
});

exports.authenticateUser = async (email, password) => {
  const user = await findByEmail(email);

  if (!user || !user.passwordHash) {
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
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' });

  return {
    token,
    expiresIn: 3600,
    user: sanitizeUser(user),
  };
};

