const { getDashboardData } = require('../services/dashboardService');
const { isReady: dbIsReady } = require('../utils/db');

exports.getDashboard = async (_req, res) => {
  if (!dbIsReady()) {
    return res.status(503).json({ error: 'DatabaseUnavailable', message: 'Database is not ready' });
  }

  try {
    console.log('[Dashboard] Fetching dashboard data...');
    const data = await getDashboardData(_req.orgId);
    console.log('[Dashboard] Data fetched successfully:', {
      salesCount: data.sales?.length || 0,
      productsCount: data.products?.length || 0
    });
    return res.json(data);
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error.message 
    });
  }
};

