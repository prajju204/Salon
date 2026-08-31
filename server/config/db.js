const mongoose = require('mongoose');

const connectDB = async (retries = 30) => {
  const isVercelEnv = process.env.VERCEL || process.env.NOW_BUILDER;

  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    console.error('\n[ERROR] MONGODB_URI environment variable is missing.');
    if (isVercelEnv) {
      throw new Error('MONGODB_URI environment variable is missing.');
    }
    process.exit(1);
  }

  if (!mongoUri.startsWith('mongodb+srv://') && !mongoUri.startsWith('mongodb://')) {
    console.error('\n[ERROR] Invalid MONGODB_URI format.');
    if (isVercelEnv) {
      throw new Error('Invalid MONGODB_URI format.');
    }
    process.exit(1);
  }

  let currentRetry = 0;

  mongoose.connection.on('disconnected', () => {
    console.log('Database Disconnected');
    global.dbConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('Database Connected');
    global.dbConnected = true;
  });

  const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
  const maxRetries = isVercel ? 1 : retries;

  const connectWithRetry = async () => {
    try {
      if (currentRetry > 0) {
        console.log('Reconnecting...');
      }
      
      mongoose.set('bufferCommands', false);
      
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        autoIndex: false,
      });
      
      console.log(`Database Connected: ${conn.connection.host}`);
      global.dbConnected = true;
      currentRetry = 0; // reset retries on success
    } catch (error) {
      global.dbConnected = false;
      currentRetry++;
      
      console.error('\nConnection Failed');
      console.error(`Error details: ${error.message}\n`);

      if (currentRetry >= maxRetries) {
        console.error(`\n[FATAL] Exhausted ${maxRetries} connection retries.`);
        if (isVercel) {
          throw error; // Throw to reject promise so middleware returns error
        } else {
          process.exit(1);
        }
      } else {
        console.log(`Retrying in 5 seconds... (Attempt ${currentRetry} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await connectWithRetry();
      }
    }
  };

  await connectWithRetry();
};

module.exports = connectDB;
