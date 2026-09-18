require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  await Product.updateOne({ name: 'Premium Matte Nail Polish' }, { $set: { category: 'Nail Polish' } });
  await Product.updateOne({ name: 'Waterproof Precision Eye Liner' }, { $set: { category: 'Eye Liner' } });
  await Product.updateOne({ name: 'Flawless Liquid Foundation' }, { $set: { category: 'Foundations' } });
  await Product.updateOne({ name: 'Velvet Matte Lipstick' }, { $set: { category: 'Lipsticks' } });

  console.log('Updated cosmetic categories.');
  mongoose.disconnect();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
