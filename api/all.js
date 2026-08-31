const app = require('../server/app');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to prefer IPv4 DNS resolution (prevents IPv6 connection timeout on Vercel)
dns.setDefaultResultOrder('ipv4first');

let cachedDbPromise = null;

const ensureDbConnected = async (req, res, next) => {
  if (req.path.includes('test-env') || req.path.includes('test-tcp')) {
    return next();
  }

  if (mongoose.connection.readyState === 1) {
    global.dbConnected = true;
    return next();
  }
  
  const isVercelEnv = process.env.VERCEL || process.env.NOW_BUILDER;
  const connectDB = require('../server/config/db');

  try {
    if (isVercelEnv) {
      // Connect fresh on Vercel to prevent caching dead/frozen promises
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
    cachedDbPromise = null; // Reset so next request retries
    global.dbConnected = false;
    next(); // Move to offline database interceptor instead of crashing/timing out!
  }
};

// Use database connection middleware for all api requests
app.use(ensureDbConnected);

module.exports = app;
