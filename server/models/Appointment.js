const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Please add a client name']
  },
  clientEmail: {
    type: String,
    required: [true, 'Please add client email']
  },
  clientMobile: {
    type: String
  },
  serviceName: {
    type: String,
    required: [true, 'Please add service name']
  },
  price: {
    type: Number,
    required: [true, 'Please add price']
  },
  date: {
    type: String,
    required: [true, 'Please add date YYYY-MM-DD']
  },
  time: {
    type: String,
    required: [true, 'Please add time HH:MM']
  },
  barberId: {
    type: String,
    required: [true, 'Please add barber ID']
  },
  barberName: {
    type: String,
    required: [true, 'Please add barber name']
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Declined'],
    default: 'Pending'
  },
  // Customer reference (for loyalty & cancellation lookups)
  customerId: {
    type: String,
    default: null
  },
  // Coupon integration
  couponCode: {
    type: String,
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  // Loyalty points integration
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  loyaltyDiscountAmount: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  // Final amount after all discounts
  finalAmount: {
    type: Number,
    default: null
  },
  // Cancellation reference
  cancellationId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
