const { loginSchema, normalizeLoginPayload } = require('../validators/authValidator');
const { authenticateUser } = require('../services/authService');

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

    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

