const rateLimit = require('express-rate-limit');
const log = require('../utils/logger');

// Custom rate limit handler with logging
const rateLimitHandler = (req, res) => {
  log.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  res.status(429).json({
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000)
  });
};

// Skip successful requests for certain endpoints
const skipSuccessfulRequests = (req, res) => {
  return res.statusCode < 400;
};

// Rate limiting configurations
const rateLimits = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes per IP
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: (req, res) => {
      // Don't count successful logins against the rate limit
      return res.statusCode === 200;
    }
  }),

  // Medium rate limiting for admin operations
  admin: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 requests per 10 minutes per IP
    message: 'Too many admin requests. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipSuccessfulRequests
  }),

  // Moderate rate limiting for card/deck operations
  api: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // 100 requests per 5 minutes per IP
    message: 'Too many API requests. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipSuccessfulRequests
  }),

  // Light rate limiting for general endpoints
  general: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute per IP
    message: 'Too many requests. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: skipSuccessfulRequests
  }),

  // Very strict rate limiting for password reset
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour per IP
    message: 'Too many password reset attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  }),

  // Registration rate limiting
  registration: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler
  })
};

module.exports = rateLimits;
