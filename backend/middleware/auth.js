const jwt = require('jsonwebtoken');

// Use the same JWT_SECRET as in auth.js
const JWT_SECRET = 'your_jwt_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Handle both formats: "Bearer <token>" and plain token
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
}; 