const mongoose = require('mongoose');

const LoyaltySettingSchema = new mongoose.Schema({
  // Singleton document key
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  pointsPerHundred: {
    type: Number,
    default: 10,
    min: 1,
    comment: 'Points earned per ₹100 spent'
  },
  redemptionValue: {
    type: Number,
    default: 0.5,
    min: 0.01,
    comment: 'Value of 1 point in ₹ (e.g. 0.5 means 100 points = ₹50)'
  },
  minRedeemablePoints: {
    type: Number,
    default: 100,
    min: 0,
    comment: 'Minimum points required to redeem'
  },
  maxRedeemablePoints: {
    type: Number,
    default: 5000,
    comment: 'Maximum points that can be redeemed per transaction (null = unlimited)'
  },
  maxRedemptionPercent: {
    type: Number,
    default: 50,
    min: 1,
    max: 100,
    comment: 'Max % of booking amount that can be covered by points'
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoyaltySetting', LoyaltySettingSchema);
