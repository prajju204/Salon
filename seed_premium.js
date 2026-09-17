require('dotenv').config({ path: require('path').resolve(__dirname, 'server', '.env') });
const mongoose = require('mongoose');

const premiumServices = [
  {
    name: 'Hair Transplant',
    duration: 180,
    price: 65000,
    category: 'Premium Services',
    icon: 'medical_services',
    image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop',
    status: 'Active',
    description: 'Advanced micro-follicular hair restoration procedure delivered by certified trichologists & clinical surgeons. Includes doctor consultation & post-op follow-up.'
  },
  {
    name: 'LED Therapy',
    duration: 45,
    price: 2000,
    category: 'Premium Services',
    icon: 'lightbulb',
    image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop',
    status: 'Active',
    description: 'Targeted scalp photon LED light therapy to stimulate hair follicle rejuvenation and cellular repair under specialist doctor guidance.'
  },
  {
    name: 'Deep Conditioning',
    duration: 60,
    price: 3000,
    category: 'Premium Services',
    icon: 'spa',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop',
    status: 'Active',
    description: 'Intense peptide keratin moisture infusion mask that restores fiber elasticity and silky luxury.'
  },
  {
    name: 'Hot Oil Treatment',
    duration: 45,
    price: 5000,
    category: 'Premium Services',
    icon: 'opacity',
    image: 'https://images.unsplash.com/photo-1608248597359-281b94d1b747?w=500&auto=format&fit=crop',
    status: 'Active',
    description: 'Warm botanical essential oils massage and steaming session for deep root nourishment.'
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const collection = mongoose.connection.db.collection('services');
  for (const s of premiumServices) {
    await collection.updateOne({ name: s.name }, { $set: s }, { upsert: true });
    console.log('Saved service:', s.name, 'Price:', s.price);
  }
  console.log('All premium services successfully added to database!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
