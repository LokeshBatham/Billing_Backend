const path = require('path');
const { v4: uuid } = require('uuid');
const { readJsonFile, writeJsonFile } = require('../utils/jsonStore');

const DATA_FILE = path.resolve(__dirname, '../../data/customers.json');

const timestamp = () => new Date().toISOString();

const clone = (customer) => ({ ...customer });

const loadCustomers = async () => {
  const data = await readJsonFile(DATA_FILE, []);
  return Array.isArray(data) ? data : [];
};

const saveCustomers = async (items) => {
  await writeJsonFile(DATA_FILE, items);
};

exports.getAllCustomers = async () => {
  const customers = await loadCustomers();
  return customers.map(clone);
};

exports.getCustomerById = async (id) => {
  const customers = await loadCustomers();
  const customer = customers.find((item) => item.id === id);
  return customer ? clone(customer) : null;
};

exports.searchCustomers = async (query) => {
  const customers = await loadCustomers();
  if (!query || query.trim() === '') {
    return customers.map(clone);
  }
  
  const searchTerm = query.toLowerCase().trim();
  const filtered = customers.filter((customer) => {
    const name = (customer.name || '').toLowerCase();
    const email = (customer.email || '').toLowerCase();
    const phone = (customer.phone || '').toLowerCase();
    
    return name.includes(searchTerm) || 
           email.includes(searchTerm) || 
           phone.includes(searchTerm);
  });
  
  return filtered.map(clone);
};

exports.createCustomer = async (payload) => {
  const customers = await loadCustomers();
  const now = timestamp();
  const customer = {
    id: uuid(),
    createdAt: now,
    updatedAt: now,
    ...payload,
  };

  customers.push(customer);
  await saveCustomers(customers);
  return clone(customer);
};

exports.updateCustomer = async (id, payload) => {
  const customers = await loadCustomers();
  const index = customers.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const current = customers[index];
  const updated = {
    ...current,
    ...payload,
    id,
    updatedAt: timestamp(),
  };

  customers[index] = updated;
  await saveCustomers(customers);

  return clone(updated);
};

exports.deleteCustomer = async (id) => {
  const customers = await loadCustomers();
  const index = customers.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  customers.splice(index, 1);
  await saveCustomers(customers);
  return true;
};

