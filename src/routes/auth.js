const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, query } = require('../utils/database-adapter');
const { SECRET } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const rateLimits = require('../middleware/rateLimiting');
const log = require('../utils/logger');

const router = express.Router();

// User registration - sets approved=0 by default
router.post('/register', 
  rateLimits.registration,
  validate(schemas.register, 'body'),
  (req, res) => {
    const { username, password } = req.body;
    
    log.info('Registration attempt', { 
      username, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    
    // Check if user already exists - optimized query
    db.get('SELECT id, username FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        log.error('Database error during registration check', { error: err.message, username });
        return res.status(500).json({ error: 'Database error occurred.' });
      }
      
      if (user) {
        log.warn('Registration attempt with existing username', { username, ip: req.ip });
        return res.status(409).json({ error: 'Username already exists.' });
      }
      
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          log.error('Password hashing failed', { error: err.message, username });
          return res.status(500).json({ error: 'Failed to hash password.' });
        }
        
        db.run('INSERT INTO users (username, password, approved) VALUES (?, ?, 0)', [username, hash], function (err) {
          if (err) {
            log.error('User registration failed', { error: err.message, username });
            return res.status(500).json({ error: 'Failed to register user.' });
          }
          
          log.info('User registered successfully', { 
            username, 
            userId: this.lastID, 
            ip: req.ip 
          });
          res.json({ success: true, message: 'Registration successful. Please wait for admin approval.' });
        });
      });
    });
  }
);

// User login - only allows approved users
router.post('/login',
  validate(schemas.login, 'body'),
  (req, res) => {
    const { username, password } = req.body;
    
    log.info('Login attempt', { 
      username, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        log.error('Database error during login', { error: err.message, username });
        return res.status(500).json({ error: 'Database error occurred.' });
      }
      
      if (!user) {
        log.warn('Login attempt with non-existent username', { username, ip: req.ip });
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      
      if (!user.approved) {
        log.warn('Login attempt by unapproved user', { username, userId: user.id, ip: req.ip });
        return res.status(401).json({ error: 'Account not yet approved by administrator.' });
      }
      
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          log.error('Password comparison error', { error: err.message, username });
          return res.status(500).json({ error: 'Authentication error occurred.' });
        }
        
        if (!result) {
          log.warn('Login attempt with invalid password', { username, userId: user.id, ip: req.ip });
          return res.status(401).json({ error: 'Invalid username or password.' });
        }
        
        const token = jwt.sign(
          { username: user.username, is_admin: !!user.is_admin }, 
          SECRET, 
          { expiresIn: '7d' }
        );
        
        log.info('User logged in successfully', { 
          username, 
          userId: user.id, 
          isAdmin: !!user.is_admin,
          ip: req.ip 
        });
        
        res.json({ 
          token,
          user: {
            username: user.username,
            isAdmin: !!user.is_admin
          }
        });
      });
    });
  }
);

module.exports = router;
