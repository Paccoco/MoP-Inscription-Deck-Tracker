const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'mop_secret';

// Authentication middleware
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing authorization header.' });
  
  const token = header.split(' ')[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// Middleware to require admin access
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = {
  auth,
  requireAdmin,
  SECRET
};
