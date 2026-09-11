const Cancellation = require('../models/Cancellation');
const Refund = require('../models/Refund');
const CancellationSetting = require('../models/CancellationSetting');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getOrCreateCancellationSetting = async () => {
  let setting = await CancellationSetting.findOne({ key: 'global' });
  if (!setting) {
    setting = await CancellationSetting.create({ key: 'global' });
  }
  return setting;
};

/**
 * Calculate refund amount based on appointment date/time and cancellation policy.
 * Returns { refundPercentage, refundAmount, cancellationType, hoursBeforeAppointment }
 */
const calculateRefund = (appointment, policy) => {
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time || '09:00'}:00`);
  const now = new Date();
  const diffMs = appointmentDateTime - now;
  const hoursBeforeAppointment = diffMs / (1000 * 60 * 60);
  const originalAmount = appointment.finalAmount || appointment.price || 0;

  let cancellationType = 'free';
  let refundPercentage = 100;

  if (hoursBeforeAppointment <= 0) {
    // No-show or past appointment
    cancellationType = 'no-show';
    refundPercentage = 100 - policy.noShowDeductionPercent;
  } else if (hoursBeforeAppointment < policy.freeCancellationHours) {
    // Late cancellation
    cancellationType = 'late';
    refundPercentage = 100 - policy.lateCancellationDeductionPercent;
  } else {
    // Free cancellation window
    cancellationType = 'free';
    refundPercentage = 100;
  }

  refundPercentage = Math.max(0, refundPercentage);
  const refundAmount = Math.round((originalAmount * refundPercentage) / 100);

  return { refundPercentage, refundAmount, cancellationType, hoursBeforeAppointment, originalAmount };
};

const { createAdminNotification, createCustomerNotification, createStaffNotification } = require('../utils/notification');

const sendCancellationNotification = async (req, type, data) => {
  try {
    const notifId = `cancel-notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Admin notification
    await createAdminNotification(req.app, {
      notificationId: notifId + '-admin',
      type,
      title: data.title,
      message: data.message,
      bookingId: data.bookingId || 'N/A',
      userId: data.userId || 'N/A'
    });

    // Customer notification
    if (data.userId) {
      await createCustomerNotification(req.app, {
        notificationId: notifId + '-customer',
        userId: data.userId,
        type,
        title: data.title,
        message: data.message,
        bookingId: data.bookingId || 'N/A'
      });
    }

    // Staff notification
    if (data.staffId) {
      await createStaffNotification(req.app, {
        notificationId: notifId + '-staff',
        staffId: data.staffId,
        type,
        title: data.title,
        message: data.message,
        bookingId: data.bookingId || 'N/A'
      });
    }
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — SUBMIT CANCELLATION REQUEST
// ─────────────────────────────────────────────────────────────────────────────

exports.requestCancellation = async (req, res) => {
  try {
    const { appointmentId, reason, reasonCategory } = req.body;
    const customerId = req.user?._id;

    if (!appointmentId || !reason) {
      return res.status(400).json({ success: false, message: 'Appointment ID and reason are required' });
    }

    // Check for duplicate pending request
    const existingRequest = await Cancellation.findOne({ appointmentId, status: 'Pending' });
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'A cancellation request is already pending for this appointment' });
    }

    // Fetch appointment details
    let appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      // Try string-based lookup as fallback
      appointment = await Appointment.findOne({ _id: appointmentId });
    }

    const policy = await getOrCreateCancellationSetting();

    if (!policy.allowCustomerCancellation) {
      return res.status(403).json({
        success: false,
        message: 'Online cancellation is disabled. Please contact the salon directly.'
      });
    }

    // If appointment not in DB (local-only), still allow cancellation with no-refund
    const appointmentData = appointment || {
      date: req.body.appointmentDate || new Date().toISOString().split('T')[0],
      time: req.body.appointmentTime || '09:00',
      price: req.body.originalAmount || 0,
      finalAmount: req.body.originalAmount || 0,
      serviceName: req.body.serviceName || 'Service',
      barberName: req.body.barberName || 'Staff',
      clientEmail: req.user.email
    };

    const { refundPercentage, refundAmount, cancellationType, hoursBeforeAppointment, originalAmount } =
      calculateRefund(appointmentData, policy);

    const cancellation = await Cancellation.create({
      appointmentId,
      customerId,
      customerName: req.user.fullName || req.user.name || 'Customer',
      customerEmail: req.user.email,
      appointmentSnapshot: {
        serviceName: appointmentData.serviceName,
        barberName: appointmentData.barberName,
        barberId: appointmentData.barberId,
        date: appointmentData.date,
        time: appointmentData.time,
        originalAmount
      },
      reason,
      reasonCategory: reasonCategory || 'Other',
      status: 'Pending',
      refundAmount,
      refundPercentage,
      cancellationType,
      hoursBeforeAppointment
    });

    // Notify admin & staff
    await sendCancellationNotification(req, 'cancellation_request', {
      title: 'New Cancellation Request',
      message: `${cancellation.customerName} has requested cancellation for ${appointmentData.serviceName} on ${appointmentData.date}. Reason: ${reason}`,
      bookingId: appointmentId,
      userId: customerId?.toString(),
      staffId: appointmentData.barberId
    });

    return res.status(201).json({
      success: true,
      data: cancellation,
      policy: {
        refundAmount,
        refundPercentage,
        cancellationType,
        policyText: policy.policyText
      },
      message: 'Cancellation request submitted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerCancellations = async (req, res) => {
  try {
    const customerId = req.user?._id;
    const cancellations = await Cancellation.find({ customerId }).sort({ createdAt: -1 });

    // Attach refund info
    const cancellationIds = cancellations.map(c => c._id);
    const refunds = await Refund.find({ cancellationId: { $in: cancellationIds } });
    const refundMap = {};
    refunds.forEach(r => { refundMap[r.cancellationId.toString()] = r; });

    const enriched = cancellations.map(c => ({
      ...c.toObject(),
      refund: refundMap[c._id.toString()] || null
    }));

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCancellationPolicy = async (req, res) => {
  try {
    const policy = await getOrCreateCancellationSetting();
    return res.json({ success: true, data: policy });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer can preview refund before submitting
exports.previewCancellationRefund = async (req, res) => {
  try {
    const { appointmentId, appointmentDate, appointmentTime, originalAmount } = req.body;
    const policy = await getOrCreateCancellationSetting();

    let appointment = null;
    if (appointmentId) {
      appointment = await Appointment.findById(appointmentId);
    }

    const appointmentData = appointment || {
      date: appointmentDate,
      time: appointmentTime || '09:00',
      price: originalAmount || 0,
      finalAmount: originalAmount || 0
    };

    const result = calculateRefund(appointmentData, policy);

    return res.json({
      success: true,
      data: {
        ...result,
        policy: {
          freeCancellationHours: policy.freeCancellationHours,
          lateCancellationDeductionPercent: policy.lateCancellationDeductionPercent,
          noShowDeductionPercent: policy.noShowDeductionPercent,
          policyText: policy.policyText
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — CANCELLATION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.getAdminCancellations = async (req, res) => {
  try {
    const { status = 'all', search = '', startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status !== 'all') query.status = status;

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { 'appointmentSnapshot.serviceName': { $regex: search, $options: 'i' } },
        { 'appointmentSnapshot.barberName': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await Cancellation.countDocuments(query);
    const cancellations = await Cancellation.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Aggregate stats
    const stats = await Cancellation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRefund: { $sum: '$refundAmount' }
        }
      }
    ]);

    return res.json({
      success: true,
      data: cancellations,
      total,
      page: Number(page),
      limit: Number(limit),
      stats
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks = '', refundMethod = 'Original Payment Method' } = req.body;

    const cancellation = await Cancellation.findById(id);
    if (!cancellation) return res.status(404).json({ success: false, message: 'Cancellation request not found' });
    if (cancellation.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    // Update cancellation
    cancellation.status = 'Approved';
    cancellation.adminRemarks = adminRemarks;
    cancellation.processedBy = req.user?.email;
    cancellation.processedAt = new Date();
    cancellation.slotReleased = true;
    cancellation.staffNotified = true;
    await cancellation.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(cancellation.appointmentId, { status: 'Cancelled', cancellationId: cancellation._id.toString() }).catch(() => {});

    // Create refund record
    const refund = await Refund.create({
      cancellationId: cancellation._id,
      appointmentId: cancellation.appointmentId,
      customerId: cancellation.customerId,
      customerName: cancellation.customerName,
      customerEmail: cancellation.customerEmail,
      originalAmount: cancellation.appointmentSnapshot?.originalAmount || 0,
      refundAmount: cancellation.refundAmount,
      refundPercentage: cancellation.refundPercentage,
      method: refundMethod,
      status: cancellation.refundAmount > 0 ? 'Pending' : 'Refunded',
      serviceName: cancellation.appointmentSnapshot?.serviceName,
      barberName: cancellation.appointmentSnapshot?.barberName,
      appointmentDate: cancellation.appointmentSnapshot?.date,
      processedBy: req.user?.email
    });

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'APPROVE_CANCELLATION',
      details: `Approved cancellation for ${cancellation.customerName} - Refund: ₹${cancellation.refundAmount}`
    });

    await sendCancellationNotification(req, 'cancellation_approved', {
      title: 'Cancellation Approved',
      message: `Your cancellation request has been approved. Refund of ₹${cancellation.refundAmount} will be processed via ${refundMethod}.`,
      bookingId: cancellation.appointmentId,
      userId: cancellation.customerId?.toString(),
      staffId: cancellation.appointmentSnapshot?.barberId
    });

    return res.json({
      success: true,
      data: { cancellation, refund },
      message: 'Cancellation approved and refund initiated'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks = '' } = req.body;

    const cancellation = await Cancellation.findById(id);
    if (!cancellation) return res.status(404).json({ success: false, message: 'Cancellation request not found' });
    if (cancellation.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'This request has already been processed' });
    }

    cancellation.status = 'Rejected';
    cancellation.adminRemarks = adminRemarks;
    cancellation.processedBy = req.user?.email;
    cancellation.processedAt = new Date();
    await cancellation.save();

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'REJECT_CANCELLATION',
      details: `Rejected cancellation for ${cancellation.customerName}. Reason: ${adminRemarks}`
    });

    await sendCancellationNotification(req, 'cancellation_rejected', {
      title: 'Cancellation Request Rejected',
      message: `Your cancellation request was not approved.${adminRemarks ? ' Admin note: ' + adminRemarks : ''}`,
      bookingId: cancellation.appointmentId,
      userId: cancellation.customerId?.toString(),
      staffId: cancellation.appointmentSnapshot?.barberId
    });

    return res.json({ success: true, data: cancellation, message: 'Cancellation rejected' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — REFUND MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.getAdminRefunds = async (req, res) => {
  try {
    const { status = 'all', search = '', startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await Refund.countDocuments(query);
    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const aggr = await Refund.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$refundAmount' } } }
    ]);

    return res.json({ success: true, data: refunds, total, page: Number(page), limit: Number(limit), stats: aggr });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionRef = '', adminNotes = '' } = req.body;

    const refund = await Refund.findById(id);
    if (!refund) return res.status(404).json({ success: false, message: 'Refund record not found' });

    refund.status = 'Refunded';
    refund.transactionRef = transactionRef;
    refund.adminNotes = adminNotes;
    refund.processedBy = req.user?.email;
    refund.processedAt = new Date();
    await refund.save();

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'PROCESS_REFUND',
      details: `Processed refund of ₹${refund.refundAmount} for ${refund.customerName}`
    });

    await sendCancellationNotification(req, 'refund_completed', {
      title: 'Refund Completed',
      message: `Your refund of ₹${refund.refundAmount} has been processed via ${refund.method}.`,
      bookingId: refund.appointmentId,
      userId: refund.customerId?.toString()
    });

    return res.json({ success: true, data: refund, message: `Refund of ₹${refund.refundAmount} processed` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — CANCELLATION SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

exports.getCancellationSettings = async (req, res) => {
  try {
    const setting = await getOrCreateCancellationSetting();
    return res.json({ success: true, data: setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCancellationSettings = async (req, res) => {
  try {
    const setting = await CancellationSetting.findOneAndUpdate(
      { key: 'global' },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'UPDATE_CANCELLATION_SETTINGS',
      details: 'Updated cancellation policy settings'
    });
    return res.json({ success: true, data: setting, message: 'Cancellation settings updated' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
