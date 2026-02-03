// Load environment variables - try multiple locations
require('dotenv').config({ path: '../.env' });
require('dotenv').config(); // Also try current directory
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const applicationsRoutes = require('./routes/applications');
const resumesRoutes = require('./routes/resumes');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const userRoutes = require('./routes/user');
const aiRoutes = require('./routes/ai');

// ============================================
// Environment Validation
// ============================================
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const OPTIONAL_ENV_VARS = ['SESSION_SECRET', 'PORT', 'NODE_ENV'];

const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\nPlease set these in your .env file or environment.');
  process.exit(1);
}

// ============================================
// Express App Setup
// ============================================
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: isProduction ? true : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Security headers for production
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
}

// ============================================
// API Routes
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: isProduction ? 'production' : 'development'
  });
});

// ============================================
// Static Files (Production)
// ============================================
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ============================================
// Error Handling
// ============================================
app.use((err, req, res, next) => {
  // Log errors in development only
  if (!isProduction) {
    console.error('Error:', err.message);
  }

  res.status(err.status || 500).json({
    error: isProduction ? 'Something went wrong' : err.message,
  });
});

// ============================================
// Server Start
// ============================================
app.listen(PORT, '0.0.0.0', () => {
  if (!isProduction) {
    console.log(`🚀 ApplyTrack Pro server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: development`);
  }
});
