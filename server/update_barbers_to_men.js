require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Barber = require('./models/Barber');

const maleBarberPhotos = {
  "Shrisiddhi": {
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Shravan": {
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Sharath": {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Dheeraj": {
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Aneesh": {
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Ayush": {
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Darshan": {
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Deepak": {
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Sanath": {
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Adarsh": {
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop",
    gender: "Male"
  },
  "Nishanth": {
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop",
    gender: "Male"
  }
};

async function updateBarbers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    for (const [name, updateData] of Object.entries(maleBarberPhotos)) {
      const result = await Barber.updateOne(
        { name: name },
        { $set: { image: updateData.image, gender: updateData.gender } }
      );
      console.log(`Updated Barber "${name}" to male portrait: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }

    console.log('All barbers updated successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error updating barbers:', err);
    mongoose.connection.close();
  }
}

updateBarbers();
