require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const eyeliners = [
  {
    name: 'Maybelline New York Colossal Bold Liner',
    price: 250,
    description: 'Smudge-proof, waterproof liquid eyeliner for bold and intense eyes.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1512496015851-a1bfbcf7457a?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Lakme 9 to 5 Eyeconic Liquid Eyeliner',
    price: 350,
    description: 'Long-lasting liquid eyeliner that stays up to 24 hours without smudging.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Kay Beauty Quick Dry Liquid Eyeliner',
    price: 600,
    description: 'Quick-drying, matte finish eyeliner enriched with natural ingredients.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1512495962295-827376c90530?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Nykaa Black Magic Liquid Eyeliner',
    price: 300,
    description: 'Intense black liquid eyeliner for precise and sharp winged looks.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1625902120054-d31e9a285d85?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Swiss Beauty Liquid Eyeliner',
    price: 200,
    description: 'Affordable, high-quality liquid eyeliner with a precise brush tip.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1583241475880-d29b008d3e8e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'SUGAR Gloss Boss 24HR Eyeliner',
    price: 400,
    description: 'Glossy finish eyeliner that lasts all day without fading or cracking.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'MARS Ink Black Eyeliner',
    price: 180,
    description: 'Ultra-pigmented black eyeliner for dramatic and bold eye makeup.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Faces Canada Magneteyes Color Eyeliner',
    price: 280,
    description: 'Vibrant color eyeliner with a smooth application and long-wearing formula.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Blue Heaven Get Bold Eyeliner',
    price: 120,
    description: 'Budget-friendly, bold and beautiful liquid eyeliner for everyday use.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1571781526291-c677f524e464?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'L’Oréal Paris Super Liner Eyeliner',
    price: 750,
    description: 'Premium liquid eyeliner for professional-grade precision and longevity.',
    category: 'Eye Liner',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of eyeliners) {
    const existing = await Product.findOne({ name: prod.name });
    if (!existing) {
      await Product.create(prod);
      console.log(`Added eyeliner: ${prod.name}`);
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
