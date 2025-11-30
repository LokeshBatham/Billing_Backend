const { getSalesReport } = require('../services/reportsService');

exports.getSales = async (req, res) => {
  try {
    const sales = await getSalesReport();
    return res.json(sales);
  } catch (error) {
    console.error('[ReportsController] Error fetching sales:', error);
    return res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

