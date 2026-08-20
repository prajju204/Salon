const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');

// Delivery Boy Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const deliveryBoy = await DeliveryBoy.findOne({ username });
    if (!deliveryBoy) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (deliveryBoy.status === 'Inactive') {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // In a real app, you'd generate a JWT token here.
    // Since we're keeping it simple and there's no auth middleware specified for delivery boys,
    // we'll just return success and the delivery boy details.
    res.json({
      success: true,
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
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
