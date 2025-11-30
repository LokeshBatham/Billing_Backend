const { z } = require('zod');

const normalizeCustomerPayload = (payload) => {
  const normalized = { ...payload };
  
  // Trim string fields
  if (normalized.name) normalized.name = normalized.name.trim();
  if (normalized.email) normalized.email = normalized.email.trim();
  if (normalized.phone) normalized.phone = normalized.phone.trim();
  
  // Remove empty strings
  if (normalized.email === '') normalized.email = undefined;
  if (normalized.phone === '') normalized.phone = undefined;
  
  return normalized;
};

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(6, 'Phone number must be at least 6 digits').max(15, 'Phone number is too long').optional().or(z.literal('')),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long').optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(6, 'Phone number must be at least 6 digits').max(15, 'Phone number is too long').optional().or(z.literal('')),
});

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  normalizeCustomerPayload,
};

