require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const foundations = [
  {
    name: 'Maybelline Fit Me Matte + Poreless Foundation',
    price: 600,
    description: 'Mattifies and refines pores, matching natural tone for a seamless finish.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Lakmé Absolute Skin Natural Mousse',
    price: 750,
    description: 'Feather-light mousse that easily blends into your skin for a natural, flawless look.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1625902120054-d31e9a285d85?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'L’Oréal Paris True Match Foundation',
    price: 899,
    description: 'Super-blendable foundation that matches your skin tone and texture perfectly.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1583241475880-d29b008d3e8e?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Kay Beauty Hydrating Foundation',
    price: 1200,
    description: 'Deeply hydrating, weightless foundation that offers a dewy finish.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1571781526291-c677f524e464?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'M.A.C Studio Fix Fluid Foundation',
    price: 2900,
    description: 'A modern foundation that combines a natural matte finish and broad spectrum protection.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'SUGAR Ace of Face Foundation Stick',
    price: 999,
    description: 'Full-coverage, long-wear foundation stick with a built-in brush for easy blending.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1512496015851-a1bfbcf7457a?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Nykaa SKINgenius Foundation',
    price: 575,
    description: 'Adapts to your unique skin color and provides a luminous finish.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Swiss Beauty High Coverage Foundation',
    price: 399,
    description: 'Waterproof foundation that gives you high coverage without feeling heavy.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  },
  {
    name: 'Colorbar 24H Weightless Foundation',
    price: 850,
    description: 'An innovative weightless foundation offering up to 24 hours of wear.',
    category: 'Foundations',
    gender: 'Female',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop',
    stockStatus: 'In Stock'
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const prod of foundations) {
    const existing = await Product.findOne({ name: prod.name });
    if (!existing) {
      await Product.create(prod);
      console.log(`Added foundation: ${prod.name}`);
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
