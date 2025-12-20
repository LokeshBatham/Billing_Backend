const {
  getAllCustomers,
  getCustomerById,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../services/customerService');
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
      customers = await searchCustomers(search);
    } else {
      customers = await getAllCustomers();
    }
    
    return res.json(customers);
  } catch (error) {
    console.error('[CustomerController] Error listing customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

exports.getById = async (req, res) => {
  try {
    const customer = await getCustomerById(req.params.id);

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
  try {
    const normalized = normalizeCustomerPayload(req.body);
    const validated = createCustomerSchema.parse(normalized);

    try {
      const created = await createCustomer(validated);
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

  try {
    const existing = await getCustomerById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const normalized = normalizeCustomerPayload(req.body);
    const validated = updateCustomerSchema.parse(normalized);

    const updated = await updateCustomer(id, validated);
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
    const removed = await deleteCustomer(id);

    if (!removed) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('[CustomerController] Error deleting customer:', error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
};

