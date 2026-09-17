const path = require('path');
const dotenv = require('dotenv');
const dns = require('dns');

// Force Node.js to prefer IPv4 DNS resolution (prevents IPv6 connection timeout on Vercel)
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignore in environments where not supported
}

// Load .env configs
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Load routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { adminCouponRouter, customerCouponRouter } = require('./routes/coupon.routes');
const { adminCancellationRouter, customerCancellationRouter } = require('./routes/cancellation.routes');
const orderRoutes = require('./routes/order.routes');
const adminOrderRoutes = require('./routes/admin.order.routes');
const staffRoutes = require('./routes/staff.routes');
const deliveryRoutes = require('./routes/deliveryRoutes');

const app = express();
app.set('trust proxy', 1);

app.get('/api/test-env', (req, res) => {
  res.json({
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    mongoUriPrefix: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 15) : 'none',
    nodeEnv: process.env.NODE_ENV,
    isVercel: !!process.env.VERCEL
  });
});

app.get('/api/test-tcp', (req, res) => {
  const net = require('net');
  const host = 'ac-bh7u8td-shard-00-00.sojqp2o.mongodb.net';
  const port = 27017;
  
  const socket = new net.Socket();
  let status = 'connecting';
  
  socket.setTimeout(4000);
  
  socket.on('connect', () => {
    status = 'connected';
    socket.destroy();
    res.json({ success: true, message: `TCP Connection to ${host}:${port} SUCCEEDED!` });
  });
  
  socket.on('timeout', () => {
    status = 'timeout';
    socket.destroy();
    res.status(504).json({ success: false, message: `TCP Connection to ${host}:${port} TIMEOUT after 4s` });
  });
  
  socket.on('error', (err) => {
    status = 'error';
    res.status(500).json({ success: false, message: `TCP Connection to ${host}:${port} FAILED: ${err.message}` });
  });
  
  socket.connect(port, host);
});

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
  max: 100000, // Increased limit for local development/testing
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Body parsing
app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Offline Interceptor Helper
const fs = require('fs');
const mockDbPath = path.join(__dirname, 'uploads', 'offline_db.json');

const getOfflineDb = () => {
  const haircutStyles = [
    "Burst Fade", "Butch Cut", "Faux Hawk", "Mohawk", "Man Bun",
    "Surfer Hair", "Long Hair", "Shag", "Mullet", "Bro Flow",
    "Short Afro", "Regulation Cut", "Short Hair", "Layered",
    "V-Cut Buzz Cut", "Shadow Fade", "Taper Cut", "High and Tight",
    "Brush Up", "Razor Cut", "Temple Fade", "Edgar Cut", "Bowl Cut"
  ];

  const defaultHaircuts = haircutStyles.map((style, idx) => ({
    id: `mock-haircut-${idx}`,
    _id: `mock-haircut-${idx}`,
    name: style,
    price: 1000 + (idx % 3) * 200, // 1000, 1200, 1400 INR
    duration: 30 + (idx % 3) * 15, // 30, 45, 60 mins
    category: 'Haircut',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop',
    description: `A professional ${style} haircut tailored to your styling preferences.`
  }));

  const beardTrimStyles = [
    "Light Stubble", "Heavy Stubble", "Short Boxed Beard", "Corporate Beard",
    "Full Beard", "Beard Fade", "Balbo Beard", "Van Dyke Beard", "Goatee",
    "Anchor Beard", "Ducktail Beard", "Garibaldi Beard"
  ];

  const defaultBeardTrims = beardTrimStyles.map((style, idx) => ({
    id: `mock-beard-${idx}`,
    _id: `mock-beard-${idx}`,
    name: style,
    price: 600 + (idx % 3) * 150, // 600, 750, 900 INR
    duration: 20 + (idx % 2) * 10, // 20, 30 mins
    category: 'Beard Trim',
    icon: 'face',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop',
    description: `A professional ${style} tailored to your styling preferences.`
  }));

    const defaultPremiumServices = [
      {
        id: 'mock-premium-1',
        _id: 'mock-premium-1',
        name: 'Hair Transplant',
        price: 65000,
        duration: 180,
        category: 'Premium Services',
        icon: 'diamond',
        image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop',
        description: 'Advanced micro-follicular hair restoration procedure delivered by master clinical specialists.'
      },
      {
        id: 'mock-premium-2',
        _id: 'mock-premium-2',
        name: 'LED Therapy',
        price: 2000,
        duration: 45,
        category: 'Premium Services',
        icon: 'lightbulb',
        image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop',
        description: 'Targeted scalp photon LED light therapy to stimulate hair follicle rejuvenation and cellular repair.'
      },
      {
        id: 'mock-premium-3',
        _id: 'mock-premium-3',
        name: 'Deep Conditioning',
        price: 3000,
        duration: 60,
        category: 'Premium Services',
        icon: 'spa',
        image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop',
        description: 'Intense peptide keratin moisture infusion mask that restores fiber elasticity and silky luxury.'
      },
      {
        id: 'mock-premium-4',
        _id: 'mock-premium-4',
        name: 'Hot Oil Treatment',
        price: 5000,
        duration: 45,
        category: 'Premium Services',
        icon: 'opacity',
        image: 'https://images.unsplash.com/photo-1608248597359-281b94d1b747?w=500&auto=format&fit=crop',
        description: 'Warm botanical essential oils massage and steaming session for deep root nourishment.'
      }
    ];

    const defaultDb = {
    barbers: [
      {
        id: 'mock-barber-1',
        _id: 'mock-barber-1',
        name: 'Prajwal',
        email: 'prajwal@gmail.com',
        status: 'Active',
        role: 'Creative Stylist',
        rating: 5.0,
        revenue: 0,
        completedBookings: 0,
        activeDays: 5,
        skills: ['Haircut', 'Beard Trim', 'Premium Services'],
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'
      }
    ],
    services: [
      ...defaultPremiumServices,
      {
        id: 'mock-service-1',
        _id: 'mock-service-1',
        name: 'Master Haircut',
        price: 1200,
        duration: 45,
        category: 'Haircut',
        icon: 'content_cut',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop',
        description: 'Precision haircut.'
      },
      ...defaultHaircuts,
      {
        id: 'mock-service-2',
        _id: 'mock-service-2',
        name: 'Signature Beard Sculpt',
        price: 800,
        duration: 30,
        category: 'Beard Trim',
        icon: 'face',
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop',
        description: 'Beard trim.'
      },
      ...defaultBeardTrims
    ],
    products: [
      {
        id: '1',
        _id: '1',
        name: 'Luxe Beard Oil',
        price: 1200,
        image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
        description: 'Premium organic beard oil for a soft, conditioned beard.',
        category: 'Beard Care'
      },
      {
        id: '2',
        _id: '2',
        name: 'Signature Pomade',
        price: 950,
        image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=800&auto=format&fit=crop',
        description: 'Medium hold with a natural shine finish. Washes out easily.',
        category: 'Hair Styling'
      }
    ],
    appointments: [],
    notifications: [],
    leaves: []
  };

  if (!fs.existsSync(mockDbPath)) {
    fs.writeFileSync(mockDbPath, JSON.stringify(defaultDb, null, 2));
    return defaultDb;
  }

  try {
    const db = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
    db.services = db.services || [];
    // Programmatically merge missing haircuts into existing DB
    defaultDb.services.forEach(ds => {
      if (!db.services.some(s => s.name === ds.name)) {
        db.services.push(ds);
      }
    });
    fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2));
    return db;
  } catch (e) {
    return defaultDb;
  }
};

const saveOfflineDb = (db) => {
  fs.writeFileSync(mockDbPath, JSON.stringify(db, null, 2));
};

let cachedDbPromise = null;

// Database Connection Middleware for all requests
const ensureDbConnected = async (req, res, next) => {
  if (req.path.includes('test-env') || req.path.includes('test-tcp')) {
    return next();
  }

  if (mongoose.connection.readyState === 1) {
    global.dbConnected = true;
    return next();
  }

  const connectDB = require('./config/db');
  const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;

  try {
    if (isVercel) {
      // Connect with single attempt to avoid lambda freeze
      await connectDB(1);
    } else {
      if (!cachedDbPromise) {
        cachedDbPromise = connectDB(2);
      }
      await cachedDbPromise;
    }
    global.dbConnected = true;
    next();
  } catch (err) {
    console.error('Database connection failed in middleware, falling back to offline mode:', err.message);
    cachedDbPromise = null;
    global.dbConnected = false;
    next();
  }
};

app.use(ensureDbConnected);

// Database Offline Interceptor Middleware
app.use((req, res, next) => {
  if (global.dbConnected === false) {
    console.log(`[Luxe Offline Mock DB] Intercepting request: ${req.method} ${req.path}`);
    const db = getOfflineDb();

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

    // Staff Login mock
    if (req.path === '/api/staff/login' && req.method === 'POST') {
      const { username, password } = req.body;
      const db = getOfflineDb();
      const cleanUser = (username || '').toLowerCase().trim();
      const staff = db.barbers?.find(b => 
        (b.username && b.username.toLowerCase() === cleanUser) ||
        (b.name && b.name.toLowerCase().replace(/\s+/g, '') === cleanUser.replace(/\s+/g, '')) ||
        (b.name && b.name.toLowerCase() === cleanUser) ||
        (b.email && b.email.toLowerCase() === cleanUser) ||
        (b.id && b.id.toLowerCase() === cleanUser)
      ) || db.barbers?.[0];

      if (staff) {
        return res.json({
          success: true,
          token: 'mock-jwt-token-staff',
          refreshToken: 'mock-refresh-token-staff',
          staff: {
            id: staff.id || staff._id,
            name: staff.name,
            username: staff.username || username,
            email: staff.email,
            role: staff.role || 'staff',
            image: staff.image
          }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid Staff Credentials' });
    }

    // Delivery Boy Login mock
    if (req.path === '/api/delivery/login' && req.method === 'POST') {
      const { username, password } = req.body;
      const db = getOfflineDb();
      const boy = db.deliveryBoys?.find(b => b.username === username);
      if (boy) {
        return res.json({
          success: true,
          data: {
            id: boy.id || boy._id,
            name: boy.name,
            username: boy.username,
            role: 'delivery'
          }
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid Delivery Credentials' });
    }

    // Customer Login mock
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      return res.json({
        success: true,
        token: 'mock-jwt-token-customer',
        refreshToken: 'mock-refresh-token-customer',
        user: {
          id: 'mock-cust-id',
          name: 'James Mercer',
          email: email || 'customer@luxegroom.com',
          role: 'customer',
          email_verified: true,
          profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
        }
      });
    }

    // Register mock
    if (req.path === '/api/auth/register' && req.method === 'POST') {
      const { name, email, mobile } = req.body;
      const cleanEmail = (email || 'customer@luxegroom.com').toLowerCase();
      return res.status(201).json({
        success: true,
        autoVerified: true,
        token: 'mock-jwt-token-customer',
        refreshToken: 'mock-refresh-token-customer',
        user: {
          id: 'mock-cust-id-' + Date.now(),
          name: name || 'New Customer',
          email: cleanEmail,
          mobile: mobile || '',
          role: 'customer',
          email_verified: true,
          profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop'
        },
        message: 'Account created successfully! (Offline Mode)'
      });
    }

    // Mock file upload
    if (req.path === '/api/admin/upload' && req.method === 'POST') {
      return res.json({
        success: true,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw',
        filename: 'placeholder.jpg',
        message: 'Mock upload in offline mode.'
      });
    }

    // GET requests
    if (req.method === 'GET') {
      if (req.path.endsWith('/services/categories')) {
        return res.json({ success: true, data: ['All', 'Premium Services', 'Haircut', 'Beard Trim', 'Facial', 'Packages'] });
      }
      if (req.path.endsWith('/services')) {
        let svcs = db.services || [];
        if (req.query.category && req.query.category !== 'All') {
          svcs = svcs.filter(s => s.category?.toLowerCase() === req.query.category.toLowerCase());
        }
        return res.json({ success: true, data: svcs });
      }
      if (req.path.endsWith('/barbers')) {
        return res.json({ success: true, data: db.barbers || [] });
      }
      if (req.path.endsWith('/delivery-boys')) {
        return res.json({ success: true, data: db.deliveryBoys || [] });
      }
      if (req.path.includes('/delivery/my-deliveries/')) {
        const parts = req.path.split('/');
        const id = parts[parts.length - 1];
        const assignedOrders = (db.orders || []).filter(o => o.deliveryBoyId === id);
        return res.json({ success: true, data: assignedOrders });
      }
      if (req.path.endsWith('/products')) {
        return res.json({ success: true, data: db.products || [] });
      }
      if (req.path.endsWith('/appointments')) {
        return res.json({ success: true, data: db.appointments || [] });
      }
      if (req.path.includes('/products/') && req.path.endsWith('/reviews')) {
        const parts = req.path.split('/');
        const productId = parts[parts.length - 2];
        db.productReviews = db.productReviews || [];
        const reviews = db.productReviews.filter(r => r.productId === productId);
        return res.json({ success: true, data: reviews });
      }
      if (req.path.endsWith('/orders') || req.path.endsWith('/admin/orders')) {
        return res.json({ success: true, data: db.orders || [] });
      }
      if (req.path.endsWith('/reports') || req.path.endsWith('/reports/dashboard')) {
        return res.json({
          success: true,
          data: { totalRevenue: 15400, totalAppointments: db.appointments.length, totalCustomers: 8 }
        });
      }
      if (req.path.endsWith('/staff/leave')) {
        db.leaves = db.leaves || [];
        const myLeaves = db.leaves.filter(l => l.barberId === 'mock-barber-1');
        return res.json({ success: true, data: myLeaves });
      }
      if (req.path.endsWith('/staff/salary')) {
        const barber = db.barbers?.find(b => b.id === 'mock-barber-1') || { salary: 1500, revenue: 0 };
        return res.json({ success: true, data: { salary: barber.salary, revenue: barber.revenue } });
      }
      if (req.path.endsWith('/staff/appointments')) {
        db.appointments = db.appointments || [];
        const myApts = db.appointments.filter(a => a.barberId === 'mock-barber-1');
        return res.json({ success: true, data: myApts });
      }
      if (req.path.endsWith('/admin/leaves') || req.path.includes('/admin/leaves')) {
        db.leaves = db.leaves || [];
        const populatedLeaves = db.leaves.map(l => {
          const barber = db.barbers?.find(b => b.id === l.barberId || b._id === l.barberId) || { name: 'Unknown Barber', email: '', role: '' };
          return {
            ...l,
            barberId: {
              _id: l.barberId,
              name: barber.name,
              email: barber.email,
              role: barber.role,
              image: barber.image
            }
          };
        });
        return res.json({ success: true, count: populatedLeaves.length, data: populatedLeaves });
      }
      if (req.path.endsWith('/leaves/approved')) {
        db.leaves = db.leaves || [];
        const approved = db.leaves.filter(l => l.status === 'Approved');
        return res.json({ success: true, data: approved });
      }
      if (req.path.includes('/coupons') || req.path.includes('/memberships') || req.path.includes('/loyalty') ||
          req.path.includes('/cancellations') || req.path.includes('/refunds') || req.path.includes('/cancellation/settings')) {
        return res.json({ success: true, data: [] });
      }
    }

    // POST requests (mutations)
    if (req.method === 'POST') {
      const newEntity = {
        _id: 'offline-' + Date.now(),
        id: 'offline-' + Date.now(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      if (req.path.endsWith('/staff/leave')) {
        db.leaves = db.leaves || [];
        const newLeave = {
          _id: 'offline-leave-' + Date.now(),
          id: 'offline-leave-' + Date.now(),
          barberId: 'mock-barber-1', // default mock staff
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          reason: req.body.reason,
          status: 'Pending',
          createdAt: new Date().toISOString()
        };
        db.leaves.push(newLeave);
        saveOfflineDb(db);
        return res.json({ success: true, data: newLeave });
      }

      if (req.path.endsWith('/barbers')) {
        db.barbers = db.barbers || [];
        db.barbers.push(newEntity);
        saveOfflineDb(db);
        return res.json({ success: true, data: newEntity });
      }
      if (req.path.endsWith('/delivery-boys')) {
        db.deliveryBoys = db.deliveryBoys || [];
        // Emulate generating the credentials file
        const credFile = require('path').join(__dirname, '..', 'delivery_boy_credentials.txt');
        require('fs').appendFileSync(credFile, `Delivery Boy Created\nName: ${newEntity.name}\nUsername: ${newEntity.username}\nPassword: ${newEntity.password}\n\n`);
        
        newEntity.status = 'Active';
        db.deliveryBoys.push(newEntity);
        saveOfflineDb(db);
        return res.json({ success: true, data: newEntity });
      }
      if (req.path.endsWith('/services')) {
        db.services = db.services || [];
        db.services.push(newEntity);
        saveOfflineDb(db);
        return res.json({ success: true, data: newEntity });
      }
      if (req.path.endsWith('/products')) {
        db.products = db.products || [];
        db.products.push(newEntity);
        saveOfflineDb(db);
        return res.json({ success: true, data: newEntity });
      }
      if (req.path.endsWith('/orders')) {
        db.orders = db.orders || [];
        const receiptNumber = `REC-${Date.now().toString().slice(-8)}`;
        const newOrder = {
          ...req.body,
          _id: 'offline-order-' + Date.now(),
          id: 'offline-order-' + Date.now(),
          receiptNumber,
          status: 'Processing',
          createdAt: new Date().toISOString()
        };
        db.orders.push(newOrder);

        // Push corresponding admin notification
        db.notifications = db.notifications || [];
        const notifId = `notif-order-${Date.now()}`;
        db.notifications.push({
          notificationId: notifId,
          _id: notifId,
          recipient: 'admin',
          recipientRole: 'admin',
          type: 'New Product Order',
          title: 'New Product Order Placed',
          message: `New product order ${receiptNumber} of ₹${req.body.totalAmount} placed.`,
          isRead: false,
          read: false,
          time: 'Just now'
        });

        saveOfflineDb(db);
        return res.json({ success: true, data: newOrder });
      }

      if (req.path.endsWith('/appointments')) {
        db.appointments = db.appointments || [];
        db.appointments.push(newEntity);
        
        // Push corresponding admin notification
        db.notifications = db.notifications || [];
        const notifId = `notif-${Date.now()}`;
        const newNotifObj = {
          notificationId: notifId,
          _id: notifId,
          recipient: 'admin',
          recipientRole: 'admin',
          type: 'booking_request',
          title: 'New Booking Request',
          message: `${newEntity.clientName || 'Guest'} booked ${newEntity.serviceName} with ${newEntity.barberName} on ${newEntity.date} at ${newEntity.time}`,
          bookingId: newEntity._id || newEntity.id,
          userId: 'mock-user-id',
          isRead: false,
          read: false,
          time: 'Just now',
          bookingPayload: {
            bookingId: newEntity._id || newEntity.id,
            userId: 'mock-user-id',
            userName: newEntity.clientName || 'Guest',
            userAvatar: '',
            serviceName: newEntity.serviceName,
            stylistName: newEntity.barberName,
            date: newEntity.date,
            time: newEntity.time,
            price: newEntity.price,
            notes: newEntity.notes || ''
          }
        };
        db.notifications.push(newNotifObj);
        
        const io = req.app.get('io');
        if (io) {
          io.to('admin-room').emit('new-notification', newNotifObj);
          console.log(`[Socket Offline] Emit new-notification to admin-room:`, notifId);
        }
        
        saveOfflineDb(db);
        return res.json({ success: true, data: newEntity });
      }
      if (req.path.includes('/products/') && req.path.endsWith('/reviews')) {
        const parts = req.path.split('/');
        const productId = parts[parts.length - 2];
        const { rating, text } = req.body;

        // Verify purchase
        db.orders = db.orders || [];
        const hasBought = db.orders.some(o => 
          o.status === 'Completed' && 
          o.items && o.items.some(item => item.productId === productId)
        );

        if (!hasBought) {
          return res.status(400).json({ 
            success: false, 
            message: 'You can only review products you have purchased and received.' 
          });
        }

        db.productReviews = db.productReviews || [];
        const newReview = {
          _id: 'rev-' + Date.now(),
          id: 'rev-' + Date.now(),
          productId,
          rating,
          text,
          clientName: 'James Mercer',
          clientAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        db.productReviews.push(newReview);
        saveOfflineDb(db);
        return res.json({ success: true, data: newReview });
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
      if (req.path.includes('/cancellations')) {
        return res.json({
          success: true,
          data: { _id: 'mock-cancel-' + Date.now(), status: 'Pending' },
          policy: { refundAmount: 0, refundPercentage: 100, cancellationType: 'free', policyText: 'Free cancellation within 24 hours.' },
          message: 'Cancellation request submitted (offline mode)'
        });
      }
    }

    // PUT requests (updates)
    if (req.method === 'PUT') {
      if (req.path.includes('/admin/leaves/') && req.path.endsWith('/status')) {
        const parts = req.path.split('/');
        const status = req.body.status;
        const id = parts[parts.length - 2];
        
        db.leaves = db.leaves || [];
        db.leaves = db.leaves.map(l => (l.id === id || l._id === id) ? { ...l, status } : l);
        saveOfflineDb(db);
        
        const updated = db.leaves.find(l => l.id === id || l._id === id);
        return res.json({ success: true, data: updated });
      }

      if (req.path.includes('/admin/delivery-boys/') && req.path.endsWith('/status')) {
        const parts = req.path.split('/');
        const status = req.body.status;
        const id = parts[parts.length - 2];
        
        db.deliveryBoys = db.deliveryBoys || [];
        db.deliveryBoys = db.deliveryBoys.map(d => (d.id === id || d._id === id) ? { ...d, status } : d);
        saveOfflineDb(db);
        
        const updated = db.deliveryBoys.find(d => d.id === id || d._id === id);
        return res.json({ success: true, data: updated });
      }

      if (req.path.includes('/admin/orders/') && req.path.endsWith('/status') || req.path.includes('/delivery/orders/') && req.path.endsWith('/status') || req.path.includes('/auth/orders/') && req.path.endsWith('/status')) {
        const parts = req.path.split('/');
        const status = req.body.status;
        const exchangeItem = req.body.exchangeItem;
        const id = parts[parts.length - 2];
        
        db.orders = db.orders || [];
        const oldOrder = db.orders.find(o => o.id === id || o._id === id);
        
        if (oldOrder && status === 'Completed' && oldOrder.status !== 'Completed' && oldOrder.deliveryBoyId) {
          db.deliveryBoys = db.deliveryBoys || [];
          const dboy = db.deliveryBoys.find(d => d.id === oldOrder.deliveryBoyId || d._id === oldOrder.deliveryBoyId);
          if (dboy) {
             dboy.revenue = (dboy.revenue || 0) + 50;
          }
        }

        db.orders = db.orders.map(o => (o.id === id || o._id === id) ? { ...o, status, ...(exchangeItem ? { exchangeItem } : {}) } : o);
        saveOfflineDb(db);
        
        const updated = db.orders.find(o => o.id === id || o._id === id);
        return res.json({ success: true, data: updated });
      }

      const parts = req.path.split('/');
      const id = parts.pop();
      const type = parts.pop(); // e.g. barbers, services, products
      
      if (type === 'barbers') {
        db.barbers = (db.barbers || []).map(b => (b.id === id || b._id === id) ? { ...b, ...req.body } : b);
        saveOfflineDb(db);
        const updated = db.barbers.find(b => b.id === id || b._id === id);
        return res.json({ success: true, data: updated });
      }
      if (type === 'services') {
        db.services = (db.services || []).map(s => (s.id === id || s._id === id) ? { ...s, ...req.body } : s);
        saveOfflineDb(db);
        const updated = db.services.find(s => s.id === id || s._id === id);
        return res.json({ success: true, data: updated });
      }
      if (type === 'products') {
        db.products = (db.products || []).map(p => (p.id === id || p._id === id) ? { ...p, ...req.body, updatedAt: new Date().toISOString() } : p);
        saveOfflineDb(db);
        const updated = db.products.find(p => p.id === id || p._id === id);
        return res.json({ success: true, data: updated });
      }

      if (req.path.endsWith('/staff/profile')) {
        const staffId = 'mock-barber-1'; // fallback staff id
        db.barbers = (db.barbers || []).map(b => (b.id === staffId || b._id === staffId) ? { ...b, ...req.body } : b);
        saveOfflineDb(db);
        return res.json({ success: true, message: 'Profile updated offline', data: db.barbers.find(b => b.id === staffId || b._id === staffId) });
      }
      if (req.path.endsWith('/staff/change-password')) {
        return res.json({ success: true, message: 'Password changed offline' });
      }
      if (req.path.includes('/staff/appointments/') && req.path.endsWith('/status')) {
        const parts = req.path.split('/');
        const status = req.body.status;
        const id = parts[parts.length - 2];
        
        db.appointments = db.appointments || [];
        const oldAppointment = db.appointments.find(a => a.id === id || a._id === id);
        
        if (oldAppointment && status === 'Completed' && oldAppointment.status !== 'Completed' && oldAppointment.barberId) {
          db.barbers = db.barbers || [];
          const barber = db.barbers.find(b => b.id === oldAppointment.barberId || b._id === oldAppointment.barberId);
          if (barber) {
            barber.completedBookings = (barber.completedBookings || 0) + 1;
            barber.revenue = (barber.revenue || 0) + (oldAppointment.finalAmount || oldAppointment.price || 0);
          }
        }

        db.appointments = db.appointments.map(a => (a.id === id || a._id === id) ? { ...a, status } : a);
        saveOfflineDb(db);
        
        const updated = db.appointments.find(a => a.id === id || a._id === id);
        return res.json({ success: true, data: updated });
      }
    }

    // DELETE requests
    if (req.method === 'DELETE') {
      const parts = req.path.split('/');
      const id = parts.pop();
      const type = parts.pop();

      if (type === 'barbers') {
        db.barbers = (db.barbers || []).filter(b => b.id !== id && b._id !== id);
        saveOfflineDb(db);
        return res.json({ success: true, message: 'Barber deleted offline' });
      }
      if (type === 'services') {
        db.services = (db.services || []).filter(s => s.id !== id && s._id !== id);
        saveOfflineDb(db);
        return res.json({ success: true, message: 'Service deleted offline' });
      }
      if (type === 'products') {
        db.products = (db.products || []).filter(p => p.id !== id && p._id !== id);
        saveOfflineDb(db);
        return res.json({ success: true, message: 'Product deleted offline' });
      }
    }

    return res.json({ success: true, message: 'Mock action completed in offline mode.' });
  }
  next();
});

// Mount routers
const { getBookingSettings } = require('./controllers/admin.controller');
app.get('/api/settings', getBookingSettings);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/delivery', deliveryRoutes);

// Module 15 — Coupons & Loyalty
app.use('/api/admin', adminCouponRouter);
app.use('/api/auth', customerCouponRouter);

// Module 16 — Cancellation & Refund
app.use('/api/admin', adminCancellationRouter);
app.use('/api/auth', customerCancellationRouter);

// Module 17 - Notifications (Push)
const notificationRoutes = require('./routes/notification.routes');
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Internal Server Error' 
  });
});

module.exports = app;
