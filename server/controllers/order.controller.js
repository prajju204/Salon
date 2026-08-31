const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// Create a new product order
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Server-side payment validation
    const Product = require('../models/Product');
    let calculatedTotal = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.name} not found` });
      }
      calculatedTotal += product.price * item.quantity;
    }

    const calculatedTotalWithTax = calculatedTotal + Math.round(calculatedTotal * 0.18);

    if (Math.abs(calculatedTotalWithTax - totalAmount) > 0.01 && Math.abs(calculatedTotal - totalAmount) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment validation failed: amount mismatch' });
    }

    // Prevent duplicate orders
    const duplicateOrder = await Order.findOne({
      user: req.user._id,
      totalAmount,
      createdAt: { $gte: new Date(Date.now() - 15 * 1000) } // last 15 seconds
    });
    if (duplicateOrder) {
      const itemMatch = duplicateOrder.items.length === items.length && 
        duplicateOrder.items.every(di => 
          items.some(i => i.productId === di.productId && i.quantity === di.quantity)
        );
      if (itemMatch) {
        return res.status(200).json({
          success: true,
          data: duplicateOrder,
          sessionExpired: req.userSessionExpired || false,
          isDuplicate: true
        });
      }
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

    // Auto-assign an active delivery boy in 5 seconds if not manually assigned
    setTimeout(async () => {
      try {
        const currentOrder = await Order.findById(order._id);
        if (currentOrder && !currentOrder.deliveryBoyId) {
          const DeliveryBoy = require('../models/DeliveryBoy');
          const activeBoy = await DeliveryBoy.findOne({ status: 'Active' });
          if (activeBoy) {
            currentOrder.deliveryBoyId = activeBoy._id;
            currentOrder.status = 'Shipped'; // Out for Delivery
            await currentOrder.save();
            console.log(`[AutoAssign] Assigned order ${receiptNumber} to delivery boy: ${activeBoy.name}`);

            const io = req.app.get('io');
            if (io) {
              io.emit('new-notification', {
                recipient: 'admin',
                type: 'Order Update',
                title: 'Order Auto-Assigned',
                message: `Order ${receiptNumber} was auto-assigned to ${activeBoy.name}`,
                createdAt: new Date().toISOString()
              });
              io.emit('appointments-updated'); // Notify admin order views to refresh
            }
          }
        }
      } catch (err) {
        console.error('Error during auto-assignment:', err);
      }
    }, 5000);

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
        message: `${req.user.fullName || req.user.name || 'Customer'} ordered ${items.length} items for ₹${totalAmount}`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      data: order,
      sessionExpired: req.userSessionExpired || false
    });
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

