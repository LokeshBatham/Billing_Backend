const jwt = require('jsonwebtoken');

const getJwtSecret = () => process.env.JWT_SECRET || 'change_me_in_production';

const requiredAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    req.orgId = decoded.orgId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    req.orgId = decoded.orgId;
  } catch {
    // ignore invalid token in optional mode
  }

  return next();
};

module.exports = requiredAuth;
module.exports.optional = optionalAuth;
