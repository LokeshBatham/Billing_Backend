const { getDashboardData } = require('../services/dashboardService');

exports.getDashboard = async (_req, res) => {
  try {
    console.log('[Dashboard] Fetching dashboard data...');
    const data = await getDashboardData();
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

