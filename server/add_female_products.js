require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const femaleProducts = [
  {
    name: 'Moroccan Argan Hair Oil',
    price: 1200,
    description: 'Deep nourishing argan oil for silky, smooth, and frizz-free hair.',
    category: 'Hair Care',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1608248593842-83b6329c42c9?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Keratin Smoothing Shampoo',
    price: 850,
    description: 'Professional grade keratin shampoo for damaged and chemically treated hair.',
    category: 'Hair Care',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1590159495048-a006c6020593?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Volumizing Sea Salt Spray',
    price: 650,
    description: 'Add instant volume and texture for natural-looking beachy waves.',
    category: 'Hair Styling',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1556228578-877292211ea7?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Thermal Protection Hair Serum',
    price: 950,
    description: 'Heat protectant serum that guards hair against styling tools and UV damage.',
    category: 'Hair Care',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Hold & Shine Hairspray',
    price: 700,
    description: 'Long-lasting flexible hold hairspray with a glossy finish.',
    category: 'Hair Styling',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of femaleProducts) {
    const existing = await Product.findOne({ name: prod.name });
    if (!existing) {
      await Product.create(prod);
      console.log(`Added product: ${prod.name}`);
    } else {
      console.log(`Skipped existing: ${prod.name}`);
    }
  }

  mongoose.disconnect();
  console.log('Done.');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
