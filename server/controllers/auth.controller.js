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
const Leave = require('../models/Leave');
const { sendVerificationEmail } = require('../utils/email');

// Generate Token helper
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'luxegroomsupersecretkey12345',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.REFRESH_SECRET || 'luxegroomrefreshsecretkey12345',
    { expiresIn: '30d' }
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

    const verificationToken = jwt.sign({ id: 'temp' }, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345', { expiresIn: '24h' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const customer = await Customer.create({
      fullName: name,
      email,
      mobile,
      password,
      email_verified: false,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      verificationOtp: otp,
      verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000)
    });

    // Sign the token with the actual customer ID
    const actualToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345', { expiresIn: '24h' });
    customer.verificationToken = actualToken;
    await customer.save();

    const token = generateToken(customer._id, 'customer');
    const refreshToken = generateRefreshToken(customer._id, 'customer');

    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'REGISTER',
      details: 'Customer registered successfully'
    });

    let emailSent = false;
    let emailError = null;
    console.log(`[AUTH-AUDIT] Verification email requested for new user: ${customer.email}`);
    try {
      await sendVerificationEmail(customer.email, actualToken, otp);
      emailSent = true;
      console.log(`[AUTH-AUDIT] Verification email sent successfully to: ${customer.email}`);
      await ActivityLog.create({
        userEmail: customer.email,
        role: 'customer',
        action: 'EMAIL_VERIFICATION_SENT',
        details: 'Verification email sent on registration'
      });
    } catch (err) {
      emailError = 'Email delivery failure';
      console.error(`[AUTH-AUDIT] [ERROR] Verification email failed for: ${customer.email}. Error: ${err.message}`);
      await ActivityLog.create({
        userEmail: customer.email,
        role: 'customer',
        action: 'EMAIL_VERIFICATION_FAILED',
        details: `Delivery failure on registration: ${err.message}`
      });
    }

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      emailSent,
      emailError,
      devVerificationLink: process.env.NODE_ENV !== 'production' ? `http://localhost:5173/verify-email?token=${actualToken}` : null,
      devVerificationOtp: process.env.NODE_ENV !== 'production' ? otp : null,
      message: 'Verification email sent. Please check your inbox.',
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        email_verified: false,
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
    const refreshToken = generateRefreshToken(customer._id, 'customer');

    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'LOGIN',
      details: 'Customer logged in successfully'
    });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        email_verified: customer.email_verified,
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
        email_verified: customer.email_verified,
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
    const { serviceName, price, date, time, barberId, barberName, finalAmount, paymentMethod, paymentStatus } = req.body;

    // Check if the barber is on approved leave on this date
    if (barberId) {
      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);

      const leaveConflict = await Leave.findOne({
        barberId,
        status: 'Approved',
        startDate: { $lte: bookingDate },
        endDate: { $gte: bookingDate }
      });

      if (leaveConflict) {
        return res.status(400).json({ success: false, message: `${barberName || 'Selected stylist'} is on leave on this date.` });
      }
    }
    
    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      date,
      time,
      status: { $in: ['Pending', 'Confirmed', 'In Progress', 'Rescheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ success: false, message: 'booking full' });
    }

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
      status: 'Pending'
    });

    // Create payment & invoice automatically
    const paidAmount = finalAmount !== undefined ? finalAmount : price;
    await Payment.create({
      appointmentId: appointment._id.toString(),
      clientName: req.user.fullName,
      amount: paidAmount,
      method: paymentMethod || 'Razorpay',
      status: paymentStatus || 'Paid'
    });

    const invoiceNumber = 'INV-' + Date.now() + Math.floor(Math.random() * 1000);
    await Invoice.create({
      invoiceNumber,
      appointmentId: appointment._id.toString(),
      amount: paidAmount,
      status: paymentStatus || 'Paid'
    });

    const { createAdminNotification } = require('../utils/notification');
    await createAdminNotification(req.app, {
      type: 'booking_request',
      title: 'New Booking Request',
      message: `${req.user.fullName} booked ${serviceName} with ${barberName} on ${date} at ${time}`,
      bookingId: appointment._id.toString(),
      userId: req.user.id || req.user._id,
      bookingDetails: appointment,
      bookingPayload: {
        bookingId: appointment._id.toString(),
        userId: req.user.id || req.user._id,
        userName: req.user.fullName,
        userAvatar: req.user.profilePic || '',
        serviceName,
        stylistName: barberName,
        date,
        time,
        price,
        notes: appointment.notes || ''
      }
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'slot_taken' });
    }
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
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'slot_taken' });
    }
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

    // Server-side payment validation
    const Appointment = require('../models/Appointment');
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (Math.abs(appointment.price - amount) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment validation failed: amount mismatch' });
    }

    // Prevent duplicate payments
    const duplicatePayment = await Payment.findOne({
      appointmentId,
      amount,
      createdAt: { $gte: new Date(Date.now() - 15 * 1000) } // last 15 seconds
    });
    if (duplicatePayment) {
      const invoice = await Invoice.findOne({ appointmentId });
      return res.status(200).json({
        success: true,
        payment: duplicatePayment,
        invoice,
        sessionExpired: req.userSessionExpired || false,
        isDuplicate: true
      });
    }

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

    res.status(201).json({
      success: true,
      payment,
      invoice,
      sessionExpired: req.userSessionExpired || false
    });
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
    const notifications = await Notification.find({ recipientRole: 'customer', userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getApprovedLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Approved' }).select('barberId startDate endDate');
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET || 'luxegroomrefreshsecretkey12345'
    );

    let user;
    if (decoded.role === 'customer') {
      user = await Customer.findById(decoded.id);
    } else if (decoded.role === 'admin') {
      const Admin = require('../models/Admin');
      user = await Admin.findById(decoded.id);
    } else if (decoded.role === 'staff') {
      const Barber = require('../models/Barber');
      user = await Barber.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const newToken = generateToken(user._id, decoded.role);
    const newRefreshToken = generateRefreshToken(user._id, decoded.role);

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(401).json({ success: false, message: 'Session expired: invalid refresh token' });
  }
};

// --- EMAIL VERIFICATION & PROFILE UPDATE ---

exports.verifyEmail = async (req, res) => {
  try {
    const { token, otp, email } = req.body;
    if (!token && !otp) {
      console.warn('[AUTH-AUDIT] Verification failed: missing token and OTP');
      return res.status(400).json({ success: false, message: 'Verification token or OTP is required' });
    }

    let customer;

    if (token) {
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345');
      } catch (err) {
        console.error(`[AUTH-AUDIT] Verification failed: invalid/expired token. Error: ${err.message}`);
        await ActivityLog.create({
          userEmail: 'unknown',
          role: 'customer',
          action: 'EMAIL_VERIFICATION_FAILED',
          details: `Token verification failed: ${err.message}`
        });
        return res.status(400).json({ success: false, message: 'Verification link has expired. Resend verification.' });
      }

      customer = await Customer.findOne({
        _id: decoded.id,
        verificationToken: token
      });

      if (!customer) {
        const alreadyVerifiedUser = await Customer.findById(decoded.id);
        if (alreadyVerifiedUser && alreadyVerifiedUser.email_verified) {
          console.log(`[AUTH-AUDIT] Verification bypassed: User ${decoded.id} already verified`);
          return res.status(400).json({ success: false, message: 'Email already verified.' });
        }
        console.warn(`[AUTH-AUDIT] Verification failed: token mismatch for user ${decoded.id}`);
        return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
      }

      if (customer.verificationTokenExpiry && customer.verificationTokenExpiry < new Date()) {
        console.warn(`[AUTH-AUDIT] Verification failed: token expired for user ${customer.email}`);
        await ActivityLog.create({
          userEmail: customer.email,
          role: 'customer',
          action: 'EMAIL_VERIFICATION_FAILED',
          details: 'Verification token expired'
        });
        return res.status(400).json({ success: false, message: 'Verification link has expired. Resend verification.' });
      }
    } else if (otp) {
      const emailToUse = email || (req.user && req.user.email);
      if (!emailToUse) {
        console.warn('[AUTH-AUDIT] Verification failed: OTP verification requested without email');
        return res.status(400).json({ success: false, message: 'Email address is required for OTP verification.' });
      }

      customer = await Customer.findOne({
        email: emailToUse.toLowerCase(),
        verificationOtp: otp
      });

      if (!customer) {
        const alreadyVerifiedUser = await Customer.findOne({ email: emailToUse.toLowerCase() });
        if (alreadyVerifiedUser && alreadyVerifiedUser.email_verified) {
          console.log(`[AUTH-AUDIT] Verification bypassed: Email ${emailToUse} already verified`);
          return res.status(400).json({ success: false, message: 'Email already verified.' });
        }
        console.warn(`[AUTH-AUDIT] Verification failed: invalid OTP for email ${emailToUse}`);
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }

      if (customer.verificationOtpExpiry && customer.verificationOtpExpiry < new Date()) {
        console.warn(`[AUTH-AUDIT] Verification failed: OTP expired for user ${customer.email}`);
        await ActivityLog.create({
          userEmail: customer.email,
          role: 'customer',
          action: 'EMAIL_VERIFICATION_FAILED',
          details: 'Verification OTP expired'
        });
        return res.status(400).json({ success: false, message: 'Verification OTP has expired. Resend verification.' });
      }
    }

    customer.email_verified = true;
    customer.verifiedAt = new Date();
    customer.verificationToken = null;
    customer.verificationTokenExpiry = null;
    customer.verificationOtp = null;
    customer.verificationOtpExpiry = null;
    await customer.save();

    console.log(`[AUTH-AUDIT] Verification successful for: ${customer.email}`);
    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'EMAIL_VERIFICATION_SUCCESS',
      details: 'Email verified successfully'
    });

    const authToken = generateToken(customer._id, 'customer');
    const refreshToken = generateRefreshToken(customer._id, 'customer');

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      token: authToken,
      refreshToken,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        email_verified: true,
        title: 'Regular Client',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'
      }
    });
  } catch (error) {
    console.error(`[AUTH-AUDIT] [ERROR] verifyEmail failed: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const email = req.body.email || (req.user && req.user.email);
    if (!email) {
      console.warn('[AUTH-AUDIT] Resend failed: missing email address');
      return res.status(400).json({ success: false, message: 'Please provide email address' });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.warn(`[AUTH-AUDIT] Resend failed: invalid email format: ${email}`);
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const customer = await Customer.findOne({ email });
    if (!customer) {
      console.warn(`[AUTH-AUDIT] Resend failed: user not found: ${email}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (customer.email_verified) {
      console.log(`[AUTH-AUDIT] Resend bypassed: Email already verified: ${email}`);
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    const verificationToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345', { expiresIn: '24h' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`[AUTH-AUDIT] Verification email requested (resend) for: ${email}`);

    try {
      await sendVerificationEmail(customer.email, verificationToken, otp);

      customer.verificationToken = verificationToken;
      customer.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      customer.verificationOtp = otp;
      customer.verificationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      customer.verificationRequestTimestamps = [...(customer.verificationRequestTimestamps || []), new Date()];
      await customer.save();

      console.log(`[AUTH-AUDIT] Verification email sent successfully to: ${customer.email}`);
      await ActivityLog.create({
        userEmail: customer.email,
        role: 'customer',
        action: 'EMAIL_VERIFICATION_RESEND',
        details: 'Verification email resent successfully'
      });
      res.status(200).json({ 
        success: true, 
        message: 'Verification email sent. Please check your inbox.',
        devVerificationLink: process.env.NODE_ENV !== 'production' ? `http://localhost:5173/verify-email?token=${verificationToken}` : null,
        devVerificationOtp: process.env.NODE_ENV !== 'production' ? otp : null
      });
    } catch (err) {
      console.error(`[AUTH-AUDIT] [ERROR] Verification email failed to send to ${customer.email}: ${err.message}`);
      await ActivityLog.create({
        userEmail: customer.email,
        role: 'customer',
        action: 'EMAIL_VERIFICATION_FAILED',
        details: `Resend delivery failure: ${err.message}`
      });
      res.status(500).json({ success: false, message: 'Email delivery failure. Please try again later.' });
    }
  } catch (error) {
    console.error(`[AUTH-AUDIT] [ERROR] resendVerification failed: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, mobile } = req.body;
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    let emailChanged = false;
    if (email && email.toLowerCase() !== customer.email.toLowerCase()) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }

      const emailExists = await Customer.findOne({ email, _id: { $ne: customer._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use.' });
      }
      customer.email = email;
      customer.email_verified = false;
      emailChanged = true;
    }

    if (name) customer.fullName = name;
    if (mobile) customer.mobile = mobile;

    let verificationToken = null;
    let otp = null;
    if (emailChanged) {
      verificationToken = jwt.sign({ id: customer._id }, process.env.JWT_SECRET || 'luxegroomsupersecretkey12345', { expiresIn: '24h' });
      otp = Math.floor(100000 + Math.random() * 900000).toString();

      customer.verificationToken = verificationToken;
      customer.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      customer.verificationOtp = otp;
      customer.verificationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    }

    await customer.save();

    await ActivityLog.create({
      userEmail: customer.email,
      role: 'customer',
      action: 'UPDATE_PROFILE',
      details: `Profile updated successfully.${emailChanged ? ' Email changed, verification required.' : ''}`
    });

    let emailSent = false;
    let emailError = null;
    if (emailChanged) {
      console.log(`[AUTH-AUDIT] Verification email requested (profile update) for: ${customer.email}`);
      try {
        await sendVerificationEmail(customer.email, verificationToken, otp);
        emailSent = true;
        console.log(`[AUTH-AUDIT] Verification email sent successfully to: ${customer.email}`);
        await ActivityLog.create({
          userEmail: customer.email,
          role: 'customer',
          action: 'EMAIL_VERIFICATION_SENT',
          details: 'Verification email sent on profile email change'
        });
      } catch (err) {
        emailError = 'Email delivery failure';
        console.error(`[AUTH-AUDIT] [ERROR] Verification email failed to send to ${customer.email}: ${err.message}`);
        await ActivityLog.create({
          userEmail: customer.email,
          role: 'customer',
          action: 'EMAIL_VERIFICATION_FAILED',
          details: `Delivery failure on profile email change: ${err.message}`
        });
      }
    }

    const token = generateToken(customer._id, 'customer');
    const refreshToken = generateRefreshToken(customer._id, 'customer');

    res.status(200).json({
      success: true,
      message: emailChanged 
        ? 'Profile updated. Verification email sent. Please check your inbox.' 
        : 'Profile updated successfully.',
      emailSent,
      emailError,
      token,
      refreshToken,
      devVerificationLink: process.env.NODE_ENV !== 'production' && emailChanged ? `http://localhost:5173/verify-email?token=${verificationToken}` : null,
      devVerificationOtp: process.env.NODE_ENV !== 'production' && emailChanged ? otp : null,
      user: {
        id: customer._id,
        name: customer.fullName,
        email: customer.email,
        mobile: customer.mobile,
        role: 'customer',
        email_verified: customer.email_verified,
        title: 'Regular Client',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

