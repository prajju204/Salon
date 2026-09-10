require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Service = require('./models/Service');

const haircutPhotos = {
  "Burst Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
  "Butch Cut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
  "Faux Hawk": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "Mohawk": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
  "Man Bun": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
  "Surfer Hair": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
  "Long Hair": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=800&auto=format&fit=crop&q=80",
  "Shag": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=800&auto=format&fit=crop&q=80",
  "Mullet": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80",
  "Bro Flow": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "Short Afro": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
  "Regulation Cut": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
  "Short Hair": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
  "Layered": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=800&auto=format&fit=crop&q=80",
  "V-Cut Buzz Cut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
  "Shadow Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
  "Taper Cut": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=80",
  "High and Tight": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
  "Brush Up": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop&q=80",
  "Razor Cut": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
  "Temple Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
  "Edgar Cut": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=800&auto=format&fit=crop&q=80",
  "Bowl Cut": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80"
};

async function updatePhotos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    for (const [styleName, imageUrl] of Object.entries(haircutPhotos)) {
      const result = await Service.updateMany(
        { name: styleName, category: 'Haircut' },
        { $set: { image: imageUrl } }
      );
      console.log(`Updated "${styleName}" haircut: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }

    console.log('All haircut photos updated successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error updating photos:', err);
    mongoose.connection.close();
  }
}

updatePhotos();
