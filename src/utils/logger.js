const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
const fs = require('fs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
      })
    )
  }));
}

// Create logger functions for different levels
const log = {
  error: (message, error) => {
    if (error && error.stack) {
      logger.error(message, error);
    } else {
      logger.error(message);
    }
  },
  warn: (message) => logger.warn(message),
  info: (message) => logger.info(message),
  debug: (message) => logger.debug(message),
  
  // Special function for admin actions
  admin: (username, action, details = '') => {
    logger.info(`ADMIN: ${username} - ${action}${details ? ` - ${details}` : ''}`);
  },
  
  // Special function for database operations
  database: (operation, details = '') => {
    logger.info(`DATABASE: ${operation}${details ? ` - ${details}` : ''}`);
  },
  
  // Special function for security events
  security: (event, details = '') => {
    logger.warn(`SECURITY: ${event}${details ? ` - ${details}` : ''}`);
  }
};

module.exports = log;
