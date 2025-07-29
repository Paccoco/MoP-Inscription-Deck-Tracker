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
  async (req, res) => {
    const { username, password } = req.body;
    
    log.info('Registration attempt', { 
      username, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    
    // Check if user already exists - optimized query
    try {
      const existingUsers = await query('SELECT id, username FROM users WHERE username = $1', [username]);
      const user = existingUsers[0];
      
      if (user) {
        log.warn('Registration attempt with existing username', { username, ip: req.ip });
        return res.status(409).json({ error: 'Username already exists.' });
      }
      
      const hash = await new Promise((resolve, reject) => {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) reject(err);
          else resolve(hash);
        });
      });
      
      const result = await query(
        'INSERT INTO users (username, password_hash, approved) VALUES ($1, $2, $3) RETURNING id', 
        [username, hash, false]
      );
      
      const userId = result[0].id;
      
      log.info('User registered successfully', { 
        username, 
        userId, 
        ip: req.ip 
      });
      res.json({ success: true, message: 'Registration successful. Please wait for admin approval.' });
    } catch (err) {
      if (err.message && err.message.includes('hash')) {
        log.error('Password hashing failed', { error: err.message, username });
        return res.status(500).json({ error: 'Failed to hash password.' });
      } else {
        log.error('User registration failed', { error: err.message, username });
        return res.status(500).json({ error: 'Failed to register user.' });
      }
    }
  }
);

// User login - only allows approved users
router.post('/login',
  validate(schemas.login, 'body'),
  async (req, res) => {
    const { username, password } = req.body;
    
    log.info('Login attempt', { 
      username, 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    
    try {
      const users = await query('SELECT * FROM users WHERE username = $1', [username]);
      const user = users[0]; // Get first result
      
      if (!user) {
        log.warn('Login attempt with non-existent username', { username, ip: req.ip });
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      
      if (!user.approved) {
        log.warn('Login attempt by unapproved user', { username, userId: user.id, ip: req.ip });
        return res.status(401).json({ error: 'Account not yet approved by administrator.' });
      }
      
      const passwordMatch = await new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password_hash, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      if (!passwordMatch) {
        log.warn('Login attempt with invalid password', { username, userId: user.id, ip: req.ip });
        return res.status(401).json({ error: 'Invalid username or password.' });
      }
      
      const isAdmin = user.role === 'admin';
      
      const token = jwt.sign(
        { username: user.username, is_admin: isAdmin }, 
        SECRET, 
        { expiresIn: '7d' }
      );
      
      log.info('User logged in successfully', { 
        username, 
        userId: user.id, 
        isAdmin,
        ip: req.ip 
      });
      
      res.json({ 
        token,
        user: {
          username: user.username,
          isAdmin
        }
      });
    } catch (err) {
      if (err.message && err.message.includes('password')) {
        log.error('Password comparison error', { error: err.message, username });
        return res.status(500).json({ error: 'Authentication error occurred.' });
      } else {
        log.error('Database error during login', { error: err.message, username });
        res.status(500).json({ error: 'Database error occurred.' });
      }
    }
  }
);

module.exports = router;
