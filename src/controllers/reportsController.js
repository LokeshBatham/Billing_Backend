const { getSalesReport } = require('../services/reportsService');
const { isReady: dbIsReady } = require('../utils/db');

exports.getSales = async (req, res) => {
  if (!dbIsReady()) {
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'Database is not ready' });
  }

  try {
    const sales = await getSalesReport();
    return res.json(sales);
  } catch (error) {
    console.error('[ReportsController] Error fetching sales:', error);
    return res.status(500).json({ error: 'Failed to fetch sales data' });
  }
};

