const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const doctors = [
  {
    name: 'Dr. Sameer Verma, MD',
    role: 'Chief Trichologist & Surgeon',
    specialization: 'Hair Restoration & Clinical Scalp Therapy',
    experienceYears: 14,
    mobileNumber: '9876543210',
    email: 'dr.verma@luxegroom.com',
    status: 'Active',
    isDoctor: true,
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop',
    skills: ['Hair Transplant', 'LED Therapy', 'Clinical Trichology', 'Premium Services']
  },
  {
    name: 'Dr. Ananya Roy, MBBS, DVD',
    role: 'Dermatologist & Scalp Specialist',
    specialization: 'Laser & Regenerative Hair Treatments',
    experienceYears: 10,
    mobileNumber: '9876543211',
    email: 'dr.roy@luxegroom.com',
    status: 'Active',
    isDoctor: true,
    image: 'https://images.unsplash.com/photo-1594824813583-02f2323e01a8?w=500&auto=format&fit=crop',
    skills: ['LED Therapy', 'Deep Conditioning', 'Hot Oil Treatment', 'Scalp Dermatology', 'Premium Services']
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const collection = mongoose.connection.db.collection('barbers');
  for (const d of doctors) {
    await collection.updateOne({ name: d.name }, { $set: d }, { upsert: true });
    console.log('Saved specialist doctor:', d.name);
  }
  console.log('Specialist doctors successfully added!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
