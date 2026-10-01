const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const collection = mongoose.connection.db.collection('barbers');
    
    const result = await collection.updateOne(
      { name: 'Dr. Sameer Verma, MD' },
      { $set: { image: '/dr_sameer.png' } }
    );
    
    console.log('Update result:', result);
    console.log('Successfully updated Dr. Sameer Verma avatar!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
run();
