require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const log = require('./src/utils/logger');

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

// Initialize database connection
initializeDatabase();

// Initialize services
initializeDiscordWebhook();

// Ensure admin user exists on startup
ensureAdminExists();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.use('/api', authRoutes);
app.use('/api', adminRoutes);
app.use('/api', deckRoutes);
app.use('/api', configRoutes);
app.use('/api', systemRoutes);
app.use('/api', profileRoutes);
app.use('/api', announcementRoutes);
app.use('/api/cards', cardRoutes);

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
