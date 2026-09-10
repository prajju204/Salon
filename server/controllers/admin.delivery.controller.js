const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find().select('-password').sort({ createdAt: -1 });
    
    // Enrich each delivery boy with order statistics
    const enrichedDeliveryBoys = await Promise.all(deliveryBoys.map(async (boy) => {
      // Find all delivered/completed orders assigned to this delivery boy
      const completedOrders = await Order.find({
        deliveryBoyId: boy._id,
        status: { $in: ['Delivered', 'Completed'] }
      });

      const completedDeliveries = completedOrders.length;
      
      // Calculate total COD collections
      const codCollections = completedOrders
        .filter(o => o.paymentMethod === 'COD')
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      const deliveryEarnings = completedDeliveries * 50; // Fixed ₹50 per delivery
      const baseIncentive = boy.salary || 0; // Treat salary as base pay/incentive

      // Aggregated revenue replaces the static revenue field
      const totalCalculatedRevenue = baseIncentive + deliveryEarnings;

      return {
        ...boy.toObject(),
        completedDeliveries,
        codCollections,
        deliveryEarnings,
        revenue: totalCalculatedRevenue // Override revenue for the payments page
      };
    }));

    res.json({ success: true, data: enrichedDeliveryBoys });
  } catch (error) {
    console.error('Fetch delivery boys error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createDeliveryBoy = async (req, res) => {
  try {
    const { name, username, password, phone, salary } = req.body;
    
    let deliveryBoy = await DeliveryBoy.findOne({ username });
    if (deliveryBoy) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    deliveryBoy = await DeliveryBoy.create({
      name,
      username,
      password: hashedPassword,
      phone,
      salary: salary || 0
    });

    // Write credentials to a text file for manual verification
    const credentialsPath = path.join(process.cwd(), 'delivery_boy_credentials.txt');
    const content = `Delivery Boy Created\nName: ${name}\nUsername: ${username}\nPassword: ${password}\n\n`;
    fs.appendFileSync(credentialsPath, content);

    // Remove password from response
    deliveryBoy.password = undefined;
    res.status(201).json({ success: true, data: deliveryBoy });
  } catch (error) {
    console.error('Create delivery boy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDeliveryBoyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    res.json({ success: true, data: deliveryBoy });
  } catch (error) {
    console.error('Update delivery boy status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.assignOrderToDeliveryBoy = async (req, res) => {
  try {
    const { deliveryBoyId } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryBoyId, status: 'Shipped' },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Assign order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateDeliveryBoy = async (req, res) => {
  try {
    const { name, username, password, phone, salary } = req.body;
    
    // Check if username is already taken by another delivery boy
    if (username) {
      const existing = await DeliveryBoy.findOne({ username, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
      }
    }

    const updateData = { name, username, phone };
    if (salary !== undefined) {
      updateData.salary = salary;
    }
    if (req.body.revenue !== undefined) {
      updateData.revenue = req.body.revenue;
    }
    if (req.body.upiId !== undefined) {
      updateData.upiId = req.body.upiId;
    }
    if (req.body.bankAccountNumber !== undefined) {
      updateData.bankAccountNumber = req.body.bankAccountNumber;
    }

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const deliveryBoy = await DeliveryBoy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    res.json({ success: true, data: deliveryBoy });
  } catch (error) {
    console.error('Update delivery boy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteDeliveryBoy = async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findByIdAndDelete(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }
    res.json({ success: true, message: 'Delivery boy deleted successfully' });
  } catch (error) {
    console.error('Delete delivery boy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.payDeliveryBoy = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid payment amount' });
    }

    const deliveryBoy = await DeliveryBoy.findById(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: 'Delivery boy not found' });
    }

    const completedOrders = await Order.find({
      deliveryBoyId: deliveryBoy._id,
      status: { $in: ['Delivered', 'Completed'] }
    });
    const completedDeliveries = completedOrders.length;
    const deliveryEarnings = completedDeliveries * 50;
    const baseIncentive = deliveryBoy.salary || 0;
    const totalCalculatedRevenue = baseIncentive + deliveryEarnings;

    const pending = Math.max(0, totalCalculatedRevenue - (deliveryBoy.paidAmount || 0));
    if (amount > pending) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds pending balance' });
    }

    deliveryBoy.paidAmount = (deliveryBoy.paidAmount || 0) + amount;
    deliveryBoy.payouts = deliveryBoy.payouts || [];
    deliveryBoy.payouts.push({
      amount: amount,
      date: new Date(),
      note: 'Admin Payout'
    });

    await deliveryBoy.save();
    
    res.json({ success: true, data: deliveryBoy, message: 'Payout processed successfully' });
  } catch (error) {
    console.error('Pay delivery boy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
