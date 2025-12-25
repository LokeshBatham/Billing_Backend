const { z } = require('zod');

const normalizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

exports.normalizeRegisterPayload = (payload = {}) => ({
  name: normalizeString(payload.name),
  contact: normalizeString(payload.contact),
  email: normalizeString(payload.email),
  companyName: normalizeString(payload.companyName),
  state: normalizeString(payload.state),
  city: normalizeString(payload.city),
  password: typeof payload.password === 'string' ? payload.password : '',
});

exports.registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().min(6, 'Contact is required'),
  email: z.string().email('Email must be valid'),
  companyName: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});
