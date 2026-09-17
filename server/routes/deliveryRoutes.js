const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');

// Delivery Boy Login
router.post('/login', async (req, res) => {
  console.log('[Backend] Delivery Login request received for:', req.body.username);
  try {
    const { username, password } = req.body;
    const deliveryBoy = await DeliveryBoy.findOne({ username });
    if (!deliveryBoy) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (deliveryBoy.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }
    if (deliveryBoy.status === 'Pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: deliveryBoy._id, role: 'delivery' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      data: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        username: deliveryBoy.username,
        role: 'delivery'
      }
    });

  } catch (error) {
    console.error('Delivery login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delivery Boy Register
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;
    const existing = await DeliveryBoy.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Username or Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const deliveryBoy = await DeliveryBoy.create({
      name,
      username,
      email,
      password: hashedPassword,
      phone,
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Registration submitted successfully. Please wait for admin approval.' });
  } catch (error) {
    console.error('Delivery register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Delivery Boy Profile
router.get('/profile/:id', async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.params.id).select('-password');
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    res.json({ success: true, data: deliveryBoy });
  } catch (error) {
    console.error('Fetch delivery boy profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Delivery Boy Payment Details
router.put('/profile/:id/payment', async (req, res) => {
  try {
    const { upiId, bankAccountNumber } = req.body;
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { upiId, bankAccountNumber },
      { new: true }
    ).select('-password');
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    res.json({ success: true, data: deliveryBoy, message: 'Payment details updated successfully' });
  } catch (error) {
    console.error('Update payment details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Assigned Deliveries
router.get('/my-deliveries/:id', async (req, res) => {
  try {
    const orders = await Order.find({ deliveryBoyId: req.params.id })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Fetch deliveries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Delivery Status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const oldOrder = await Order.findById(req.params.orderId);
    if (!oldOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Give 50 Rs for each completed delivery
    if (status === 'Completed' && oldOrder.status !== 'Completed' && oldOrder.deliveryBoyId) {
      await DeliveryBoy.findByIdAndUpdate(oldOrder.deliveryBoyId, { $inc: { revenue: 50 } });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    ).populate('user');

    if (status === 'Returned to Company') {
      const Refund = require('../models/Refund');
      let existingRefund = await Refund.findOne({ orderId: order._id });
      if (!existingRefund) {
        await Refund.create({
          refundCategory: 'Online',
          orderId: order._id,
          customerId: order.user._id,
          customerName: order.user.fullName || order.user.name || 'Unknown',
          customerEmail: order.user.email,
          originalAmount: order.totalAmount,
          refundAmount: order.totalAmount,
          refundPercentage: 100,
          method: order.paymentMethod,
          status: 'Pending'
        });
      } else if (existingRefund.status !== 'Pending') {
        existingRefund.status = 'Pending';
        existingRefund.transactionRef = null;
        existingRefund.processedBy = null;
        existingRefund.processedAt = null;
        await existingRefund.save();
      }
    }

    try {
      const { createCustomerNotification } = require('../utils/notification');
      await createCustomerNotification(req.app, {
        userId: order.user,
        type: 'Order Update',
        title: 'Order Status Updated',
        message: `Your order ${order.receiptNumber} status updated to: ${status}`,
        bookingId: order._id
      });
    } catch (e) {
      console.log('Error creating customer notification', e);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('appointments-updated'); // triggers fetchAllData in admin to refresh orders
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'No delivery partner found with that email' });
    }
    const jwt = require('jsonwebtoken');
    const resetToken = jwt.sign({ id: deliveryBoy._id, type: 'reset' }, 'resetsecret', { expiresIn: '10m' });
    res.status(200).json({ success: true, message: 'Password reset code generated.', resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, password } = req.body;
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(resetToken, 'resetsecret');
    const deliveryBoy = await DeliveryBoy.findById(decoded.id);
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }
    
    const salt = await bcrypt.genSalt(10);
    deliveryBoy.password = await bcrypt.hash(password, salt);
    await deliveryBoy.save();
    
    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
