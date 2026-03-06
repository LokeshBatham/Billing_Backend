const { z } = require('zod');

const normalizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

exports.normalizeLoginPayload = (payload = {}) => ({
  companyName: normalizeString(payload.companyName),
  email: normalizeString(payload.email),
  password: typeof payload.password === 'string' ? payload.password : '',
});

exports.loginSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().min(1, 'Email is required').email('Email must be valid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

