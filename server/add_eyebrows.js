const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Service = require('./models/Service');
const MONGODB_URI = process.env.MONGODB_URI;

const newServices = [
  {
    name: "Classic Eyebrow Shaping",
    duration: 15,
    price: 300,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=500",
    description: "Classic eyebrow shaping tailored to your natural brow line.",
    status: "Active"
  },
  {
    name: "Soft Arch",
    duration: 15,
    price: 350,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1583001859600-d636db24ce85?auto=format&fit=crop&w=500",
    description: "Gentle soft arch styling for a more relaxed and feminine look.",
    status: "Active"
  },
  {
    name: "High Arch",
    duration: 15,
    price: 350,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500",
    description: "Dramatic high arch eyebrow styling to open up the eyes.",
    status: "Active"
  },
  {
    name: "Straight Brows",
    duration: 15,
    price: 300,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=500",
    description: "Korean-inspired straight brow look for a youthful appearance.",
    status: "Active"
  },
  {
    name: "Rounded Brows",
    duration: 15,
    price: 300,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=500",
    description: "Soft rounded brows to complement angular facial features.",
    status: "Active"
  },
  {
    name: "Feathered Brows",
    duration: 20,
    price: 450,
    category: "Eye Brow",
    gender: "Female",
    icon: "content_cut",
    image: "https://images.unsplash.com/photo-1563223610-86716021d51c?auto=format&fit=crop&w=500",
    description: "Trendy feathered eyebrow styling for a fuller, natural look.",
    status: "Active"
  }
];

const seedEyebrows = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    for (const svc of newServices) {
      const exists = await Service.findOne({ name: svc.name, gender: 'Female' });
      if (!exists) {
        await Service.create(svc);
        console.log(`Added: ${svc.name}`);
      } else {
        console.log(`Already exists: ${svc.name}`);
      }
    }
    
    console.log('Eyebrow styles added successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedEyebrows();
