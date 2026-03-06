const invoiceService = require('../services/invoiceService');

exports.list = async (req, res) => {
  try {
    const invoices = await invoiceService.getAllInvoices();
    return res.json(invoices);
  } catch (error) {
    console.error('[InvoiceController] Error listing invoices:', error);
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

exports.getById = async (req, res) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(invoice);
  } catch (error) {
    console.error('[InvoiceController] Error getting invoice:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

exports.create = async (req, res) => {
  try {
    const invoice = await invoiceService.createInvoice(req.body);
    return res.status(201).json(invoice);
  } catch (error) {
    console.error('[InvoiceController] Error creating invoice:', error);
    return res.status(500).json({ error: 'Failed to create invoice' });
  }
};

exports.update = async (req, res) => {
  try {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    return res.json(invoice);
  } catch (error) {
    console.error('[InvoiceController] Error updating invoice:', error);
    return res.status(500).json({ error: 'Failed to update invoice' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await invoiceService.deleteInvoice(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Invoice not found' });
    return res.json({ message: 'Invoice deleted' });
  } catch (error) {
    console.error('[InvoiceController] Error deleting invoice:', error);
    return res.status(500).json({ error: 'Failed to delete invoice' });
  }
};
