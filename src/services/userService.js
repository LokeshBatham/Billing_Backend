const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.findByEmail = async (email, orgId) => {
  const query = { email: String(email).toLowerCase() };
  if (orgId) query.orgId = orgId;
  return User.findOne(query).exec();
};

exports.createUser = async ({ orgId, name, contact, email, companyName, state, city, role, createdAt, password }) => {
  const doc = {
    orgId,
    name,
    contact,
    email: String(email).toLowerCase(),
    companyName,
    state,
    city,
    role,
    createdAt,
  };

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    doc.passwordHash = hash;
  }

  const user = await User.create(doc);
  return user;
};
