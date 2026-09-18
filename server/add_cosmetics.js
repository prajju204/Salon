require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const cosmetics = [
  {
    name: 'Premium Matte Nail Polish',
    price: 450,
    description: 'Long-lasting, chip-resistant matte nail polish with a smooth finish.',
    category: 'Cosmetics',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Waterproof Precision Eye Liner',
    price: 600,
    description: 'Smudge-proof, waterproof liquid eye liner for the perfect wing.',
    category: 'Cosmetics',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Flawless Liquid Foundation',
    price: 1500,
    description: 'Full coverage liquid foundation for a flawless, natural look that lasts all day.',
    category: 'Cosmetics',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1590156546946-cb554ea8831f?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Velvet Matte Lipstick',
    price: 850,
    description: 'Highly pigmented velvet matte lipstick that hydrates your lips.',
    category: 'Cosmetics',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of cosmetics) {
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
