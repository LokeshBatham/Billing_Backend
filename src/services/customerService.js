const Customer = require('../models/Customer');

exports.getAllCustomers = async (search) => {
  let filter = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    filter = { $or: [{ name: regex }, { email: regex }, { phone: regex }, { contact: regex }] };
  }
  const customers = await Customer.find(filter).lean();
  return customers.map((c) => ({ ...c, id: c._id.toString() }));
};

exports.getCustomerById = async (id) => {
  const customer = await Customer.findById(id).lean();
  return customer ? { ...customer, id: customer._id.toString() } : null;
};

exports.createCustomer = async (payload) => {
  const customer = await Customer.create(payload);
  return { ...customer.toObject(), id: customer._id.toString() };
};

exports.updateCustomer = async (id, payload) => {
  const customer = await Customer.findByIdAndUpdate(id, payload, { new: true }).lean();
  return customer ? { ...customer, id: customer._id.toString() } : null;
};

exports.deleteCustomer = async (id) => {
  const result = await Customer.findByIdAndDelete(id);
  return !!result;
};
