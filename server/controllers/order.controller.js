const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// Create a new product order
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentStatus || 'Paid',
      receiptNumber
    });

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'customer',
        action: 'Product Purchased',
        details: `Placed order ${receiptNumber} for ₹${totalAmount} via ${paymentMethod}`
      });
    }

    // Emit Socket.io real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new-notification', {
        recipient: 'admin',
        type: 'New Product Order',
        title: 'New Product Order Placed',
        message: `${req.user.name} ordered ${items.length} items for ₹${totalAmount}`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get order history for authenticated user
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'fullName email mobile').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'Order Updated',
        details: `Updated order ${order.receiptNumber} status to: ${status}`
      });
    }

    // Emit Socket.io real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('new-notification', {
        recipient: order.user.toString(),
        type: 'Order Update',
        title: 'Order Status Updated',
        message: `Your order ${order.receiptNumber} status updated to: ${status}`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

