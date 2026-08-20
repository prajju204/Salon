const DeliveryBoy = require('../models/DeliveryBoy');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

exports.getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: deliveryBoys });
  } catch (error) {
    console.error('Fetch delivery boys error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createDeliveryBoy = async (req, res) => {
  try {
    const { name, username, password, phone } = req.body;
    
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
      phone
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
