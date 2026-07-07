require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Barber = require('./models/Barber');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas for verification.');
  
  const barbers = await Barber.find({});
  console.log('--- BARBERS ---');
  console.log('Count:', barbers.length);
  barbers.forEach(b => console.log(`- ID: ${b._id}, Name: ${b.name}, Email: ${b.email}, Status: ${b.status}, Role: ${b.role}`));
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Connection failed:', err);
});
