const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const hydrateUser = async (decoded) => {
  const userId = decoded?.sub || decoded?.userId;
  const orgId = decoded?.orgId;
  if (!userId || !orgId) return null;

  const user = await User.findOne({ _id: userId, orgId })
    .select('-passwordHash')
    .exec();
  if (!user) return null;
  return user.toObject();
};

const requiredAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await hydrateUser(decoded);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (String(user.status || 'active').toLowerCase() !== 'active') {
      return res.status(403).json({ error: 'InactiveUser' });
    }

    req.user = {
      ...decoded,
      id: user._id,
      orgId: user.orgId,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      status: user.status,
    };
    req.orgId = user.orgId;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await hydrateUser(decoded);
    if (user) {
      req.user = {
        ...decoded,
        id: user._id,
        orgId: user.orgId,
        role: user.role,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        status: user.status,
      };
      req.orgId = user.orgId;
    }
  } catch {
    // ignore invalid token in optional mode
  }

  return next();
};

module.exports = requiredAuth;
module.exports.optional = optionalAuth;

module.exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();
    const allowed = roles.map((r) => String(r).toLowerCase());
    if (!role) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowed.includes(role)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
};

module.exports.authorizePermissions = (...permissions) => {
  return (req, res, next) => {
    const role = String(req.user?.role || '').toLowerCase();
    if (!role) return res.status(401).json({ error: 'Unauthorized' });

    // Admin always bypasses permission checks
    if (role === 'admin') return next();

    const userPerms = Array.isArray(req.user?.permissions) ? req.user.permissions : [];
    const required = permissions.map((p) => String(p));
    const hasAll = required.every((p) => userPerms.includes(p));
    if (!hasAll) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
};
