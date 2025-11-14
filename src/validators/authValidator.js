const { z } = require('zod');

const normalizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

exports.normalizeLoginPayload = (payload = {}) => ({
  email: normalizeString(payload.email),
  password: typeof payload.password === 'string' ? payload.password : '',
});

exports.loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Email must be valid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

