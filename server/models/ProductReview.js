const mongoose = require('mongoose');

const ProductReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  clientAvatar: {
    type: String
  },
  productId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductReview', ProductReviewSchema);
