const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');

// Create a new product order
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, paymentStatus, location } = req.body;

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
      receiptNumber,
      location
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

            const { createDeliveryNotification, createAdminNotification } = require('../utils/notification');
            await createDeliveryNotification(req.app, {
              deliveryBoyId: activeBoy._id,
              type: 'Order Update',
              title: 'New Order Assigned',
              message: `Order ${receiptNumber} was assigned to you.`,
              bookingId: currentOrder._id
            });
            await createAdminNotification(req.app, {
              type: 'Order Update',
              title: 'Order Auto-Assigned',
              message: `Order ${receiptNumber} was auto-assigned to ${activeBoy.name}`,
              bookingId: currentOrder._id
            });
            const io = req.app.get('io');
            if (io) io.emit('appointments-updated'); // Notify admin order views to refresh
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
    const { createAdminNotification, createCustomerNotification, createDeliveryNotification } = require('../utils/notification');
    
    await createAdminNotification(req.app, {
      type: 'New Product Order',
      title: 'New Product Order Placed',
      message: `${req.user.fullName || req.user.name || 'Customer'} ordered ${items.length} items for ₹${totalAmount}`,
      userId: req.user._id,
      bookingId: order._id
    });
    
    await createCustomerNotification(req.app, {
      userId: req.user._id,
      type: 'Order Placed',
      title: 'Order Confirmed',
      message: `Your order for ₹${totalAmount} has been placed successfully.`,
      bookingId: order._id
    });

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

    if (status === 'Returned to Company') {
      const Refund = require('../models/Refund');
      let existingRefund = await Refund.findOne({ orderId: order._id });
      if (!existingRefund) {
        await order.populate('user');
        await Refund.create({
          refundCategory: 'Online',
          orderId: order._id,
          customerId: order.user?._id || order.user,
          customerName: order.user?.fullName || order.user?.name || 'Customer',
          customerEmail: order.user?.email || 'N/A',
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

    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'Order Updated',
        details: `Updated order ${order.receiptNumber} status to: ${status}`
      });
    }

    const { createCustomerNotification, createDeliveryNotification } = require('../utils/notification');
    await createCustomerNotification(req.app, {
      userId: order.user,
      type: 'Order Update',
      title: 'Order Status Updated',
      message: `Your order ${order.receiptNumber} status updated to: ${status}`,
      bookingId: order._id
    });
    
    if (order.deliveryBoyId) {
      await createDeliveryNotification(req.app, {
        deliveryBoyId: order.deliveryBoyId,
        type: 'Order Update',
        title: 'Order Status Updated',
        message: `Order ${order.receiptNumber} status updated to: ${status}`,
        bookingId: order._id
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (Customer initiated: Cancel, Return/Exchange)
exports.updateOrderStatusCustomer = async (req, res) => {
  try {
    const { status, exchangeItem } = req.body;
    
    if (!['Cancelled', 'Return/Exchange Requested', 'Return Requested', 'Exchange Requested'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update for customer' });
    }

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status === 'Cancelled' && (order.status === 'Completed' || order.status === 'Delivered')) {
       return res.status(400).json({ success: false, message: 'Cannot cancel a completed or delivered order' });
    }

    if (['Return/Exchange Requested', 'Return Requested', 'Exchange Requested'].includes(status) && !['Completed', 'Delivered'].includes(order.status)) {
       return res.status(400).json({ success: false, message: 'Can only request return/exchange for completed or delivered orders' });
    }

    order.status = status;
    if (exchangeItem) {
      order.exchangeItem = exchangeItem;
    }
    await order.save();

    const ActivityLog = require('../models/ActivityLog');
    await ActivityLog.create({
      userEmail: req.user.email,
      role: 'customer',
      action: 'Order Status Updated',
      details: `Customer requested ${status} for order ${order.receiptNumber}`
    });

    const { createAdminNotification, createDeliveryNotification } = require('../utils/notification');
    await createAdminNotification(req.app, {
      type: 'Order Update',
      title: `Order ${status}`,
      message: `Customer ${req.user.fullName || req.user.name} requested ${status} for order ${order.receiptNumber}`,
      userId: req.user._id,
      bookingId: order._id
    });

    if (order.deliveryBoyId) {
      await createDeliveryNotification(req.app, {
        deliveryBoyId: order.deliveryBoyId,
        type: 'Order Update',
        title: `Order ${status}`,
        message: `Order ${order.receiptNumber} was updated to ${status} by the customer`,
        bookingId: order._id
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('appointments-updated');

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
