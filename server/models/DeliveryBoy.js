const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  salary: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  payouts: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    note: String
  }],
  upiId: {
    type: String
  },
  bankAccountNumber: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryBoy', deliveryBoySchema);
