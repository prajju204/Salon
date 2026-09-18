const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const CustomerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please add full name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  mobile: {
    type: String,
    required: [true, 'Please add a mobile number']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'customer'
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verificationRequestTimestamps: {
    type: [Date],
    default: []
  },
  pushSubscriptions: {
    type: Array,
    default: []
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  walletTransactions: [{
    id: { type: String },
    serviceName: { type: String, default: 'Refund' },
    stylistName: { type: String, default: 'Luxe Care' },
    date: { type: String },
    amount: { type: Number },
    status: { type: String, default: 'Refunded' },
    type: { type: String, enum: ['Credit', 'Debit'], default: 'Credit' },
    receiptNumber: { type: String },
    paymentMethod: { type: String, default: 'Digital Wallet' },
    description: { type: String }
  }]
}, {
  timestamps: true
});

// Hash password using bcrypt
CustomerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
CustomerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Customer', CustomerSchema);
