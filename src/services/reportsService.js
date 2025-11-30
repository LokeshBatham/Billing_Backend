const { getAllInvoices } = require('./invoiceService');

/**
 * Get all sales/invoices for reports
 * @returns {Promise<Array>} Array of formatted invoice/sale objects
 */
exports.getSalesReport = async () => {
  try {
    const invoices = await getAllInvoices();
    
    // Format invoices to match frontend Invoice type
    const formattedSales = invoices.map((invoice) => ({
      id: invoice.id,
      date: invoice.date || invoice.createdDate || new Date().toISOString(),
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

