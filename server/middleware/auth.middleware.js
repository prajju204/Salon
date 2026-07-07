const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');

const verifyCustomer = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this portal' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345');
    
    if (decoded.role !== 'customer') {
      return res.status(403).json({ success: false, message: 'Access Denied: Only customers can access this resource' });
    }
    
    req.user = await Customer.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Customer account not found' });
    }

    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Session expired or token invalid' });
  }
};

module.exports = { verifyCustomer };
