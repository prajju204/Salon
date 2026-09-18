require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: Number, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Both'], default: 'Both' },
  icon: { type: String, default: 'content_cut' },
  image: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  description: { type: String, required: true }
}, { timestamps: true });

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

const womensHairStyles = [
  {
    name: 'Classic Ponytail',
    duration: 30,
    price: 800,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Sleek and timeless classic ponytail styled for smooth, polished elegance.'
  },
  {
    name: 'Loose Waves',
    duration: 45,
    price: 1200,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Soft, effortless loose waves providing natural volume and romantic texture.'
  },
  {
    name: 'Messy Bun',
    duration: 35,
    price: 900,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Chic and casual messy updo crafted with face-framing tendrils.'
  },
  {
    name: 'Three-Strand Braid',
    duration: 30,
    price: 700,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Traditional neat or textured three-strand braided style for a sophisticated finish.'
  },
  {
    name: 'Pixie Cut',
    duration: 45,
    price: 1400,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Bold, short pixie cut precision tailored to accentuate facial features.'
  },
  {
    name: 'Blunt Bob',
    duration: 50,
    price: 1500,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Sharp, modern blunt bob cut with clean edges and smooth styling finish.'
  },
  {
    name: 'Textured Lob',
    duration: 50,
    price: 1600,
    category: 'Hair Style',
    gender: 'Female',
    icon: 'content_cut',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&auto=format&fit=crop&q=80',
    status: 'Active',
    description: 'Shoulder-length textured long bob (lob) filled with movement and dimension.'
  }
];

async function addWomensHairStyles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');

    for (const style of womensHairStyles) {
      const existing = await Service.findOne({ name: style.name, gender: 'Female' });
      if (existing) {
        console.log(`Updating existing service: ${style.name}`);
        await Service.updateOne({ _id: existing._id }, style);
      } else {
        console.log(`Adding new service: ${style.name}`);
        await Service.create(style);
      }
    }

    console.log('All 7 Women\'s Hair Styles added/updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error adding hair styles:', err);
    process.exit(1);
  }
}

addWomensHairStyles();
