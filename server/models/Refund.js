const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  refundCategory: {
    type: String,
    enum: ['Salon', 'Online'],
    default: 'Salon'
  },
  cancellationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancellation',
    required: false,
    index: true
  },
  appointmentId: {
    type: String,
    required: false
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false,
    index: true
  },
  customerId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Customer',
    required: false,
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
