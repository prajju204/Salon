require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Customer = require('./models/Customer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas.');
  
  // Check if customer already exists
  const existing = await Customer.findOne({ email: 'prajwaldp03@gmail.com' });
  if (existing) {
    console.log('Customer with email prajwaldp03@gmail.com already exists:', existing);
  } else {
    // Create new customer
    const newCustomer = new Customer({
      fullName: 'Prajwal',
      email: 'prajwaldp03@gmail.com',
      mobile: '9999999999',
      password: 'Password123', // Will be hashed by mongoose pre-save hook
      role: 'customer'
    });
    
    await newCustomer.save();
    console.log('Customer prajwaldp03@gmail.com successfully created!');
  }

  mongoose.connection.close();
}).catch(err => {
  console.error('Failed to create customer:', err);
});
