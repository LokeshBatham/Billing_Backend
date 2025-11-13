const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('Admin@123', 10),
    name: 'Administrator',
    role: 'admin',
  },
];

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

const findUserByEmail = (email) =>
  USERS.find((user) => user.email.toLowerCase() === email.toLowerCase());

exports.authenticateUser = async (email, password) => {
  const user = findUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const payload = {
    sub: user.id,
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

