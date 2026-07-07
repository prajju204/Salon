const mongoose = require('mongoose');

const LoyaltyTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'bonus', 'adjusted'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  appointmentId: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  },
  balance: {
    type: Number,
    default: 0,
    comment: 'Running balance after this transaction'
  }
}, { _id: true });

const LoyaltyAccountSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true,
    index: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Current redeemable point balance'
  },
  totalEarned: {
    type: Number,
    default: 0,
    comment: 'Lifetime total points earned'
  },
  totalRedeemed: {
    type: Number,
    default: 0,
    comment: 'Lifetime total points redeemed'
  },
  totalSpend: {
    type: Number,
    default: 0,
    comment: 'Lifetime total amount paid (₹), used for tier upgrades'
  },
  membershipTier: {
    type: String,
    enum: ['Basic', 'Silver', 'Gold', 'Platinum'],
    default: 'Basic'
  },
  transactions: {
    type: [LoyaltyTransactionSchema],
    default: []
  }
}, {
  timestamps: true
});

// Auto-calculate membership tier based on totalSpend
LoyaltyAccountSchema.methods.recalculateTier = async function () {
  const Membership = require('./Membership');
  const tiers = await Membership.find().sort({ minSpend: -1 });
  for (const tier of tiers) {
    if (this.totalSpend >= tier.minSpend) {
      this.membershipTier = tier.tier;
      break;
    }
  }
};

module.exports = mongoose.model('LoyaltyAccount', LoyaltyAccountSchema);
