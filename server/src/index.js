const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { validateEnvironment } = require('./config/envCheck');

// Validate environment secrets
validateEnvironment();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const { connectDB, getDBStatus } = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimiter');
const cookieParser = require('./middleware/cookieParser');
const errorHandler = require('./middleware/errorHandler');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const customerRoutes = require('./routes/customerRoutes');
const exportRoutes = require('./routes/exportRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Ensure MongoDB connection in serverless environments
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch {}
  }
  next();
});

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Strict CORS Whitelist Configuration
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
  'http://127.0.0.1:5173'
];

const envOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : [])
].filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin) ||
      origin.endsWith('.github.io') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('praztechtools.com') ||
      origin.includes('praztech.com')
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser);

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Serve static images/placeholders
app.use('/images', express.static(path.join(__dirname, '../../client/public/images')));

// API Routes (supports both direct and /api prefixed routes for Vercel services compatibility)
['/api/auth', '/auth'].forEach(p => app.use(p, authRoutes));
['/api/products', '/products'].forEach(p => app.use(p, productRoutes));
['/api/categories', '/categories'].forEach(p => app.use(p, categoryRoutes));
['/api/enquiries', '/enquiries'].forEach(p => app.use(p, enquiryRoutes));
['/api/customers', '/customers'].forEach(p => app.use(p, customerRoutes));
['/api/admin/export', '/admin/export'].forEach(p => app.use(p, exportRoutes));
['/api/contact', '/contact'].forEach(p => app.use(p, contactRoutes));

// Health check endpoint
['/api/health', '/health'].forEach(p => {
  app.get(p, (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'PRAZTECH® Engineering B2B Catalogue API',
      database: getDBStatus() ? 'connected (MongoDB Atlas)' : 'local JSON fallback',
      environment: process.env.NODE_ENV || 'development'
    });
  });
});

// Serve frontend static build if available (supports running complete app on port 5001 or 3000)
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/images')) {
      return next();
    }
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Centralized error handling
app.use(errorHandler);

// Start server if run directly
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 PRAZTECH® Engineering API running on port ${PORT}`);
    console.log(`📡 Local Health Check:   http://localhost:${PORT}/api/health`);
    console.log(`📡 Network Health Check: http://192.168.1.9:${PORT}/api/health`);
    console.log(`⚙️  Environment:          ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
