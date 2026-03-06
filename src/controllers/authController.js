const { loginSchema, normalizeLoginPayload } = require('../validators/authValidator');
const { authenticateUser, registerUser } = require('../services/authService');

const handleZodError = (error, res) => {
  const details = error.errors.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  return res.status(400).json({
    error: 'ValidationError',
    details,
  });
};

exports.login = async (req, res) => {
  try {
    const normalized = normalizeLoginPayload(req.body);
    const { email, password } = loginSchema.parse(normalized);
    const authResult = await authenticateUser(email, password);

    if (!authResult) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json(authResult);
  } catch (error) {
    if (error.name === 'ZodError') {
      return handleZodError(error, res);
    }

    console.error(error);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, companyName, contact, state, city } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await registerUser({ name, email: email.trim(), password, companyName, contact, state, city });

    if (result.error) {
      return res.status(409).json({ error: result.error });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error('[AuthController] Register error:', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
};
