const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db, query } = require('../utils/database-adapter');
const { SECRET } = require('../middleware/auth');

const router = express.Router();

// User registration - sets approved=0 by default
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password.' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (user) {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to hash password.' });
      }
      
      db.run('INSERT INTO users (username, password, approved) VALUES (?, ?, 0)', [username, hash], function (err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to register user.' });
        }
        res.json({ success: true });
      });
    });
  });
});

// User login - only allows approved users
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (!user || !user.approved) {
      return res.status(401).json({ error: 'User not found or not approved.' });
    }
    
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: 'Invalid password.' });
      }
      
      const token = jwt.sign(
        { username: user.username, is_admin: !!user.is_admin }, 
        SECRET, 
        { expiresIn: '7d' }
      );
      res.json({ token });
    });
  });
});

module.exports = router;
