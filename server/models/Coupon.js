const mongoose = require('mongoose');

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_-]{3,20}$/, 'Coupon code must be 3-20 alphanumeric characters']
  },
  name: {
    type: String,
    required: [true, 'Coupon name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minBookingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null // null = no cap
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  usageLimit: {
    type: Number,
    default: null // null = unlimited
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  applicableServices: {
    type: [String],
    default: [] // empty = all services
  },
  applicableStaff: {
    type: [String],
    default: [] // empty = all staff
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  totalDiscountGiven: {
    type: Number,
    default: 0
  },
  assignedTo: {
    type: [String], // Array of email addresses
    default: []
  }
}, {
  timestamps: true
});

// Virtual: is coupon currently valid
CouponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return this.isActive
    && now >= this.validFrom
    && now <= this.validUntil
    && (this.usageLimit === null || this.usedCount < this.usageLimit);
});

CouponSchema.set('toJSON', { virtuals: true });
CouponSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Coupon', CouponSchema);
