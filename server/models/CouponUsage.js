const mongoose = require('mongoose');

const CouponUsageSchema = new mongoose.Schema({
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
    index: true
  },
  couponCode: {
    type: String,
    required: true,
    uppercase: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  appointmentId: {
    type: String,
    required: true
  },
  originalAmount: {
    type: Number,
    required: true,
    comment: 'Booking amount before discount (₹)'
  },
  discountApplied: {
    type: Number,
    required: true,
    comment: 'Actual discount amount in ₹'
  },
  finalAmount: {
    type: Number,
    required: true,
    comment: 'Amount paid after discount (₹)'
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to enforce per-user limit checks efficiently
CouponUsageSchema.index({ couponId: 1, customerId: 1 });

module.exports = mongoose.model('CouponUsage', CouponUsageSchema);
