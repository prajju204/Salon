const Order = require('../models/Order');
const ProductReview = require('../models/ProductReview');

// Add review to a product
exports.addProductReview = async (req, res) => {
  try {
    const { rating, text } = req.body;
    const productId = req.params.id;

    // Check if customer has purchased this product and order status is 'Completed' (Delivered)
    const orders = await Order.find({
      user: req.user._id,
      status: 'Completed',
      'items.productId': productId
    });

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You can only review products you have purchased and received.'
      });
    }

    const review = await ProductReview.create({
      user: req.user._id,
      clientName: req.user.fullName || req.user.name || 'Client',
      clientAvatar: req.user.profilePic || '',
      productId,
      rating,
      text,
      date: new Date().toISOString().split('T')[0]
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const reviews = await ProductReview.find({ productId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
