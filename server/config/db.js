const mongoose = require('mongoose');

const connectDB = async (retries = 30) => {
  if (!process.env.MONGODB_URI) {
    console.error('\n[ERROR] MONGODB_URI environment variable is missing.');
    console.error('Please add it to your .env file in the following format:');
    console.error('MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/salon\n');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI.startsWith('mongodb+srv://') && !process.env.MONGODB_URI.startsWith('mongodb://')) {
    console.error('\n[ERROR] Invalid MONGODB_URI format. Must start with mongodb:// or mongodb+srv://\n');
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

  const connectWithRetry = async () => {
    try {
      if (currentRetry > 0) {
        console.log('Reconnecting...');
      }
      
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      
      console.log(`Database Connected: ${conn.connection.host}`);
      global.dbConnected = true;
      currentRetry = 0; // reset retries on success
    } catch (error) {
      global.dbConnected = false;
      currentRetry++;
      
      console.error('\nConnection Failed');
      console.error('Unable to connect to MongoDB Atlas.');
      console.error('Possible reasons:');
      console.error('• Internet connection unavailable');
      console.error('• Current IP is not whitelisted');
      console.error('• Invalid MongoDB URI');
      console.error('• Atlas cluster is paused or unavailable\n');
      console.error(`Error details: ${error.message}\n`);

      if (currentRetry >= retries) {
        console.error(`\n[FATAL] Exhausted ${retries} connection retries. Exiting gracefully.`);
        process.exit(1);
      } else {
        console.log(`Retrying in 5 seconds... (Attempt ${currentRetry} of ${retries})`);
        setTimeout(connectWithRetry, 5000);
      }
    }
  };

  await connectWithRetry();
};

module.exports = connectDB;
