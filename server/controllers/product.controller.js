const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    
    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'Product Added',
        details: `Added new product: ${product.name}`
      });
    }

    // Emit Socket.io real-time update
    const io = req.app.get('io');
    if (io) io.emit('products_updated');
    
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update a product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'Product Updated',
        details: `Updated product: ${product.name}`
      });
    }

    // Emit Socket.io real-time update
    const io = req.app.get('io');
    if (io) io.emit('products_updated');
    
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Log activity
    if (req.user) {
      await ActivityLog.create({
        userEmail: req.user.email,
        role: 'admin',
        action: 'Product Deleted',
        details: `Deleted product: ${product.name}`
      });
    }

    // Emit Socket.io real-time update
    const io = req.app.get('io');
    if (io) io.emit('products_updated');
    
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
