const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  image: {
    type: String
  }
});

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [OrderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Paid'
  },
  status: {
    type: String,
    required: true,
    enum: ['Processing', 'Taken', 'Shipped', 'Out for Delivery', 'Delivered', 'Completed', 'Cancelled', 'Return/Exchange Requested', 'Return Requested', 'Exchange Requested', 'Picked', 'Returned to Company', 'Refunded'],
    default: 'Processing'
  },
  exchangeItem: {
    productId: { type: String },
    name: { type: String }
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryBoy'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);
