const { getAllInvoices, getAllInvoicesByOrg } = require('./invoiceService');
const { getCustomerById, getCustomerByIdAndOrg } = require('./customerService');

/**
 * Get all sales/invoices for reports
 * @returns {Promise<Array>} Array of formatted invoice/sale objects
 */
exports.getSalesReport = async (orgId) => {
  try {
    const invoices = orgId ? await getAllInvoicesByOrg(orgId) : await getAllInvoices();

    // Format invoices to match frontend Invoice type, enrich with customer and computed fields
    const formattedSales = await Promise.all(invoices.map(async (invoice) => {
      const items = Array.isArray(invoice.items) ? invoice.items : [];

      // Compute subtotal from items if not provided
      const computedSubtotal = items.reduce((sum, it) => {
        const price = Number(it.price ?? it.unitPrice ?? it.rate ?? 0) || 0;
        const qty = Number(it.quantity ?? it.qty ?? 1) || 1;
        const itemTotal = Number(it.total ?? (price * qty)) || (price * qty);
        return sum + itemTotal;
      }, 0);

      const subtotal = invoice.subtotal !== undefined ? Number(invoice.subtotal) : computedSubtotal;
      const tax = invoice.tax !== undefined ? Number(invoice.tax) : 0;
      const discount = invoice.discount !== undefined ? Number(invoice.discount) : 0;
      const total = invoice.total !== undefined ? Number(invoice.total) : (subtotal + tax - discount);

      // Enrich customer if customerId present
      let customer = invoice.customer || null;
      if (!customer && invoice.customerId) {
        try {
          customer = orgId
            ? await getCustomerByIdAndOrg(invoice.customerId, orgId)
            : await getCustomerById(invoice.customerId);
        } catch (e) {
          customer = null;
        }
      }

      return {
        id: invoice.id,
        date: invoice.date || invoice.createdAt || new Date().toISOString(),
        total,
        paymentMethod: invoice.paymentMethod || invoice.payment || 'Cash',
        items,
        subtotal,
        tax,
        discount,
        customer,
        createdAt: invoice.createdAt || invoice.createdDate,
        updatedAt: invoice.updatedAt || invoice.updatedDate,
      };
    }));

    return formattedSales;
  } catch (error) {
    console.error('[ReportsService] Error fetching sales report:', error);
    throw error;
  }
};

