const {
  loginSchema,
  normalizeLoginPayload,
} = require("../validators/authValidator");
const {
  registerSchema,
  normalizeRegisterPayload,
} = require("../validators/registerValidator");
const { authenticateUser } = require("../services/authService");
const { createUser, findByEmail } = require("../services/userService");
const LoginLog = require("../models/LoginLog");
const Tenant = require("../models/Tenant");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require('uuid');
const getJwtSecret = () => process.env.JWT_SECRET || "change_me_in_production";

const timestamp = () => new Date().toISOString();

const handleZodError = (error, res) => {
  const details = error.errors.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  return res.status(400).json({
    error: "ValidationError",
    details,
  });
};

exports.login = async (req, res) => {
  try {
    const normalized = normalizeLoginPayload(req.body);
    const { companyName, email, password } = loginSchema.parse(normalized);
    const authResult = await authenticateUser(companyName, email, password);

    if (!authResult) {
      return res.status(401).json({ error: "Invalid company name, email or password" });
    }

    // Record login log (best-effort)
    try {
      const user = await findByEmail(email);
      if (user) {
        await LoginLog.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          mobile: user.contact,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          loginAt: new Date(),
        });
      }
    } catch (logErr) {
      // do not block login on logging failure
      // eslint-disable-next-line no-console
      console.warn("[Auth] Failed to record login log:", logErr);
    }

    return res.json(authResult);
  } catch (error) {
    if (error.name === "ZodError") {
      return handleZodError(error, res);
    }

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: "Failed to login" });
  }
};

exports.logout = async (req, res) => {
  try {
    // Try to identify user by Authorization token or by email in body
    let userId = null;
    const authHeader = req.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, getJwtSecret());
        userId = decoded.sub;
      } catch (e) {
        // ignore token errors, fallback to body
      }
    }

    if (!userId && req.body && req.body.email) {
      const user = await findByEmail(req.body.email);
      if (user) userId = user._id;
    }

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Unable to determine user for logout" });
    }

    // Find latest login log without logoutAt and set logoutAt
    const log = await LoginLog.findOne({ userId, logoutAt: null })
      .sort({ loginAt: -1 })
      .exec();
    if (!log) {
      return res.status(404).json({ error: "No active login session found" });
    }

    log.logoutAt = new Date();
    await log.save();

    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Auth] logout error", error);
    return res.status(500).json({ error: "Failed to logout" });
  }
};

exports.register = async (req, res) => {
  try {
    console.log('[Auth] Register request body:', req.body);
    const normalized = normalizeRegisterPayload(req.body);
    console.log('[Auth] Normalized payload:', normalized);
    const {
      name,
      contact,
      email,
      companyName,
      state,
      city,
      password,
    } = registerSchema.parse(normalized);
    console.log('[Auth] Validation passed, creating user...');
    const orgId = `org_${uuid().slice(0, 8)}`;
    const user = await createUser({
      orgId,
      name,
      contact,
      email,
      companyName,
      state,
      city,
      role: "admin",
      createdAt: timestamp(),
      password,
    });
    console.log('[Auth] User created:', user._id);

    const tenant = await Tenant.create({
      orgId,
      companyName,
      country: "IN",
      stateName: state,
      city,
      status: "active",
      createdAt: timestamp(),
    });
    console.log('[Auth] Tenant created:', tenant._id);

    // 3️⃣ Generate JWT (IMPORTANT: includes orgId)
    const token = jwt.sign(
      {
        userId: user._id,
        orgId: tenant.orgId,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      id: user._id,
      orgId,
      name: user.name,
      email: user.email,
      contact: user.contact,
      companyName: user.companyName,
      state: user.state,
      city: user.city,
      message: "Company registered successfully",
      token,
      tenant: {
        orgId: tenant.orgId,
        companyName: tenant.companyName,
        stateName: tenant.stateName,
        city: tenant.city,
        country: tenant.country,
      },
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    if (error.name === "ZodError") {
      return handleZodError(error, res);
    }

    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // eslint-disable-next-line no-console
    console.error('[Auth] Unexpected error:', error.message, error.stack);
    return res.status(500).json({ 
      error: "Failed to register user", 
      details: error.message,
      type: error.name 
    });
  }
};
