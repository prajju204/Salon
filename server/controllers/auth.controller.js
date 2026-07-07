const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// Generate Token helper
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'luxegroomsupersecretkey12345',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// --- CUSTOMER AUTHENTICATION ---

exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    const customerExists = await Customer.findOne({ email });
    if (customerExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const customer = await Customer.create({
      fullName: name,
      email,
      mobile,
      password
    });

    const token = generateToken(customer._id, 'customer');

    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'REGISTER',
      details: 'Customer registered successfully'
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        title: 'Regular Client',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    if (global.dbConnected === false) {
      return res.status(503).json({ success: false, message: 'Database connection failed' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isMatch = await customer.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = generateToken(customer._id, 'customer');

    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'LOGIN',
      details: 'Customer logged in successfully'
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        title: 'Regular Client',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server unavailable' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'customer',
        action: 'LOGOUT',
        details: 'Customer logged out'
      });
    }
    res.status(200).json({ success: true, message: 'Customer logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        title: 'Regular Client',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'No client with that email' });
    }
    const resetToken = jwt.sign({ id: customer._id, type: 'reset' }, 'resetsecret', { expiresIn: '10m' });
    res.status(200).json({ success: true, message: 'Password reset code generated.', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    const decoded = jwt.verify(resetToken, 'resetsecret');
    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    customer.password = password;
    await customer.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

// --- CLIENT PORTAL API GETTERS & ACTIONS ---

exports.getServices = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') {
      filter.category = new RegExp(req.query.category, 'i');
    }
    const services = await Service.find(filter);
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getServiceCategories = async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    res.status(200).json({ success: true, data: ['All', ...categories] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find({ status: 'Active' });
    res.status(200).json({ success: true, count: barbers.length, data: barbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ clientEmail: req.user.email }).sort({ date: -1, time: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { serviceName, price, date, time, barberId, barberName } = req.body;
    const appointment = await Appointment.create({
      clientName: req.user.fullName,
      clientEmail: req.user.email,
      clientMobile: req.user.mobile,
      serviceName,
      price,
      date,
      time,
      barberId,
      barberName,
      status: 'Confirmed'
    });

    const { createAdminNotification } = require('../utils/notification');
    await createAdminNotification(req.app, {
      type: 'New Booking',
      title: 'New Booking Request',
      message: `${req.user.fullName} booked ${serviceName} with ${barberName} on ${date} at ${time}`,
      bookingId: appointment._id.toString(),
      userId: req.user.id || req.user._id,
      bookingDetails: appointment
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, clientEmail: req.user.email });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    appointment.status = 'Cancelled';
    await appointment.save();

    const { createAdminNotification } = require('../utils/notification');
    await createAdminNotification(req.app, {
      type: 'Cancellation',
      title: 'Booking Cancelled',
      message: `${req.user.fullName} cancelled appointment ${appointment._id} for ${appointment.serviceName} on ${appointment.date} at ${appointment.time}`,
      bookingId: appointment._id.toString(),
      userId: req.user.id || req.user._id
    });

    res.status(200).json({ success: true, message: 'Appointment cancelled', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, time, notes } = req.body;
    const appointment = await Appointment.findOne({ _id: req.params.id, clientEmail: req.user.email });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    appointment.date = date;
    appointment.time = time;
    if (notes !== undefined) {
      appointment.notes = notes;
    }
    appointment.status = 'Rescheduled';
    await appointment.save();

    const { createAdminNotification } = require('../utils/notification');
    await createAdminNotification(req.app, {
      type: 'Reschedule',
      title: 'Booking Rescheduled',
      message: `${req.user.fullName} rescheduled appointment ${appointment._id} to ${date} at ${time}`,
      bookingId: appointment._id.toString(),
      userId: req.user.id || req.user._id
    });

    res.status(200).json({ success: true, message: 'Appointment rescheduled', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ clientName: req.user.fullName }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { appointmentId, amount, method } = req.body;
    const payment = await Payment.create({
      appointmentId,
      clientName: req.user.fullName,
      amount,
      method,
      status: 'Paid'
    });

    const invoiceNumber = 'INV-' + Date.now() + Math.floor(Math.random() * 1000);
    const invoice = await Invoice.create({
      invoiceNumber,
      appointmentId,
      amount,
      status: 'Paid'
    });

    res.status(201).json({ success: true, payment, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { barberName, rating, text } = req.body;
    const review = await Review.create({
      clientName: req.user.fullName,
      barberName,
      rating,
      text,
      date: new Date().toISOString().split('T')[0],
      approved: true
    });

    const barber = await Barber.findOne({ name: barberName });
    if (barber) {
      const barberReviews = await Review.find({ barberName });
      const totalRating = barberReviews.reduce((sum, r) => sum + r.rating, 0);
      barber.rating = parseFloat((totalRating / barberReviews.length).toFixed(1));
      await barber.save();
    }

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientRole: 'customer' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
