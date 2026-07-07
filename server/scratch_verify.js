require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Customer = require('./models/Customer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas for verification.');
  
  const admins = await Admin.find({});
  console.log('--- ADMINS ---');
  console.log('Count:', admins.length);
  admins.forEach(a => console.log(`- Email: ${a.email}, Role: ${a.role}, Name: ${a.name}`));

  const customers = await Customer.find({});
  console.log('--- CUSTOMERS ---');
  console.log('Count:', customers.length);
  customers.forEach(c => console.log(`- Email: ${c.email}, Role: ${c.role}, Name: ${c.fullName || c.name}`));
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Connection failed:', err);
});
