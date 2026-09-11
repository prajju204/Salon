const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const DeliveryBoy = require('../models/DeliveryBoy');

exports.subscribeToPush = async (req, res) => {
  try {
    const { subscription, role } = req.body;
    
    if (!subscription || !role) {
      return res.status(400).json({ success: false, message: 'Subscription and role are required' });
    }

    const userId = req.user._id || req.user.id;
    let userModel;

    switch (role) {
      case 'customer':
        userModel = Customer;
        break;
      case 'staff':
      case 'barber':
        userModel = Barber;
        break;
      case 'delivery':
        userModel = DeliveryBoy;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if subscription already exists to prevent duplicates
    const exists = user.pushSubscriptions.some(
      sub => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
