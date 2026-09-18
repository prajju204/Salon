require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Barber = require('./models/Barber');

const femaleStaffList = [
  {
    name: 'Arpitha',
    email: 'arpitha@luxegroom.com',
    role: 'Creative Stylist',
    gender: 'Female',
    mobileNumber: '+919876540101',
    specialization: 'Layered Styling, Hair Spa',
    experienceYears: 5,
    salary: 55000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop',
    skills: ['Layered Cuts', 'Styling', 'Facials']
  },
  {
    name: 'Anagha',
    email: 'anagha@luxegroom.com',
    role: 'Creative Stylist',
    gender: 'Female',
    mobileNumber: '+919876540102',
    specialization: 'Hair Coloring, Styling',
    experienceYears: 4,
    salary: 50000,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
    skills: ['Hair Coloring', 'Styling']
  },
  {
    name: 'Ankitha',
    email: 'ankitha@luxegroom.com',
    role: 'Master Stylist',
    gender: 'Female',
    mobileNumber: '+919876540103',
    specialization: 'Facials, Bridal Styling',
    experienceYears: 7,
    salary: 65000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
    skills: ['Facials', 'Bridal Styling']
  },
  {
    name: 'Pooja',
    email: 'pooja@luxegroom.com',
    role: 'Color Specialist',
    gender: 'Female',
    mobileNumber: '+919876540104',
    specialization: 'Highlights, Balayage',
    experienceYears: 4,
    salary: 50000,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop',
    skills: ['Hair Coloring', 'Bleaching', 'Toning']
  },
  {
    name: 'Shreya',
    email: 'shreya@luxegroom.com',
    role: 'Barber Stylist',
    gender: 'Female',
    mobileNumber: '+919876540105',
    specialization: 'Women Haircuts',
    experienceYears: 3,
    salary: 40000,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop',
    skills: ['Haircuts', 'Styling']
  },
  {
    name: 'Prajna',
    email: 'prajna@luxegroom.com',
    role: 'Dermatology & Skin Expert',
    gender: 'Female',
    mobileNumber: '+919876540106',
    specialization: 'Executive Spa Facials, Skin Therapy',
    experienceYears: 6,
    salary: 60000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop',
    skills: ['Spa Treatments', 'Facial Massages']
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected.');
  
  for (const staff of femaleStaffList) {
    const existing = await Barber.findOne({ email: staff.email });
    if (!existing) {
      await Barber.create(staff);
      console.log(`Added: ${staff.name}`);
    } else {
      console.log(`Skipped existing: ${staff.name}`);
    }
  }

  mongoose.disconnect();
  console.log('Done.');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
