require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const nailPolishes = [
  {
    name: 'Lakmé Absolute Gel Stylist Nail Color',
    price: 350,
    description: 'High-shine gel finish nail color for a professional salon look at home.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Maybelline New York Color Show Nail Polish',
    price: 120,
    description: 'Chip-resistant, vibrant nail polish that dries quickly.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1625902120054-d31e9a285d85?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Nykaa Nail Enamel',
    price: 199,
    description: 'Stunning shades with a smooth, streak-free application.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1583241475880-d29b008d3e8e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'SUGAR Nail Lacquer',
    price: 249,
    description: 'Highly pigmented, fast-drying nail lacquer in bold shades.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1571781526291-c677f524e464?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'MARS Nail Enamel',
    price: 99,
    description: 'Affordable, long-lasting nail enamel available in a wide range of colors.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Swiss Beauty Nail Polish',
    price: 150,
    description: 'Smooth and shiny finish nail polish that lasts for days.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1512496015851-a1bfbcf7457a?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Colorbar Nail Lacquer',
    price: 299,
    description: 'Premium nail lacquer enriched with ingredients that prevent chipping.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Faces Canada Nail Enamel',
    price: 199,
    description: 'Rich, opaque finish in just one coat.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Elle 18 Nail Pops',
    price: 55,
    description: 'Fun, bright, and vibrant shades perfect for a playful mood.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Revlon Nail Enamel',
    price: 250,
    description: 'Classic nail enamel formulated with chip-defiant technology.',
    category: 'Nail Polish',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1585232070114-f06b6d859d07?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of nailPolishes) {
    const existing = await Product.findOne({ name: prod.name });
    if (!existing) {
      await Product.create(prod);
      console.log(`Added nail polish: ${prod.name}`);
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
