const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Root route - for health checks and monitoring
app.get('/', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Billing Backend API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      dashboard: '/api/dashboard',
      customers: '/api/customers',
      reports: '/api/reports',
      billingHistory: '/api/billing-history',
      invoices: '/api/invoices',
      refunds: '/api/refunds',
      users: '/api/users'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle HEAD requests for root (common in health checks)
app.head('/', (_req, res) => {
  res.status(200).end();
});

// Load routes with error handling
let productRoutes, authRoutes, dashboardRoutes, customerRoutes, reportsRoutes;
let billingHistoryRoutes, invoiceRoutes, refundRoutes, userRoutes;

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

try {
  customerRoutes = require('./routes/customerRoutes');
  console.log('[App] Customer routes loaded');
} catch (error) {
  console.error('[App] Error loading customer routes:', error);
}

try {
  reportsRoutes = require('./routes/reportsRoutes');
  console.log('[App] Reports routes loaded');
} catch (error) {
  console.error('[App] Error loading reports routes:', error);
}

try {
  billingHistoryRoutes = require('./routes/billingHistoryRoutes');
  console.log('[App] Billing history routes loaded');
} catch (error) {
  console.error('[App] Error loading billing history routes:', error);
}

try {
  invoiceRoutes = require('./routes/invoiceRoutes');
  console.log('[App] Invoice routes loaded');
} catch (error) {
  console.error('[App] Error loading invoice routes:', error);
}

try {
  refundRoutes = require('./routes/refundRoutes');
  console.log('[App] Refund routes loaded');
} catch (error) {
  console.error('[App] Error loading refund routes:', error);
}

try {
  userRoutes = require('./routes/userRoutes');
  console.log('[App] User routes loaded');
} catch (error) {
  console.error('[App] Error loading user routes:', error);
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
        auth: !!authRoutes,
        customers: !!customerRoutes
      }
    });
  });
}

if (customerRoutes) {
  app.use('/api/customers', customerRoutes);
  console.log('[App] Customer routes registered at /api/customers');
}

if (reportsRoutes) {
  app.use('/api/reports', reportsRoutes);
  console.log('[App] Reports routes registered at /api/reports');
}

if (billingHistoryRoutes) {
  app.use('/api/billing-history', billingHistoryRoutes);
  console.log('[App] Billing history routes registered at /api/billing-history');
}

if (invoiceRoutes) {
  app.use('/api/invoices', invoiceRoutes);
  console.log('[App] Invoice routes registered at /api/invoices');
}

if (refundRoutes) {
  app.use('/api/refunds', refundRoutes);
  console.log('[App] Refund routes registered at /api/refunds');
}

if (userRoutes) {
  app.use('/api/users', userRoutes);
  console.log('[App] User routes registered at /api/users');
}

// 404 handler for unmatched routes (must be last)
// Note: Express 5 doesn't support /api/* pattern, so we use a catch-all
app.use((req, res, next) => {
  // Check if it's an API route that wasn't matched
  if (req.path.startsWith('/api/')) {
    console.log('[App] 404 - API route not found:', req.method, req.path);
    return res.status(404).json({ 
      error: 'API endpoint not found', 
      path: req.path,
      method: req.method,
      availableRoutes: ['/api/auth', '/api/products', '/api/dashboard', '/api/customers', '/api/reports', '/api/billing-history', '/api/invoices', '/api/refunds', '/api/users']
    });
  }
  
  // General 404 for non-API routes
  console.log('[App] 404 - Route not found:', req.method, req.path);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method
  });
});

module.exports = app;

