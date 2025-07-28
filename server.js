require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const log = require('./src/utils/logger');

// Import security middleware
const { securityHeaders, corsOptions, corsOptionsDev } = require('./src/middleware/security');
const rateLimits = require('./src/middleware/rateLimiting');
const { sanitizeInput } = require('./src/middleware/validation');

// Import utilities and services
const { initializeDatabase, ensureAdminExists } = require('./src/utils/database-adapter');
const { initializeDiscordWebhook } = require('./src/services/notifications');

// Import route modules
const authRoutes = require('./src/routes/auth');
const cardRoutes = require('./src/routes/cards');
const adminRoutes = require('./src/routes/admin');
const deckRoutes = require('./src/routes/decks');
const configRoutes = require('./src/routes/config');
const systemRoutes = require('./src/routes/system');
const profileRoutes = require('./src/routes/profile');
const announcementRoutes = require('./src/routes/announcements');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database connection FIRST
initializeDatabase();

// Initialize services AFTER database is ready
initializeDiscordWebhook();

// Ensure admin user exists on startup
ensureAdminExists();

// Security middleware - MUST be first
app.use(securityHeaders);

// CORS configuration - environment dependent
const corsConfig = process.env.NODE_ENV === 'production' ? corsOptions : corsOptionsDev;
app.use(cors(corsConfig));

// General rate limiting for all requests
app.use(rateLimits.general);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Input sanitization middleware
app.use(sanitizeInput);

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// Health check endpoint for Docker
app.get('/api/health', (req, res) => {
  // Check database connection
  const { db } = require('./src/utils/database-adapter');
  
  db.get('SELECT 1 as health', [], (err, row) => {
    if (err) {
      log.error('Health check failed - database error', { error: err.message });
      return res.status(503).json({ 
        status: 'unhealthy', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString() 
      });
    }
    
    if (row && row.health === 1) {
      res.status(200).json({ 
        status: 'healthy', 
        database: 'connected',
        version: '2.0.0-alpha.1',
        timestamp: new Date().toISOString() 
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        error: 'Database query failed',
        timestamp: new Date().toISOString() 
      });
    }
  });
});

// API Routes with specific rate limiting
app.use('/api/auth', rateLimits.auth, authRoutes);
app.use('/api/admin', rateLimits.admin, adminRoutes);
app.use('/api/decks', rateLimits.api, deckRoutes);
app.use('/api/config', rateLimits.admin, configRoutes);
app.use('/api/system', rateLimits.api, systemRoutes);
app.use('/api/profile', rateLimits.api, profileRoutes);
app.use('/api/announcements', rateLimits.api, announcementRoutes);
app.use('/api/cards', rateLimits.api, cardRoutes);

// Catch-all handler for React routing - MUST be last
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  log.info(`MoP Card Tracker Server v2.0.0-alpha running on port ${PORT}`);
});
