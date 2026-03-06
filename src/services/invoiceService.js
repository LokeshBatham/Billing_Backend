const Invoice = require('../models/Invoice');

exports.getAllInvoices = async () => {
  const invoices = await Invoice.find().lean();
  return invoices.map((inv) => ({ ...inv, id: inv._id.toString() }));
};

exports.getInvoiceById = async (id) => {
  const invoice = await Invoice.findById(id).lean();
  return invoice ? { ...invoice, id: invoice._id.toString() } : null;
};

exports.createInvoice = async (payload) => {
  const invoice = await Invoice.create(payload);
  return { ...invoice.toObject(), id: invoice._id.toString() };
};

exports.updateInvoice = async (id, payload) => {
  const invoice = await Invoice.findByIdAndUpdate(id, payload, { new: true }).lean();
  return invoice ? { ...invoice, id: invoice._id.toString() } : null;
};

exports.deleteInvoice = async (id) => {
  const result = await Invoice.findByIdAndDelete(id);
  return !!result;
};
