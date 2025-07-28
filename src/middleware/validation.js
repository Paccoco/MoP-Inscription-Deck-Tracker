const Joi = require('joi');
const log = require('../utils/logger');

// Common validation schemas
const schemas = {
  // User authentication
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(100).required()
  }),

  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(100).required()
  }),

  // Card operations
  addCard: Joi.object({
    card_name: Joi.string().min(1).max(100).required(),
    deck: Joi.string().min(1).max(50).required()
  }),

  // Deck operations
  addDeck: Joi.object({
    deck: Joi.string().min(1).max(50).required(),
    contributors: Joi.string().max(500).allow('').optional(),
    disposition: Joi.string().valid('Guild Bank', 'Sold', 'Disenchanted', 'Vendor', 'Other').required(),
    recipient: Joi.string().max(100).allow('').optional()
  }),

  completeDeck: Joi.object({
    deck: Joi.string().min(1).max(50).required(),
    cards: Joi.array().items(Joi.string().max(100)).min(1).max(50).required()
  }),

  // Admin operations
  approveUser: Joi.object({
    userId: Joi.number().integer().positive().required()
  }),

  updateUserRole: Joi.object({
    userId: Joi.number().integer().positive().required(),
    isAdmin: Joi.boolean().required()
  }),

  deleteUser: Joi.object(),

  resetPassword: Joi.object({
    userId: Joi.number().integer().positive().required(),
    newPassword: Joi.string().min(6).max(100).required()
  }),

  // Configuration
  discordWebhook: Joi.object({
    webhookUrl: Joi.string().uri().allow('').optional()
  }),

  gotifyConfig: Joi.object({
    server: Joi.string().uri().allow('').optional(),
    token: Joi.string().max(200).allow('').optional()
  }),

  // Announcements
  createAnnouncement: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    expiry: Joi.date().iso().greater('now').optional(),
    links: Joi.string().max(2000).allow('').optional(),
    active: Joi.boolean().optional()
  }),

  // Query parameters
  limitQuery: Joi.object({
    limit: Joi.number().integer().min(1).max(1000).optional()
  }),

  // Route parameters
  idParam: Joi.object({
    id: Joi.number().integer().positive().required()
  }),

  userIdParam: Joi.object({
    userId: Joi.number().integer().positive().required()
  })
};

// Validation middleware factory
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    let data;
    
    switch (source) {
      case 'body':
        data = req.body;
        break;
      case 'params':
        data = req.params;
        // Convert string parameters to appropriate types
        if (data.id) data.id = parseInt(data.id);
        if (data.userId) data.userId = parseInt(data.userId);
        break;
      case 'query':
        data = req.query;
        // Convert string parameters to appropriate types
        if (data.limit) data.limit = parseInt(data.limit);
        break;
      default:
        data = req.body;
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true // Remove unknown properties
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      log.warn(`Validation failed for ${req.method} ${req.path}: ${errorMessage}`, {
        userId: req.user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Replace original data with validated/sanitized data
    switch (source) {
      case 'body':
        req.body = value;
        break;
      case 'params':
        req.params = value;
        break;
      case 'query':
        req.query = value;
        break;
    }

    next();
  };
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential XSS vectors
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/javascript:/gi, '') // Remove javascript: protocol
          .replace(/on\w+\s*=/gi, '') // Remove event handlers
          .trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

module.exports = {
  schemas,
  validate,
  sanitizeInput
};
