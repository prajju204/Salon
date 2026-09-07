require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join', (roleOrEmail) => {
    if (roleOrEmail === 'admin') {
      socket.join('admin-room');
      console.log(`Admin joined room: ${socket.id}`);
    } else if (roleOrEmail) {
      socket.join(roleOrEmail);
      console.log(`Client joined room: ${roleOrEmail} (${socket.id})`);
    }
  });

  // Handle new booking notifications from user portal
  socket.on('new-booking', async (data) => {
    console.log(`[Socket] new-booking received from ${socket.id}:`, data?.title);
    try {
      const { createAdminNotification } = require('./utils/notification');
      const notif = await createAdminNotification(app, {
        type: data.type || 'booking_request',
        title: data.title || 'New Booking Request',
        message: data.message || 'A new booking was made.',
        bookingId: data.bookingId || '',
        userId: data.userId || 'guest',
        bookingDetails: data.bookingDetails || null,
        bookingPayload: data.bookingPayload || null
      });
      console.log(`[Socket] Admin notification saved and broadcasted. ID: ${notif?.notificationId || 'N/A'}`);
    } catch (err) {
      console.error('[Socket] Error saving new-booking notification:', err.message);
      // Fallback: still broadcast the event even if DB save failed
      const fallbackNotif = {
        notificationId: `notif-fallback-${Date.now()}`,
        recipient: 'admin',
        recipientRole: 'admin',
        type: data.type || 'booking_request',
        title: data.title || 'New Booking Request',
        message: data.message || 'A new booking was made.',
        bookingId: data.bookingId || '',
        bookingDetails: data.bookingDetails || null,
        bookingPayload: data.bookingPayload || null,
        isRead: false,
        read: false,
        createdAt: new Date().toISOString()
      };
      io.to('admin-room').emit('new-notification', fallbackNotif);
    }
    // Always update appointments list for admin
    io.emit('appointments-updated');
  });

  socket.on('booking-made', () => {
    io.emit('appointments-updated');
    console.log(`Booking made. Broadcasted 'appointments-updated' to all clients.`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Connect to Database first, then start listening
connectDB().then(async () => {
  if (global.dbConnected) {
    // Automatically seed default admin if none exists
    try {
      const Admin = require('./models/Admin');
      const count = await Admin.countDocuments({});
      if (count === 0) {
        const defaultAdmin = new Admin({
          name: 'Admin',
          email: 'admin@gmail.com',
          password: 'Admin@123',
          role: 'admin'
        });
        await defaultAdmin.save();
        console.log('Default Admin account created: admin@gmail.com / Admin@123');
      }
    } catch (seedErr) {
      console.error('Auto seeding default admin failed:', seedErr);
    }

    // Automatically seed default products if none exist
    try {
      const Product = require('./models/Product');
      
      // Update existing product entries in MongoDB to ensure correct images are used
      await Product.updateMany({ name: 'Luxe Beard Oil' }, { image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop' });
      await Product.updateMany({ name: 'Signature Pomade' }, { image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=800&auto=format&fit=crop' });
      await Product.updateMany({ name: 'Matte Clay' }, { image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop' });
      await Product.updateMany({ name: 'Invigorating Shampoo' }, { image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop' });
      await Product.updateMany({ name: 'Restorative Conditioner' }, { image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop' });
      await Product.updateMany({ name: 'Pre-Shave Oil' }, { image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop' });

      const count = await Product.countDocuments({});
      if (count === 0) {
        const defaultProducts = [
          {
            name: 'Luxe Beard Oil',
            price: 1200,
            image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
            description: 'Premium organic beard oil for a soft, conditioned beard.',
            category: 'Beard Care'
          },
          {
            name: 'Signature Pomade',
            price: 950,
            image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=800&auto=format&fit=crop',
            description: 'Medium hold with a natural shine finish. Washes out easily.',
            category: 'Hair Styling'
          },
          {
            name: 'Matte Clay',
            price: 1050,
            image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop',
            description: 'Strong hold, zero shine texturizing clay.',
            category: 'Hair Styling'
          },
          {
            name: 'Invigorating Shampoo',
            price: 800,
            image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop',
            description: 'Daily use shampoo with peppermint and tea tree extracts.',
            category: 'Hair Care'
          },
          {
            name: 'Restorative Conditioner',
            price: 850,
            image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop',
            description: 'Deep conditioning treatment to repair and strengthen.',
            category: 'Hair Care'
          },
          {
            name: 'Pre-Shave Oil',
            price: 700,
            image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop',
            description: 'Protects skin and softens stubble for a smooth shave.',
            category: 'Shaving'
          }
        ];
        await Product.insertMany(defaultProducts);
        console.log('Successfully seeded default products into MongoDB.');
      }
    } catch (productSeedErr) {
      console.error('Auto seeding default products failed:', productSeedErr);
    }

    // Automatically seed default coupons if none exist
    try {
      const Coupon = require('./models/Coupon');
      const couponCount = await Coupon.countDocuments({});
      if (couponCount === 0) {
        const defaultCoupons = [
          {
            code: 'WELCOME20',
            name: 'Welcome Offer',
            description: 'Get 20% off your first booking with us!',
            discountType: 'percentage',
            discountValue: 20,
            minBookingAmount: 300,
            maxDiscount: 500,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            usageLimit: 100,
            perUserLimit: 1,
            applicableServices: [],
            isActive: true
          },
          {
            code: 'MONSOON25',
            name: 'Monsoon Special',
            description: '25% off all facial treatments this season.',
            discountType: 'percentage',
            discountValue: 25,
            minBookingAmount: 500,
            maxDiscount: 750,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            usageLimit: 50,
            perUserLimit: 1,
            applicableServices: ['Facial', 'Face Mask'],
            isActive: true
          },
          {
            code: 'FLAT200',
            name: 'Flat ₹200 Off',
            description: 'Flat ₹200 discount on any booking above ₹999.',
            discountType: 'fixed',
            discountValue: 200,
            minBookingAmount: 999,
            maxDiscount: 200,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            usageLimit: 100,
            perUserLimit: 1,
            applicableServices: [],
            isActive: true
          }
        ];
        await Coupon.insertMany(defaultCoupons);
        console.log('Successfully seeded default coupons into MongoDB.');
      }
    } catch (couponSeedErr) {
      console.error('Auto seeding default coupons failed:', couponSeedErr);
    }

    // Automatically ensure all barbers have usernames and passwords set
    try {
      const Barber = require('./models/Barber');
      const barbers = await Barber.find({}).select('+password');
      if (barbers.length > 0) {
        for (const b of barbers) {
          let needsUpdate = false;

          if (!b.username || b.username === 'admin@gmail.com') {
            b.username = (b.email ? b.email.split('@')[0] : b.name.toLowerCase().replace(/\s+/g, '')).toLowerCase().trim();
            needsUpdate = true;
          }
          if (!b.password) {
            b.password = 'Staff@123';
            needsUpdate = true;
          }
          if (needsUpdate) {
            await b.save();
            console.log(`[Auto-Migration] Updated credentials for staff member: ${b.name} (username: ${b.username})`);
          }
        }
      }
    } catch (barberSeedErr) {
      console.error('Barber auto-migration failed:', barberSeedErr.message);
    }
  }

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Luxe Groom] ERROR: Port ${PORT} is already in use.`);
      console.error(`Run this to free it:  taskkill /F /PID $(netstat -ano | findstr :${PORT})`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    if (!global.dbConnected) {
      console.log(`[Luxe Groom Backend] Server started in database offline fallback mode.`);
    }
  });
}).catch(err => {
  console.error('Database connection failed', err);
});
