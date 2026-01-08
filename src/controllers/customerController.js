const {
  getAllCustomers,
  getAllCustomersByOrg,
  getCustomerById,
  getCustomerByIdAndOrg,
  searchCustomers,
  searchCustomersForOrg,
  createCustomer,
  createCustomerForOrg,
  updateCustomer,
  updateCustomerForOrg,
  deleteCustomer,
  deleteCustomerForOrg,
} = require('../services/customerService');
const { isReady: dbIsReady } = require('../utils/db');
const {
  createCustomerSchema,
  updateCustomerSchema,
  normalizeCustomerPayload,
} = require('../validators/customerValidator');

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

exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    
    let customers;
    if (search) {
      customers = await searchCustomersForOrg(req.orgId, search);
    } else {
      customers = await getAllCustomersByOrg(req.orgId);
    }
    
    return res.json(customers);
  } catch (error) {
    console.error('[CustomerController] Error listing customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await getCustomerByIdAndOrg(req.params.id, req.orgId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);
  } catch (error) {
    console.error('[CustomerController] Error fetching customer:', error);
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

exports.create = async (req, res) => {
  if (!dbIsReady()) {
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'Database is not ready' });
  }
  try {
    const normalized = normalizeCustomerPayload(req.body);
    const validated = createCustomerSchema.parse(normalized);

    try {
      const created = await createCustomerForOrg(req.orgId, validated);
      return res.status(201).json(created);
    } catch (err) {
      // Handle DB unique constraint (email) errors
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already exists' });
      }
      throw err;
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return handleZodError(error, res);
    }
    console.error('[CustomerController] Error creating customer:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;

  if (!dbIsReady()) {
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'Database is not ready' });
  }

  try {
    const existing = await getCustomerByIdAndOrg(id, req.orgId);

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const normalized = normalizeCustomerPayload(req.body);
    const validated = updateCustomerSchema.parse(normalized);

    const updated = await updateCustomerForOrg(req.orgId, id, validated);
    return res.json(updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return handleZodError(error, res);
    }
    // Handle DB unique constraint errors
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    console.error('[CustomerController] Error updating customer:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
};

exports.remove = async (req, res) => {
  const { id } = req.params;

  try {
    const removed = await deleteCustomerForOrg(req.orgId, id);

    if (!removed) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('[CustomerController] Error deleting customer:', error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
};

