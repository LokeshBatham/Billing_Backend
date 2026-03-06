const Invoice = require('../models/Invoice');

exports.getSalesReport = async () => {
  try {
    const invoices = await Invoice.find().lean();

    const formattedSales = invoices.map((invoice) => ({
      id: invoice._id.toString(),
      date: invoice.date || invoice.createdDate || (invoice.createdAt ? invoice.createdAt.toISOString() : new Date().toISOString()),
      total: invoice.total || 0,
      paymentMethod: invoice.paymentMethod || 'Cash',
      items: invoice.items || [],
      subtotal: invoice.subtotal || 0,
      tax: invoice.tax || 0,
      discount: invoice.discount || 0,
      customer: invoice.customer || null,
      createdDate: invoice.createdDate,
      createdTime: invoice.createdTime,
    }));

    return formattedSales;
  } catch (error) {
    console.error('[ReportsService] Error fetching sales report:', error);
    throw error;
  }
};
