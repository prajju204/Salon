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
  
  socket.on('join', (role) => {
    if (role === 'admin') {
      socket.join('admin-room');
      console.log(`Admin joined room: ${socket.id}`);
    }
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
