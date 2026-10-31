const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a service name']
  },
  duration: {
    type: Number,
    required: [true, 'Please add a duration in minutes']
  },
  price: {
    type: Number,
    required: [true, 'Please add a pricing amount']
  },
  category: {
    type: String,
    required: [true, 'Please add a service category']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Both'],
    default: 'Both'
  },
  icon: {
    type: String,
    default: 'content_cut'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema);
