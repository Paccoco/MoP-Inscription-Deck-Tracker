const express = require('express');
const { auth } = require('../middleware/auth');
const { db } = require('../utils/database');

const router = express.Router();

// API: Get user profile
router.get('/profile', auth, (req, res) => {
  db.get('SELECT username, is_admin, approved FROM users WHERE username = ?', [req.user.username], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  });
});

module.exports = router;
