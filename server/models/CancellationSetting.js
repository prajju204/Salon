const mongoose = require('mongoose');

const CancellationSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'global',
    unique: true
  },
  freeCancellationHours: {
    type: Number,
    default: 24,
    min: 0,
    comment: 'Hours before appointment within which cancellation is free (full refund)'
  },
  lateCancellationDeductionPercent: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
    comment: 'Percentage deducted if cancelled after free window (e.g. 50 = 50% refund)'
  },
  noShowDeductionPercent: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
    comment: 'Percentage deducted for no-show (100 = no refund)'
  },
  allowCustomerCancellation: {
    type: Boolean,
    default: true,
    comment: 'If false, customers must contact admin to cancel'
  },
  maxCancellationsPerMonth: {
    type: Number,
    default: null,
    comment: 'Max cancellations allowed per customer per month (null = unlimited)'
  },
  policyText: {
    type: String,
    default: 'Free cancellation up to 24 hours before your appointment. Late cancellations (less than 24 hours) will incur a 50% charge. No-shows will be charged the full amount.'
  },
  isEnabled: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CancellationSetting', CancellationSettingSchema);
