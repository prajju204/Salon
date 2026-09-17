const jwt = require('jsonwebtoken');
const path = require('path');
const Admin = require('../models/Admin');
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
const Attendance = require('../models/Attendance');

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

// --- IMAGE UPLOAD ---

exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    // Build the public URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({ success: true, imageUrl, filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ADMIN AUTHENTICATION ---

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

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = generateToken(admin._id, 'admin');
    const refreshToken = generateRefreshToken(admin._id, 'admin');

    await ActivityLog.create({
      userEmail: admin.email,
      role: 'admin',
      action: 'LOGIN',
      details: 'Admin logged in successfully'
    });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        title: 'Master Barber / Owner',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7mN1aebDZAe4y7QU93DVe6rJPItA5r-UscmqyYXlY1fU7pm44i-eZgl5zTt_p7R64ymrz66MsFK4FSX_hqeDAbuU3NotbAfDHK9TjxSDU6uQIv09xui7AT5vFZOh2qX3HQ0lKnd3uQRqppWN7JCmPSq3HwC6JIJdMn6WkrlXSBZikpyVMihxDD54QnrMshdYoFe9Z_5W9Tci0iTXPaLgKsueoUOVWoMzrVGNtOI5tE5WYxl1sBblV4OWryAVsWN40RN5XgawKxw'
      }
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ success: false, message: 'Server unavailable' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'LOGOUT',
        details: 'Admin logged out'
      });
    }
    res.status(200).json({ success: true, message: 'Admin logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        title: 'Master Barber / Owner',
        profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7mN1aebDZAe4y7QU93DVe6rJPItA5r-UscmqyYXlY1fU7pm44i-eZgl5zTt_p7R64ymrz66MsFK4FSX_hqeDAbuU3NotbAfDHK9TjxSDU6uQIv09xui7AT5vFZOh2qX3HQ0lKnd3uQRqppWN7JCmPSq3HwC6JIJdMn6WkrlXSBZikpyVMihxDD54QnrMshdYoFe9Z_5W9Tci0iTXPaLgKsueoUOVWoMzrVGNtOI5tE5WYxl1sBblV4OWryAVsWN40RN5XgawKxw'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'There is no admin with that email' });
    }
    const resetToken = jwt.sign({ id: admin._id, type: 'reset' }, 'resetsecret', { expiresIn: '10m' });
    res.status(200).json({ success: true, message: 'Password reset link generated.', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    const decoded = jwt.verify(resetToken, 'resetsecret');
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    admin.password = password;
    await admin.save();
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
};

// --- CUSTOMER MANAGEMENT ---

exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query = {
        $or: [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const customers = await Customer.find(query);
    res.status(200).json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;
    const exists = await Customer.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const customer = await Customer.create({ fullName, email, mobile, password });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- BARBER MANAGEMENT ---

exports.getBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find({});
    res.status(200).json({ success: true, count: barbers.length, data: barbers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createBarber = async (req, res) => {
  try {
    // Sanitize empty inputs for optional/sparse fields
    if (req.body.email === '' || (req.body.email && req.body.email.trim() === '')) {
      delete req.body.email;
    }
    if (req.body.mobileNumber === '' || (req.body.mobileNumber && req.body.mobileNumber.trim() === '')) {
      delete req.body.mobileNumber;
    }

    const { email, mobileNumber, username } = req.body;
    if (email) {
      const exists = await Barber.findOne({ email: email.toLowerCase().trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered for a staff member' });
    }
    if (mobileNumber) {
      const exists = await Barber.findOne({ mobileNumber: mobileNumber.trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Mobile number already registered for a staff member' });
    }
    if (username) {
      const exists = await Barber.findOne({ username: username.trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Username already registered for a staff member' });
    }

    // Find the highest existing employee ID to prevent collisions after deletions
    const lastBarber = await Barber.findOne({ employeeId: /^EMP-\d+$/ }).sort({ employeeId: -1 });
    let nextNum = 1;
    if (lastBarber && lastBarber.employeeId) {
      const match = lastBarber.employeeId.match(/EMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    req.body.employeeId = `EMP-${nextNum.toString().padStart(3, '0')}`;

    const barber = await Barber.create(req.body);

    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: 'Staff Added',
      details: `Added new staff member: ${barber.name}`
    });

    res.status(201).json({ success: true, data: barber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBarber = async (req, res) => {
  try {
    // Sanitize empty inputs for optional/sparse fields
    if (req.body.email === '' || (req.body.email && req.body.email.trim() === '')) {
      req.body.email = undefined;
    }
    if (req.body.mobileNumber === '' || (req.body.mobileNumber && req.body.mobileNumber.trim() === '')) {
      req.body.mobileNumber = undefined;
    }

    const barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ success: false, message: 'Barber not found' });
    
    // Check if status is being changed to Inactive
    if (req.body.status === 'Inactive' && barber.status !== 'Inactive') {
      const activeAppointments = await Appointment.find({
        barberId: barber._id.toString(),
        status: { $in: ['Confirmed', 'In Progress', 'Rescheduled'] }
      });
      if (activeAppointments.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot deactivate. Staff member has ${activeAppointments.length} active appointments.` 
        });
      }
    }
    
    // Check if email, mobile or username is being changed and if it already exists
    if (req.body.email && req.body.email.toLowerCase().trim() !== (barber.email || '').toLowerCase().trim()) {
      const exists = await Barber.findOne({ email: req.body.email.toLowerCase().trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Email already registered for a staff member' });
    }
    if (req.body.mobileNumber && req.body.mobileNumber.trim() !== (barber.mobileNumber || '').trim()) {
      const exists = await Barber.findOne({ mobileNumber: req.body.mobileNumber.trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Mobile number already registered for a staff member' });
    }
    if (req.body.username && req.body.username.trim() !== (barber.username || '').trim()) {
      const exists = await Barber.findOne({ username: req.body.username.trim() });
      if (exists) return res.status(400).json({ success: false, message: 'Username already registered for a staff member' });
    }

    // Update using findByIdAndUpdate to let mongoose handle the rest
    if (req.body.password) {
       delete req.body.password; // Don't allow password update via general update
    }

    const updatedBarber = await Barber.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    
    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: req.body.status === 'Inactive' ? 'Status Changed' : 'Staff Updated',
      details: `Updated staff member: ${updatedBarber.name}`
    });

    res.status(200).json({ success: true, data: updatedBarber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteBarber = async (req, res) => {
  try {
    const barber = await Barber.findByIdAndDelete(req.params.id);
    if (!barber) return res.status(404).json({ success: false, message: 'Barber not found' });
    
    // Cancel future appointments for this barber
    await Appointment.updateMany(
      { 
        barberId: req.params.id, 
        status: { $in: ['Confirmed', 'In Progress', 'Rescheduled'] } 
      },
      { 
        $set: { status: 'Cancelled' } 
      }
    );

    // Optional: remove image from filesystem if it was stored locally
    if (barber.image && barber.image.includes('/uploads/')) {
      const filename = barber.image.split('/uploads/')[1];
      if (filename) {
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '..', 'uploads', filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
    }

    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: 'Staff Removed',
      details: `Removed staff member: ${barber.name} and cancelled their future appointments.`
    });

    res.status(200).json({ success: true, message: 'Barber deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resetBarberPassword = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    if (!barber) return res.status(404).json({ success: false, message: 'Barber not found' });
    
    barber.password = req.body.password;
    await barber.save();
    
    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: 'Password Reset',
      details: `Reset password for staff member: ${barber.name}`
    });

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- SERVICE MANAGEMENT ---

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

exports.createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- APPOINTMENT MANAGEMENT ---

exports.getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate that the ID is a valid MongoDB ObjectId before querying
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment ID: "${req.params.id}". The booking may not have been saved to the database yet. Please refresh the appointments page and try again.`
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

    const previousStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    // Mark corresponding notifications as actioned/processed
    if (status === 'Confirmed' || status === 'Declined') {
      const NotificationModel = require('../models/Notification');
      await NotificationModel.updateMany(
        { bookingId: req.params.id },
        { $set: { status: status.toLowerCase() } }
      );
    }

    if (status === 'Completed' && previousStatus !== 'Completed') {
      const barber = await Barber.findOne({ name: appointment.barberName });
      if (barber) {
        barber.completedBookings += 1;
        barber.revenue += appointment.price;
        await barber.save();
      }
    }

    if (status === 'Confirmed' && previousStatus !== 'Confirmed') {
      const { createCustomerNotification, createStaffNotification } = require('../utils/notification');
      await createCustomerNotification(req.app, {
        type: 'booking_confirmed',
        title: 'Appointment Approved!',
        message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.time} has been approved by the admin.`,
        bookingId: appointment._id.toString(),
        userId: appointment.customerId || 'unknown-client',
        clientEmail: appointment.clientEmail,
        bookingDetails: appointment
      });

      if (appointment.barberId) {
        await createStaffNotification(req.app, {
          staffId: appointment.barberId,
          type: 'booking_confirmed',
          title: 'Appointment Approved',
          message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.time} has been approved.`,
          bookingId: appointment._id.toString()
        });
      }
    }

    if (status === 'Declined' && previousStatus !== 'Declined') {
      const { reason } = req.body;
      const declineMsg = reason ? ` Reason: ${reason}` : '';
      const { createCustomerNotification, createStaffNotification } = require('../utils/notification');
      await createCustomerNotification(req.app, {
        type: 'booking_declined',
        title: 'Appointment Declined',
        message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.time} has been declined by the admin.${declineMsg}`,
        bookingId: appointment._id.toString(),
        userId: appointment.customerId || 'unknown-client',
        clientEmail: appointment.clientEmail,
        bookingDetails: appointment
      });

      if (appointment.barberId) {
        await createStaffNotification(req.app, {
          staffId: appointment.barberId,
          type: 'booking_declined',
          title: 'Appointment Declined',
          message: `Your appointment for ${appointment.serviceName} on ${appointment.date} at ${appointment.time} has been declined.${declineMsg}`,
          bookingId: appointment._id.toString()
        });
      }

      // Automatically create a Salon Refund record for the customer if price > 0
      try {
        const Refund = require('../models/Refund');
        const Customer = require('../models/Customer');
        const existingRefund = await Refund.findOne({ appointmentId: appointment._id.toString() });
        if (!existingRefund && appointment.price > 0) {
          const customer = await Customer.findOne({
            $or: [
              { _id: appointment.customerId },
              { email: appointment.clientEmail }
            ]
          });

          await Refund.create({
            refundCategory: 'Salon',
            appointmentId: appointment._id.toString(),
            customerId: customer?._id || appointment.customerId,
            customerName: customer?.fullName || customer?.name || appointment.clientName || 'Customer',
            customerEmail: customer?.email || appointment.clientEmail,
            originalAmount: appointment.price || 0,
            refundAmount: appointment.price || 0,
            refundPercentage: 100,
            method: 'Digital Wallet',
            status: 'Pending',
            serviceName: appointment.serviceName,
            barberName: appointment.barberName || 'Salon Stylist',
            appointmentDate: appointment.date
          });
          console.log(`[Refund] Created Salon Refund for declined appointment ${appointment._id}`);
        }
      } catch (refundErr) {
        console.error('Error auto-creating salon refund on decline:', refundErr.message);
      }
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
    appointment.status = 'Cancelled';
    await appointment.save();
    res.status(200).json({ success: true, message: 'Cancelled successfully', data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- PAYMENT MANAGEMENT ---

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refundPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

    payment.status = 'Refunded';
    await payment.save();

    const invoice = await Invoice.findOne({ appointmentId: payment.appointmentId });
    if (invoice) {
      invoice.status = 'Refunded';
      await invoice.save();
    }
    res.status(200).json({ success: true, message: 'Refund completed', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createManualPayment = async (req, res) => {
  try {
    const { clientName, amount, method, serviceName } = req.body;
    if (!clientName || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Please provide clientName, amount, and method' });
    }

    const appointmentId = 'manual-' + Date.now();

    const payment = await Payment.create({
      appointmentId,
      clientName,
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

    await ActivityLog.create({
      userEmail: 'admin@gmail.com',
      role: 'admin',
      action: 'Manual Bill Created',
      details: `Created manual invoice ${invoiceNumber} for ₹${amount} for client ${clientName} (${serviceName || 'Walk-in service'})`
    });

    res.status(201).json({ success: true, payment, invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- REVIEW MANAGEMENT ---

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const { approved } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { approved }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findByIdAndUpdate(req.params.id, { reply }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- NOTIFICATION MANAGEMENT ---

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: 'admin' },
        { recipientRole: 'admin' }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipient: 'admin' },
          { recipientRole: 'admin' }
        ],
        read: false
      },
      { read: true }
    );
    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ANALYTICS REPORTS ---

exports.getDashboardReport = async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({});
    const totalBarbers = await Barber.countDocuments({});
    const totalServices = await Service.countDocuments({});

    const appointments = await Appointment.find({});
    const completedApts = appointments.filter(a => a.status === 'Completed');
    const pendingBookings = appointments.filter(a => a.status === 'Confirmed');
    const activeApts = appointments.filter(a => a.status === 'In Progress');
    const cancelledApts = appointments.filter(a => a.status === 'Cancelled');

    const totalRevenue = completedApts.reduce((sum, a) => sum + a.price, 0);

    const today = new Date();
    const last7Days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = weekdays[d.getDay()];
      
      const dayApts = appointments.filter(a => a.date === dateStr && a.status === 'Completed');
      const dayRev = dayApts.reduce((sum, a) => sum + a.price, 0);
      
      last7Days.push({
        day: dayName,
        revenue: dayRev,
        date: dateStr
      });
    }

    const serviceCounts = {};
    appointments.forEach(apt => {
      serviceCounts[apt.serviceName] = (serviceCounts[apt.serviceName] || 0) + 1;
    });

    const popularServices = Object.keys(serviceCounts).map(name => ({
      name,
      count: serviceCounts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalBarbers,
        totalServices,
        totalRevenue,
        totalAppointments: appointments.length,
        completedCount: completedApts.length,
        pendingCount: pendingBookings.length,
        activeCount: activeApts.length,
        cancelledCount: cancelledApts.length
      },
      weeklyRevenue: last7Days,
      popularServices
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Create the image URL mapping to the static file
    // Note: ensure your app.js is serving '/uploads' statically
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({ 
      success: true, 
      imageUrl,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const Setting = require('../models/Setting');

const DEFAULT_SETTINGS = {
  openingTime: '09:00 AM',
  closingTime: '09:00 PM',
  slotInterval: 30,
  maxBookingsPerSlot: 1,
  holidays: [],
  breakStart: '01:00 PM',
  breakEnd: '02:00 PM'
};

exports.getBookingSettings = async (req, res) => {
  try {
    let settingDoc = await Setting.findOne({ key: 'booking_config' });
    let value = DEFAULT_SETTINGS;
    if (settingDoc) {
      value = JSON.parse(settingDoc.value);
    } else {
      // Create default
      await Setting.create({ key: 'booking_config', value: JSON.stringify(DEFAULT_SETTINGS) });
    }
    res.status(200).json({ success: true, data: value });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBookingSettings = async (req, res) => {
  try {
    let settingDoc = await Setting.findOne({ key: 'booking_config' });
    if (settingDoc) {
      settingDoc.value = JSON.stringify(req.body);
      await settingDoc.save();
    } else {
      settingDoc = await Setting.create({ key: 'booking_config', value: JSON.stringify(req.body) });
    }
    res.status(200).json({ success: true, data: req.body });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({}).populate('barberId', 'name email role image').sort('-createdAt');
    res.status(200).json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid leave status' });
    }

    const leave = await Leave.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).populate('barberId', 'name');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' });
    }

    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: `Leave ${status}`,
      details: `Leave request for ${leave.barberId?.name} has been ${status.toLowerCase()}`
    });

    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, name, status } = req.query;
    
    // Determine target query for attendance
    let attendanceQuery = {};

    if (date) {
      attendanceQuery.date = date; // Format: YYYY-MM-DD
    }

    if (status && status !== 'All') {
      attendanceQuery.status = status;
    }

    // First fetch all active/total staff so we can cross-reference for stats
    const totalStaff = await Barber.find({ status: 'Active' });

    // Fetch the raw attendance records
    let attendanceRecords = await Attendance.find(attendanceQuery)
      .populate('barberId', 'name email role image status')
      .sort('-checkInTime');

    // Post-filter by Staff Name if provided
    if (name) {
      const lowerName = name.toLowerCase();
      attendanceRecords = attendanceRecords.filter(record => 
        record.barberId && record.barberId.name.toLowerCase().includes(lowerName)
      );
    }

    // Stats calculations
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPresentRecords = await Attendance.find({ date: todayStr }).populate('barberId', 'status');
    const presentTodayCount = todayPresentRecords.filter(r => r.barberId && r.barberId.status === 'Active').length;
    
    const totalStaffCount = totalStaff.length;
    const absentTodayCount = Math.max(0, totalStaffCount - presentTodayCount);

    // If status is Absent, we calculate who is absent for that date
    if (status === 'Absent') {
      const targetDate = date || todayStr;
      // Get all active staff who are NOT present on targetDate
      const presentOnDate = await Attendance.find({ date: targetDate });
      const presentIds = presentOnDate.map(r => r.barberId.toString());

      const absentStaff = totalStaff.filter(barber => !presentIds.includes(barber._id.toString()));

      // Filter by name if name query is present
      const filteredAbsentStaff = name 
        ? absentStaff.filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
        : absentStaff;

      // Map absent staff to matching layout format
      attendanceRecords = filteredAbsentStaff.map(staff => ({
        _id: `absent-${staff._id}-${targetDate}`,
        barberId: staff,
        date: targetDate,
        checkInTime: null,
        status: 'Absent'
      }));
    } else if (!status || status === 'All') {
      // If we are showing 'All' but some staff might be absent,
      // and we want to list absent staff explicitly in the list for TODAY/selected date:
      if (date) {
        const presentIds = attendanceRecords.map(r => r.barberId ? r.barberId._id.toString() : '');
        const absentStaff = totalStaff.filter(barber => !presentIds.includes(barber._id.toString()));
        const filteredAbsent = name
          ? absentStaff.filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
          : absentStaff;

        const absentRecords = filteredAbsent.map(staff => ({
          _id: `absent-${staff._id}-${date}`,
          barberId: staff,
          date: date,
          checkInTime: null,
          status: 'Absent'
        }));
        attendanceRecords = [...attendanceRecords, ...absentRecords];
      }
    }

    res.status(200).json({
      success: true,
      stats: {
        totalStaff: totalStaffCount,
        presentToday: presentTodayCount,
        absentToday: absentTodayCount
      },
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.payStaff = async (req, res) => {
  try {
    const { amount } = req.body;
    const barber = await Barber.findById(req.params.id);
    if (!barber) {
      return res.status(404).json({ success: false, message: 'Staff member not found' });
    }

    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payout amount' });
    }

    // Update staff payout fields
    barber.paidAmount = (barber.paidAmount || 0) + amt;
    if (!barber.payouts) {
      barber.payouts = [];
    }
    barber.payouts.push({ amount: amt, date: new Date() });

    await barber.save();

    // Log the payout activity
    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'admin',
      action: 'Staff Payout',
      details: `Paid ₹${amt} to staff member: ${barber.name}`
    });

    res.status(200).json({ success: true, data: barber });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



