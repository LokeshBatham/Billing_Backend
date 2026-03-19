const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.findByEmail = async (email, orgId) => {
  const query = { email: String(email).toLowerCase() };
  if (orgId) query.orgId = orgId;
  return User.findOne(query).exec();
};

exports.findByEmailAndCompanyName = async (email, companyName) => {
  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedCompanyName = String(companyName || '').trim();
  
  console.log("Finding user by:", { normalizedEmail, normalizedCompanyName });
  
  // Try exact match first
  const exactQuery = {
    email: normalizedEmail,
    companyName: normalizedCompanyName,
  };
  
  console.log("Exact query:", exactQuery);
  let user = await User.findOne(exactQuery).exec();
  console.log("Exact match result:", user ? "Found" : "Not found");
  
  // If no exact match, try case-insensitive match for company name
  if (!user) {
    const caseInsensitiveQuery = {
      email: normalizedEmail,
      companyName: { $regex: new RegExp('^' + normalizedCompanyName + '$', 'i') }
    };
    
    console.log("Trying case-insensitive query:", caseInsensitiveQuery);
    user = await User.findOne(caseInsensitiveQuery).exec();
    console.log("Case-insensitive result:", user ? "Found" : "Not found");
  }
  
  // If still no match, try to find user with null/undefined companyName (for staff users created without company)
  if (!user && normalizedCompanyName) {
    const nullCompanyQuery = {
      email: normalizedEmail,
      $or: [
        { companyName: null },
        { companyName: undefined },
        { companyName: { $exists: false } },
        { companyName: '' }
      ]
    };
    
    console.log("Trying null/undefined company query:", nullCompanyQuery);
    user = await User.findOne(nullCompanyQuery).exec();
    console.log("Null/undefined company result:", user ? "Found" : "Not found");
  }
  
  // If still no match, try to find user by email only and log all matching users
  if (!user) {
    console.log("No match found, checking all users with this email...");
    const usersByEmail = await User.find({ email: normalizedEmail }).select('email companyName role').exec();
    console.log("Users with this email:", usersByEmail.map(u => ({ email: u.email, companyName: u.companyName, role: u.role })));
  }
  
  return user;
};

exports.createUser = async ({ orgId, name, contact, email, companyName, state, city, role, permissions, status, createdAt, password }) => {
  const doc = {
    orgId,
    name,
    contact,
    email: String(email).toLowerCase(),
    companyName,
    state,
    city,
    role,
    permissions: Array.isArray(permissions) ? permissions : undefined,
    status,
    createdAt,
  };

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    doc.passwordHash = hash;
  }

  const user = await User.create(doc);
  return user;
};