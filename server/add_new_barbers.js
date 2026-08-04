require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const mongoose = require('mongoose');
const Barber = require('./models/Barber');

const newStaffList = [
  {
    name: 'Shrisiddhi',
    email: 'shrisiddhi@luxegroom.com',
    role: 'Creative Stylist',
    gender: 'Female',
    mobileNumber: '+919876540001',
    specialization: 'Layered Styling, Hair Spa',
    experienceYears: 5,
    salary: 55000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop',
    skills: ['Layered Cuts', 'Styling', 'Facials']
  },
  {
    name: 'Shravan',
    email: 'shravan@luxegroom.com',
    role: 'Barber Stylist',
    gender: 'Male',
    mobileNumber: '+919876540002',
    specialization: 'Fades, Hair Coloring',
    experienceYears: 3,
    salary: 40000,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop',
    skills: ['Traditional Fade', 'Shaving', 'Hair Styling']
  },
  {
    name: 'Sharath',
    email: 'sharath@luxegroom.com',
    role: 'Master Barber',
    gender: 'Male',
    mobileNumber: '+919876540003',
    specialization: 'Beard Sculpting, Razor Work',
    experienceYears: 8,
    salary: 70000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    skills: ['Beard Sculpting', 'Straight Shave', 'Scissors Cuts']
  },
  {
    name: 'Dheeraj',
    email: 'dheeraj@luxegroom.com',
    role: 'Creative Stylist',
    gender: 'Male',
    mobileNumber: '+919876540004',
    specialization: 'Modern Faux Hawk, Shag Cuts',
    experienceYears: 4,
    salary: 48000,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=150&auto=format&fit=crop',
    skills: ['Modern Styling', 'Hair Texturizing']
  },
  {
    name: 'Aneesh',
    email: 'aneesh@luxegroom.com',
    role: 'Dermatology & Skin Expert',
    gender: 'Male',
    mobileNumber: '+919876540005',
    specialization: 'Executive Spa Facials, Skin Therapy',
    experienceYears: 6,
    salary: 60000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=150&auto=format&fit=crop',
    skills: ['Spa Treatments', 'Facial Massages', 'Dermaplaning']
  },
  {
    name: 'Ayush',
    email: 'ayush@luxegroom.com',
    role: 'Color Specialist',
    gender: 'Male',
    mobileNumber: '+919876540006',
    specialization: 'Highlights, Balayage, Creative Colors',
    experienceYears: 5,
    salary: 50000,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=150&auto=format&fit=crop',
    skills: ['Hair Coloring', 'Bleaching', 'Toning']
  },
  {
    name: 'Darshan',
    email: 'darshan@luxegroom.com',
    role: 'Barber Stylist',
    gender: 'Male',
    mobileNumber: '+919876540007',
    specialization: 'Buzz Cuts, Head Shaves',
    experienceYears: 4,
    salary: 42000,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop',
    skills: ['Buzz Cut', 'Hot Towel Treatment', 'Beard Lining']
  },
  {
    name: 'Deepak',
    email: 'deepak@luxegroom.com',
    role: 'Creative Stylist',
    gender: 'Male',
    mobileNumber: '+919876540008',
    specialization: 'Taper Fade, Under-cuts',
    experienceYears: 5,
    salary: 52000,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop',
    skills: ['Taper Fade', 'Shear Styling', 'Men Perms']
  },
  {
    name: 'Sanath',
    email: 'sanath@luxegroom.com',
    role: 'Master Barber',
    gender: 'Male',
    mobileNumber: '+919876540009',
    specialization: 'Classic Pompadour, Traditional Shaving',
    experienceYears: 9,
    salary: 75000,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop',
    skills: ['Pompadour Styling', 'Razor Shave', 'Client Care']
  },
  {
    name: 'Adarsh',
    email: 'adarsh@luxegroom.com',
    role: 'Barber Stylist',
    gender: 'Male',
    mobileNumber: '+919876540010',
    specialization: 'Mullet cuts, Temple Fade',
    experienceYears: 4,
    salary: 43000,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    skills: ['Mullet Cuts', 'Temple Fade', 'Beard Detailing']
  },
  {
    name: 'Nishanth',
    email: 'nishanth@luxegroom.com',
    role: 'Color Specialist',
    gender: 'Male',
    mobileNumber: '+919876540011',
    specialization: 'Gray Blending, Keratin Treatment',
    experienceYears: 6,
    salary: 56000,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=150&auto=format&fit=crop',
    skills: ['Hair Treatments', 'Keratin Therapy', 'Coloring']
  }
];

async function addStaff() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    let addedCount = 0;
    for (const staff of newStaffList) {
      // Check if email already exists to prevent duplicate key errors
      const exists = await Barber.findOne({ email: staff.email });
      if (exists) {
        console.log(`Staff "${staff.name}" (${staff.email}) already exists in DB. Skipping.`);
        continue;
      }

      const empId = `EMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
      const barber = new Barber({
        ...staff,
        password: 'password123', // Will be auto-hashed by schema pre-save hook
        employeeId: empId,
        workingTime: '09:00 AM - 05:00 PM',
        availableWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availability: { 'Monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
        status: 'Active'
      });

      await barber.save();
      console.log(`Successfully added Staff: ${staff.name} as ${staff.role}`);
      addedCount++;
    }

    console.log(`Finished adding staff! Inserted ${addedCount} new barbers.`);
    mongoose.connection.close();
  } catch (err) {
    console.error('Error adding staff:', err);
    mongoose.connection.close();
  }
}

addStaff();
