const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findByEmailAndCompanyName } = require('./userService');

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const sanitizeUser = (user) => ({
  id: user._id,
  orgId: user.orgId,
  email: user.email,
  name: user.name,
  role: user.role,
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
});

exports.authenticateUser = async (companyName, email, password, loginAsStaff = false) => {
  console.log("Auth attempt:", { companyName, email, loginAsStaff });
  
  const user = await findByEmailAndCompanyName(email, companyName);
  console.log("Found user:", user ? { 
    id: user._id, 
    email: user.email, 
    companyName: user.companyName, 
    role: user.role,
    hasPasswordHash: !!user.passwordHash 
  } : null);

  if (!user || !user.passwordHash) {
    console.log("Authentication failed: User not found or no password hash");
    return null;
  }

  // For staff users with null/undefined companyName, skip company name validation
  // For other users, validate company name matches
  if (user.companyName && user.companyName.trim() !== '') {
    const requestedCompany = String(companyName || '').trim().toLowerCase();
    const storedCompany = String(user.companyName || '').trim().toLowerCase();
    console.log("Company comparison:", { requestedCompany, storedCompany, match: requestedCompany === storedCompany });
    
    if (!requestedCompany || !storedCompany || requestedCompany !== storedCompany) {
      console.log("Authentication failed: Company name mismatch");
      return null;
    }
  } else {
    console.log("User has no company name, skipping company validation (likely staff user)");
  }

  // If loginAsStaff is true, ensure the user has a staff role
  if (loginAsStaff) {
    if (!user.role || !['staff', 'staffAdmin'].includes(user.role)) {
      console.log("Login as staff requested but user is not staff:", user.role);
      return null;
    }
    console.log("Staff role validation passed for role:", user.role);
  }

  console.log("Comparing password...");
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("Password valid:", isValid);
  
  if (!isValid) {
    console.log("Authentication failed: Invalid password");
    return null;
  }

  const payload = {
    sub: user._id.toString(),
    orgId: user.orgId,
    email: user.email,
    role: user.role,
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '24h' });

  return {
    token,
    expiresIn: 86400,
    user: sanitizeUser(user),
  };
};

