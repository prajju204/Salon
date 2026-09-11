const express = require('express');
const router = express.Router();
const { subscribeToPush } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware'); 
// Assuming protect or similar middleware extracts req.user

// Need a simple auth middleware if multiple roles hit this, or just rely on the token.
// Assuming we have a general auth middleware that sets req.user
const jwt = require('jsonwebtoken');

const generalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized to access this route' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id || decoded._id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

router.post('/subscribe', generalAuth, subscribeToPush);

module.exports = router;
