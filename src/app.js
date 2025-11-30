const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Load routes with error handling
let productRoutes, authRoutes, dashboardRoutes;

try {
  productRoutes = require('./routes/productRoutes');
  console.log('[App] Product routes loaded');
} catch (error) {
  console.error('[App] Error loading product routes:', error);
}

try {
  authRoutes = require('./routes/authRoutes');
  console.log('[App] Auth routes loaded');
} catch (error) {
  console.error('[App] Error loading auth routes:', error);
}

try {
  dashboardRoutes = require('./routes/dashboardRoutes');
  console.log('[App] Dashboard routes loaded');
} catch (error) {
  console.error('[App] Error loading dashboard routes:', error);
}

// API Routes - register in order
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('[App] Auth routes registered at /api/auth');
}

if (productRoutes) {
  app.use('/api/products', productRoutes);
  console.log('[App] Product routes registered at /api/products');
}

if (dashboardRoutes) {
  app.use('/api/dashboard', dashboardRoutes);
  console.log('[App] Dashboard routes registered at /api/dashboard');
  
  // Direct test route for dashboard (for debugging)
  app.get('/api/dashboard/test', (_req, res) => {
    res.json({ 
      message: 'Dashboard test route is working',
      timestamp: new Date().toISOString(),
      routesLoaded: {
        dashboard: !!dashboardRoutes,
        products: !!productRoutes,
        auth: !!authRoutes
      }
    });
  });
}

// 404 handler for unmatched API routes (must be last)
app.use('/api/*', (req, res) => {
  console.log('[App] 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    error: 'API endpoint not found', 
    path: req.path,
    method: req.method,
    availableRoutes: ['/api/auth', '/api/products', '/api/dashboard']
  });
});

// General 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method
  });
});

module.exports = app;

