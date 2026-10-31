const mongoose = require('mongoose');

const FeeSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  platformFee: {
    type: Number,
    default: 5,
    min: 0,
    comment: 'Fixed platform fee in INR added to every order'
  },
  deliveryFeeWithin: {
    type: Number,
    default: 30,
    min: 0,
    comment: 'Delivery fee in INR for delivery within the threshold km'
  },
  deliveryFeeOutside: {
    type: Number,
    default: 60,
    min: 0,
    comment: 'Delivery fee in INR for delivery beyond the threshold km'
  },
  deliveryDistanceThresholdKm: {
    type: Number,
    default: 30,
    min: 1,
    comment: 'Distance in km to differentiate between within/outside delivery fee tiers'
  },
  isFreeDeliveryEnabled: {
    type: Boolean,
    default: false,
    comment: 'If true, delivery is free for all orders (ignores fee values)'
  },
  freeDeliveryMinOrderAmount: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Minimum order subtotal (before fees) to qualify for free delivery (0 = disabled)'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FeeSettings', FeeSettingsSchema);
