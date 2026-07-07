const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  cancellationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancellation',
    required: true,
    index: true
  },
  appointmentId: {
    type: String,
    required: true
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
  originalAmount: {
    type: Number,
    required: true,
    comment: 'Original booking amount (₹)'
  },
  refundAmount: {
    type: Number,
    required: true,
    comment: 'Actual refund amount (₹)'
  },
  refundPercentage: {
    type: Number,
    required: true,
    comment: 'Percentage of original amount refunded'
  },
  method: {
    type: String,
    enum: ['Original Payment Method', 'Bank Transfer', 'Wallet Credit', 'Cash'],
    default: 'Original Payment Method'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Refunded'],
    default: 'Pending',
    index: true
  },
  transactionRef: {
    type: String,
    default: null,
    comment: 'External payment gateway refund transaction ID'
  },
  processedBy: {
    type: String,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  },
  adminNotes: {
    type: String,
    default: ''
  },
  // Service snapshot
  serviceName: {
    type: String,
    default: ''
  },
  barberName: {
    type: String,
    default: ''
  },
  appointmentDate: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Refund', RefundSchema);
