require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas.');
  
  const db = mongoose.connection.db;
  
  const coupons = await db.collection('coupons').find({}).toArray();
  console.log('All coupons:', JSON.stringify(coupons, null, 2));
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Connection failed:', err);
});
