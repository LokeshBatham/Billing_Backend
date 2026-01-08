const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Optionally parse Authorization header if present to populate req.user / req.orgId
try {
  const authMiddleware = require('./middleware/authMiddleware');
  if (authMiddleware && typeof authMiddleware.optional === 'function') {
    app.use(authMiddleware.optional);
  }
} catch (err) {
  // ignore auth middleware load failures
}

// Required auth middleware for protected routes
let requireAuth;
try {
  requireAuth = require('./middleware/authMiddleware');
} catch (err) {
  requireAuth = null;
}

// Simple request logger to aid debugging incoming requests
app.use((req, res, next) => {
  console.log('[App] Incoming request:', req.method, req.path);
  next();
});

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
      reports: '/api/reports'
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

// API Routes - register in order
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('[App] Auth routes registered at /api/auth');
}

// Backwards compatibility: accept legacy /api/register path
try {
  const authController = require('./controllers/authController');
  const registerRouter = express.Router();
  registerRouter.post('/', authController.register);
  app.use('/api/register', registerRouter);
  console.log('[App] Legacy /api/register POST handler registered at /api/register');
} catch (err) {
  console.error('[App] Failed to register legacy /api/register handler:', err);
}

// Global guard: require JWT for all /api/* endpoints except auth + legacy register
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  if (req.path.startsWith('/register')) return next();
  if (!requireAuth) {
    return res.status(500).json({ error: 'AuthMiddlewareUnavailable' });
  }
  return requireAuth(req, res, next);
});

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
      availableRoutes: ['/api/auth', '/api/register', '/api/products', '/api/dashboard', '/api/customers', '/api/reports']
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

// Centralized error handler (must be after routes and 404 handler)
try {
  const errorHandler = require('./middleware/errorHandler');
  app.use(errorHandler);
  console.log('[App] Centralized error handler registered');
} catch (err) {
  console.error('[App] Failed to register error handler:', err);
}

module.exports = app;

