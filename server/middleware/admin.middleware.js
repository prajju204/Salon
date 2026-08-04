const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const verifyAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied: Only administrators can access this resource' });
    }
    
    req.user = await Admin.findById(decoded.id);
    if (!req.user) {
      // Fallback: If DB was reset/offline and token has mock or stale ID, use the default admin
      req.user = await Admin.findOne({ role: 'admin' });
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Admin account not found' });
      }
    }

    req.userRole = decoded.role;
    next();
  } catch (err) {
    console.error("Admin Middleware Error:", err);
    return res.status(401).json({ success: false, message: `Session expired: ${err.message}` });
  }
};

module.exports = { verifyAdmin };
