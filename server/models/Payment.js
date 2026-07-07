const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  appointmentId: {
    type: String
  },
  clientName: {
    type: String,
    required: [true, 'Please add client name']
  },
  amount: {
    type: Number,
    required: [true, 'Please add payment amount']
  },
  method: {
    type: String,
    required: [true, 'Please add payment method'],
    default: 'Credit Card'
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Paid'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
