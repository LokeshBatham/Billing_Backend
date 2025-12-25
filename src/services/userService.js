const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.findByEmail = async (email) => {
  return User.findOne({ email: String(email).toLowerCase() }).exec();
};

exports.createUser = async ({ name, contact, email, companyName, state, city, password }) => {
  const doc = {
    name,
    contact,
    email: String(email).toLowerCase(),
    companyName,
    state,
    city,
  };

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    doc.passwordHash = hash;
  }

  const user = await User.create(doc);
  return user;
};
