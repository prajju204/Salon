const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  recipient: {
    type: String,
    default: 'admin'
  },
  recipientRole: { // Legacy fallback
    type: String,
    default: 'admin'
  },
  type: {
    type: String,
    default: 'New Booking'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  text: { // Legacy fallback
    type: String
  },
  bookingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  bookingDetails: {
    type: Object,
    default: null
  },
  bookingPayload: {
    type: Object,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  read: { // Legacy fallback
    type: Boolean,
    default: false
  },
  time: { // Legacy fallback
    type: String,
    default: 'Just now'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
