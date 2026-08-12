require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Service = require('./models/Service');

async function increasePrices() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // We can use Mongoose's updateMany with aggregation pipeline to multiply prices by 20
    const result = await Service.updateMany({}, [
      { $set: { price: { $multiply: ["$price", 20] } } }
    ]);

    console.log(`Successfully updated ${result.modifiedCount} services!`);

    // Log the new prices
    const services = await Service.find({}).select('name price');
    console.log('\nNew Service Prices:');
    services.forEach(s => {
      console.log(`- ${s.name}: ₹${s.price}`);
    });

    mongoose.connection.close();
  } catch (err) {
    console.error('Error increasing prices:', err);
    mongoose.connection.close();
  }
}

increasePrices();
