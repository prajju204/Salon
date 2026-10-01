const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Service = require('./models/Service');
const MONGODB_URI = process.env.MONGODB_URI;

const fixCategories = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await Service.updateMany(
      { category: 'Facials', gender: 'Female' },
      { $set: { category: 'Facial' } }
    );
    
    console.log(`Updated ${result.modifiedCount} services from 'Facials' to 'Facial'.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixCategories();
