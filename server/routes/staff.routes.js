const express = require('express');
const router = express.Router();
const { loginStaff, requestLeave, getMyLeaves, getMySalary, markPresent, getTodayAttendance } = require('../controllers/staff.controller');
const jwt = require('jsonwebtoken');
const Barber = require('../models/Barber');

// Basic auth middleware for staff
const protectStaff = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
    req.user = await Barber.findById(decoded.id);
    if (!req.user) {
      // Offline fallback check
      if (decoded.id === 'mock-barber-1') {
        req.user = { id: 'mock-barber-1', name: 'Prajwal' };
      } else {
        return res.status(401).json({ success: false, message: 'Staff not found' });
      }
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

router.post('/login', loginStaff);
router.post('/leave', protectStaff, requestLeave);
router.get('/leave', protectStaff, getMyLeaves);
router.get('/salary', protectStaff, getMySalary);

// Attendance routes
router.post('/attendance', protectStaff, markPresent);
router.get('/attendance/today', protectStaff, getTodayAttendance);

module.exports = router;

