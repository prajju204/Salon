const mongoose = require('mongoose');

const CancellationSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    index: true
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
  // Snapshot of appointment details at time of cancellation
  appointmentSnapshot: {
    serviceName: String,
    barberName: String,
    barberId: String,
    date: String,
    time: String,
    originalAmount: Number,
    paymentMethod: String,
    paymentId: String
  },
  reason: {
    type: String,
    required: [true, 'Cancellation reason is required'],
    trim: true
  },
  reasonCategory: {
    type: String,
    enum: [
      'Schedule Conflict',
      'Emergency',
      'Changed My Mind',
      'Found Another Salon',
      'Health Issue',
      'Weather',
      'Travel Plans Changed',
      'Service No Longer Needed',
      'Other'
    ],
    default: 'Other'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
    index: true
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  refundAmount: {
    type: Number,
    default: 0,
    comment: 'Calculated refund amount in ₹'
  },
  refundPercentage: {
    type: Number,
    default: 0,
    comment: 'Percentage of booking amount to be refunded'
  },
  cancellationType: {
    type: String,
    enum: ['free', 'late', 'no-show'],
    default: 'free',
    comment: 'Determined by cancellation window policy'
  },
  hoursBeforeAppointment: {
    type: Number,
    comment: 'How many hours before appointment the request was made'
  },
  processedBy: {
    type: String,
    default: null,
    comment: 'Admin user who processed the request'
  },
  processedAt: {
    type: Date,
    default: null
  },
  staffNotified: {
    type: Boolean,
    default: false
  },
  slotReleased: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cancellation', CancellationSchema);
