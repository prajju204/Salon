const app = require('../server/app');
const mongoose = require('mongoose');

let cachedDbPromise = null;

const ensureDbConnected = async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    global.dbConnected = true;
    return next();
  }
  
  if (!cachedDbPromise) {
    const connectDB = require('../server/config/db');
    // Call connectDB with 2 retries to prevent long hangs in serverless function
    cachedDbPromise = connectDB(2);
  }
  
  try {
    await cachedDbPromise;
    global.dbConnected = true;
    next();
  } catch (err) {
    console.error('Database connection error in middleware:', err);
    cachedDbPromise = null; // Reset so next request retries
    res.status(500).json({ success: false, message: 'Database connection failed: ' + err.message });
  }
};

// Use database connection middleware for all api requests
app.use(ensureDbConnected);

module.exports = app;
