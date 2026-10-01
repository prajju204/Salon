const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const Service = require('./models/Service');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://prajwaldp03_db_user:prajwal%402004@salon.sojqp2o.mongodb.net/luxe_groom?retryWrites=true&w=majority&appName=Salon";

const newServices = [
  {
    name: "Gold Facial",
    duration: 60,
    price: 1500,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500",
    description: "Premium gold facial for a radiant and glowing complexion.",
    status: "Active"
  },
  {
    name: "Pearl Facial",
    duration: 60,
    price: 1200,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=500",
    description: "Pearl facial treatment to brighten skin and reduce tan.",
    status: "Active"
  },
  {
    name: "Saffron Facial",
    duration: 60,
    price: 1300,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=500",
    description: "Saffron infused facial for natural glow and blemish reduction.",
    status: "Active"
  },
  {
    name: "Sandalwood Facial",
    duration: 45,
    price: 1000,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=500",
    description: "Cooling sandalwood facial to soothe and rejuvenate the skin.",
    status: "Active"
  },
  {
    name: "Herbal Facial",
    duration: 45,
    price: 800,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=500",
    description: "100% natural herbal facial for sensitive and acne-prone skin.",
    status: "Active"
  },
  {
    name: "Papaya Facial",
    duration: 45,
    price: 900,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=500",
    description: "Papaya enriched facial for deep cleansing and pigmentation removal.",
    status: "Active"
  },
  {
    name: "Fruit Facial",
    duration: 45,
    price: 850,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=500",
    description: "Fresh fruit extracts to hydrate and nourish the skin.",
    status: "Active"
  },
  {
    name: "De-Tan Facial",
    duration: 60,
    price: 1100,
    category: "Facials",
    gender: "Female",
    icon: "face_retouching_natural",
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=500",
    description: "Specialized De-Tan facial to remove sun damage and restore natural tone.",
    status: "Active"
  }
];

const seedServices = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected for Seeding Facials...');

    // Optionally you could check if they already exist, but here we just insert them directly
    for (const serviceData of newServices) {
      const exists = await Service.findOne({ name: serviceData.name, gender: 'Female' });
      if (!exists) {
        await Service.create(serviceData);
        console.log(`Added: ${serviceData.name}`);
      } else {
        console.log(`Already exists: ${serviceData.name}`);
      }
    }

    console.log('Finished adding facials!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding:', error);
    process.exit(1);
  }
};

seedServices();
