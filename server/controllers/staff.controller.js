const Barber = require('../models/Barber');
const Leave = require('../models/Leave');
const jwt = require('jsonwebtoken');

// Staff Login
exports.loginStaff = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const staff = await Barber.findOne({ username }).select('+password');

    if (!staff) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await staff.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (staff.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Your account is inactive' });
    }

    const token = jwt.sign({ id: staff._id, role: 'staff' }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '30d'
    });

    res.status(200).json({
      success: true,
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        image: staff.image
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Request Leave
exports.requestLeave = async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    // In a real app we'd get barberId from auth token, but for now we might get it from body
    // Assuming middleware puts staff id in req.user
    const barberId = req.user.id;

    const leave = await Leave.create({
      barberId,
      startDate,
      endDate,
      reason,
      status: 'Pending'
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Leaves
exports.getMyLeaves = async (req, res) => {
  try {
    const barberId = req.user.id;
    const leaves = await Leave.find({ barberId }).sort('-createdAt');
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Salary Details
exports.getMySalary = async (req, res) => {
  try {
    const barberId = req.user.id;
    const staff = await Barber.findById(barberId);
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }
    res.status(200).json({ success: true, data: { salary: staff.salary, revenue: staff.revenue } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff Attendance controllers
const Attendance = require('../models/Attendance');

exports.markPresent = async (req, res) => {
  try {
    const barberId = req.user.id;
    // We format today's date in local server or YYYY-MM-DD representation
    const todayStr = new Date().toISOString().split('T')[0];

    // Check if attendance already marked
    const existing = await Attendance.findOne({ barberId, date: todayStr });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      barberId,
      date: todayStr,
      status: 'Present',
      checkInTime: new Date()
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const barberId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ barberId, date: todayStr });
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

