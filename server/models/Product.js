const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please add a product price'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Hair Styling', 'Hair Care', 'Beard Care', 'Shaving']
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop'
  },
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'In Stock'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
