const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Please add a client name']
  },
  barberName: {
    type: String,
    required: [true, 'Please add a barber name']
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating'],
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: [true, 'Please add review description']
  },
  date: {
    type: String,
    required: [true, 'Please add date YYYY-MM-DD']
  },
  approved: {
    type: Boolean,
    default: true
  },
  reply: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema);
