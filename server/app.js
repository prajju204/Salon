const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { adminCouponRouter, customerCouponRouter } = require('./routes/coupon.routes');
const { adminCancellationRouter, customerCancellationRouter } = require('./routes/cancellation.routes');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading images from external URLs
}));

// CORS configuration - support React Vite app
app.use(cors({
  origin: '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300, // Limit to 300 requests per IP per 15 minutes
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Offline Interceptor
app.use((req, res, next) => {
  if (global.dbConnected === false) {
    console.log(`[Luxe Offline Mock] Intercepting request: ${req.method} ${req.path}`);
    
    // Admin Login mock
    if (req.path === '/api/admin/login' && req.method === 'POST') {
      const { email, password } = req.body;
      if (email === 'admin@gmail.com' && password === 'Admin@123') {
        return res.json({
          success: true,
          token: 'mock-jwt-token-admin',
          user: {
            id: 'mock-admin-id',
            name: 'Luxe Admin',
            email: 'admin@gmail.com',
            role: 'admin',
            profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'
          }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
    }

    // Customer Login mock
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      return res.json({
        success: true,
        token: 'mock-jwt-token-customer',
        user: {
          id: 'mock-cust-id',
          name: 'James Mercer',
          email: email || 'customer@luxegroom.com',
          role: 'customer',
          profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
        }
      });
    }

    // Register mock
    if (req.path === '/api/auth/register' && req.method === 'POST') {
      const { name, email } = req.body;
      return res.json({
        success: true,
        token: 'mock-jwt-token-customer',
        user: {
          id: 'mock-cust-id-' + Date.now(),
          name: name || 'New Customer',
          email: email,
          role: 'customer',
          profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
        }
      });
    }

    // Services / Stylists / Appointments mocks
    if (req.method === 'GET') {
      if (req.path.endsWith('/services/categories')) {
        return res.json({ success: true, data: ['All', 'Haircut', 'Beard Trim', 'Luxury Spa', 'Luxury Shave'] });
      }
      if (req.path.endsWith('/services')) {
        const dummyServices = [
          {
            id: 'mock-1', _id: 'mock-1', name: 'Master Haircut', price: 45, duration: 45, category: 'Haircut', icon: 'content_cut',
            image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop', description: 'Precision haircut.'
          },
          {
            id: 'mock-2', _id: 'mock-2', name: 'Signature Beard Sculpt', price: 30, duration: 30, category: 'Beard Trim', icon: 'face',
            image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop', description: 'Beard trim.'
          }
        ];
        const category = req.query.category;
        const filtered = (category && category !== 'All') ? dummyServices.filter(s => s.category.toLowerCase().includes(category.toLowerCase())) : dummyServices;
        return res.json({ success: true, data: filtered });
      }
      if (req.path.endsWith('/barbers') || req.path.endsWith('/appointments')) {
        return res.json({ success: true, data: [] });
      }
      if (req.path.endsWith('/reports')) {
        return res.json({
          success: true,
          data: { totalRevenue: 15400, totalAppointments: 14, totalCustomers: 8 }
        });
      }
      // Module 15 & 16 GET mocks
      if (req.path.includes('/coupons') || req.path.includes('/memberships') || req.path.includes('/loyalty') ||
          req.path.includes('/cancellations') || req.path.includes('/refunds') || req.path.includes('/cancellation/settings')) {
        return res.json({ success: true, data: [] });
      }
    }

    // Mock success for mutations
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
      if (req.path === '/api/admin/upload') {
        return res.json({
          success: true,
          imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw',
          filename: 'placeholder.jpg',
          message: 'Mock upload in offline mode.'
        });
      }
      // Coupon validate mock
      if (req.path.includes('/coupons/validate')) {
        const { bookingAmount = 500, code = 'DEMO10' } = req.body || {};
        const discountAmount = Math.round(bookingAmount * 0.10);
        return res.json({
          success: true,
          data: {
            code: code.toUpperCase(),
            name: 'Demo Discount',
            discountType: 'percentage',
            discountValue: 10,
            discountAmount,
            finalAmount: bookingAmount - discountAmount,
            originalAmount: bookingAmount
          },
          message: `Coupon applied! You save ₹${discountAmount}`
        });
      }
      // Loyalty redeem mock
      if (req.path.includes('/loyalty/redeem')) {
        const { bookingAmount = 500, points = 100 } = req.body || {};
        const discount = Math.round(points * 0.5);
        return res.json({
          success: true,
          data: { pointsToRedeem: points, discountAmount: discount, finalAmount: bookingAmount - discount },
          message: `Redeeming ${points} points for ₹${discount} discount`
        });
      }
      // Cancellation request mock
      if (req.path.includes('/cancellations') && req.method === 'POST') {
        return res.json({
          success: true,
          data: { _id: 'mock-cancel-' + Date.now(), status: 'Pending' },
          policy: { refundAmount: 0, refundPercentage: 100, cancellationType: 'free', policyText: 'Free cancellation within 24 hours.' },
          message: 'Cancellation request submitted (offline mode)'
        });
      }
      return res.json({ success: true, message: 'Mock action completed in offline mode.' });
    }
  }
  next();
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Module 15 — Coupons & Loyalty
app.use('/api/admin', adminCouponRouter);
app.use('/api/auth', customerCouponRouter);

// Module 16 — Cancellation & Refund
app.use('/api/admin', adminCancellationRouter);
app.use('/api/auth', customerCancellationRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

module.exports = app;
