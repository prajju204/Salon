const Product = require('../models/Product');
const ActivityLog = require('../models/ActivityLog');

const extractDirectImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl || '';
  const trimmed = rawUrl.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('/uploads')) {
    return trimmed;
  }

  if (trimmed.includes('gstatic.com/images') || trimmed.includes('googleusercontent.com/')) {
    return trimmed;
  }

  try {
    const isGoogle = /google\.[a-z.]+/i.test(trimmed);
    const isBing = /bing\.com/i.test(trimmed);

    if (isGoogle || isBing) {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      
      const direct = parsed.searchParams.get('imgurl') ||
                     parsed.searchParams.get('imageurl') ||
                     parsed.searchParams.get('image_url') ||
                     parsed.searchParams.get('mediaurl') ||
                     parsed.searchParams.get('media_url') ||
                     parsed.searchParams.get('src');
      if (direct && /^https?:\/\//i.test(direct)) {
        return decodeURIComponent(direct);
      }

      const tbnid = parsed.searchParams.get('tbnid');
      if (tbnid) {
        return `https://encrypted-tbn0.gstatic.com/images?q=tbn:${tbnid}`;
      }

      const adurl = parsed.searchParams.get('adurl') || parsed.searchParams.get('url') || parsed.searchParams.get('q');
      if (adurl) {
        const decodedAdurl = decodeURIComponent(adurl);
        if (/\.(jpeg|jpg|png|webp|gif|svg|avif)(\?.*)?$/i.test(decodedAdurl) || /(?:images|cdn|photo|media)/i.test(decodedAdurl)) {
          return decodedAdurl;
        }
      }
    }
  } catch (e) {
    const imgMatch = trimmed.match(/[?&](?:imgurl|imageurl|image_url|mediaurl)=([^&]+)/i);
    if (imgMatch && imgMatch[1]) {
      return decodeURIComponent(imgMatch[1]);
    }
    const tbnMatch = trimmed.match(/[?&]tbnid=([^&]+)/i);
    if (tbnMatch && tbnMatch[1]) {
      return `https://encrypted-tbn0.gstatic.com/images?q=tbn:${tbnMatch[1]}`;
    }
  }

  return trimmed;
};

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
    if (req.body.image) {
      req.body.image = extractDirectImageUrl(req.body.image);
    }
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
    if (req.body.image) {
      req.body.image = extractDirectImageUrl(req.body.image);
    }
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
