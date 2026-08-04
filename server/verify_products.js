require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas for product verification.');
  
  const products = await Product.find({});
  console.log('--- PRODUCTS ---');
  console.log('Count:', products.length);
  products.forEach(p => console.log(`- ID: ${p._id}, Name: ${p.name}, Price: ${p.price}, Category: ${p.category}`));
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Connection failed:', err);
});
