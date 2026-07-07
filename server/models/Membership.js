const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['Basic', 'Silver', 'Gold', 'Platinum'],
    required: true,
    unique: true
  },
  minSpend: {
    type: Number,
    required: true,
    default: 0,
    comment: 'Minimum total lifetime spend (₹) to qualify for this tier'
  },
  discountPercentage: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 100
  },
  priorityBooking: {
    type: Boolean,
    default: false
  },
  exclusiveServices: {
    type: [String],
    default: []
  },
  freeGroomingSessions: {
    type: Number,
    default: 0,
    comment: 'Number of free grooming sessions per month'
  },
  rewardPointMultiplier: {
    type: Number,
    default: 1.0,
    min: 0.1,
    comment: 'Points multiplier for this tier (e.g. 2.0 = double points)'
  },
  description: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#c6c6c6',
    comment: 'Display color for the tier badge'
  },
  icon: {
    type: String,
    default: 'workspace_premium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Membership', MembershipSchema);
