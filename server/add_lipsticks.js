require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const lipsticks = [
  {
    name: 'Maybelline New York Super Stay Matte Ink',
    price: 650,
    description: 'Flawless matte finish with up to 16 hours of wear. Intensely pigmented.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Lakmé 9 to 5 Primer + Matte Lip Color',
    price: 500,
    description: 'Built-in primer for a smooth, long-lasting matte finish that stays 9 to 5.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1585232070114-f06b6d859d07?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'M.A.C Matte Lipstick',
    price: 1950,
    description: 'The iconic lipstick that made M.A.C famous. Rich, creamy matte finish.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'L’Oréal Paris Rouge Signature',
    price: 800,
    description: 'Lightweight matte lip ink that delivers intense pigment with a weightless feel.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Kay Beauty Matte Drama Long Stay Lipstick',
    price: 999,
    description: 'Luxurious matte texture enriched with grapeseed oil for hydrated lips.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Nykaa Matte To Last Liquid Lipstick',
    price: 599,
    description: 'Feather-light liquid lipstick offering an intense, transfer-proof matte finish.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Sugar Cosmetics Matte As Hell Crayon Lipstick',
    price: 799,
    description: 'Bold, highly pigmented lip crayon with a silky matte finish.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Swiss Beauty Non Transfer Matte Lipstick',
    price: 250,
    description: 'Affordable, long-lasting, smudge-proof matte lipstick for everyday wear.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Faces Canada Comfy Matte Lip Color',
    price: 399,
    description: 'Comfortable matte liquid lip color infused with almond oil and vitamin E.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1512495962295-827376c90530?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Colorbar Velvet Matte Lipstick',
    price: 350,
    description: 'Classic velvet matte lipstick enriched with Vitamin E for soft, vibrant lips.',
    category: 'Lipsticks',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1583241475880-d29b008d3e8e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of lipsticks) {
    const existing = await Product.findOne({ name: prod.name });
    if (!existing) {
      await Product.create(prod);
      console.log(`Added lipstick: ${prod.name}`);
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
