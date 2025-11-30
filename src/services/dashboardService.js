const { getAllInvoices } = require('./invoiceService');
const { getAllProducts } = require('./productService');

/**
 * Get dashboard data including sales/invoices and products
 * @returns {Promise<{sales: Array, products: Array}>}
 */
exports.getDashboardData = async () => {
  try {
    const [sales, products] = await Promise.all([
      getAllInvoices(),
      getAllProducts(),
    ]);

    // Ensure sales have the required structure
    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      date: sale.date || sale.createdDate || new Date().toISOString(),
      total: sale.total || 0,
      paymentMethod: sale.paymentMethod || 'Cash',
      items: sale.items || [],
      subtotal: sale.subtotal || 0,
      tax: sale.tax || 0,
      discount: sale.discount || 0,
      customer: sale.customer || null,
    }));

    // Ensure products have the required structure
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock || 0,
      price: product.price || 0,
      sku: product.sku,
      category: product.category,
    }));

    return {
      sales: formattedSales,
      products: formattedProducts,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

