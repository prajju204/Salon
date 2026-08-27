require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Setting = require('../models/Setting');
const Role = require('../models/Role');
const ActivityLog = require('../models/ActivityLog');

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/salon');
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await Admin.deleteMany({});
    await Customer.deleteMany({});
    await Barber.deleteMany({});
    await Service.deleteMany({});
    await Appointment.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    await Payment.deleteMany({});
    await Invoice.deleteMany({});
    await Setting.deleteMany({});
    await Role.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('Database cleared.');

    // Seed Roles
    const adminRole = await Role.create({ name: 'admin', permissions: ['all'] });
    const customerRole = await Role.create({ name: 'customer', permissions: ['read', 'book'] });

    // Seed Settings
    await Setting.create({ key: 'salonName', value: 'Luxe Groom' });
    await Setting.create({ key: 'theme', value: 'dark' });

    // Seed Admin
    const admin = new Admin({
      name: 'Admin',
      email: 'admin@gmail.com',
      password: 'Admin@123', // Will be hashed automatically
      role: 'admin'
    });
    await admin.save();
    console.log('Admin seeded: admin@gmail.com / Admin@123');

    // Seed Customer
    const customer = new Customer({
      fullName: 'James Mercer',
      email: 'customer@luxegroom.com',
      mobile: '+919876543210',
      password: 'customer123', // Will be hashed automatically
      role: 'customer'
    });
    await customer.save();
    console.log('Customer seeded: customer@luxegroom.com / customer123');

    // Seed Barbers
    const newStaffList = [
      {
        name: 'Prajwal',
        email: 'prajwal@gmail.com',
        role: 'Creative Stylist',
        gender: 'Male',
        mobileNumber: '+919876540000',
        specialization: 'Fades, Beard Detailing',
        experienceYears: 4,
        salary: 50000,
        rating: 5.0,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
        skills: ['Haircut', 'Beard Trim']
      },
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

    const barbers = newStaffList.map((staff, idx) => ({
      ...staff,
      password: 'password123',
      employeeId: `EMP-${Date.now().toString().slice(-6)}-${idx}`,
      workingTime: '09:00 AM - 05:00 PM',
      availableWorkingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availability: { 'Monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] },
      status: 'Active',
      revenue: (2000.0 + (idx % 3) * 500.0),
      completedBookings: 80 + (idx % 5) * 15,
      activeDays: 4 + (idx % 2)
    }));

    const seededBarbers = await Barber.insertMany(barbers);
    console.log(`${seededBarbers.length} barbers seeded.`);

    // Seed Services
    const haircutStyles = [
      "Burst Fade", "Butch Cut", "Faux Hawk", "Mohawk", "Man Bun",
      "Surfer Hair", "Long Hair", "Shag", "Mullet", "Bro Flow",
      "Short Afro", "Regulation Cut", "Short Hair", "Layered",
      "V-Cut Buzz Cut", "Shadow Fade", "Taper Cut", "High and Tight",
      "Brush Up", "Razor Cut", "Temple Fade", "Edgar Cut", "Bowl Cut"
    ];

    const haircutPhotos = {
      "Burst Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop",
      "Butch Cut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop",
      "Faux Hawk": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&auto=format&fit=crop",
      "Mohawk": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop",
      "Man Bun": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop",
      "Surfer Hair": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop",
      "Long Hair": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=500&auto=format&fit=crop",
      "Shag": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=500&auto=format&fit=crop",
      "Mullet": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop",
      "Bro Flow": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop",
      "Short Afro": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop",
      "Regulation Cut": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop",
      "Short Hair": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop",
      "Layered": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=500&auto=format&fit=crop",
      "V-Cut Buzz Cut": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop",
      "Shadow Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop",
      "Taper Cut": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop",
      "High and Tight": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop",
      "Brush Up": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop",
      "Razor Cut": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&auto=format&fit=crop",
      "Temple Fade": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&auto=format&fit=crop",
      "Edgar Cut": "https://images.unsplash.com/photo-1605497746444-ac9dbd3d4401?w=500&auto=format&fit=crop",
      "Bowl Cut": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop"
    };

    const defaultHaircuts = haircutStyles.map((style, idx) => ({
      name: style,
      duration: 30 + (idx % 3) * 15, // 30, 45, 60 mins
      price: (35.0 + (idx % 4) * 5.0) * 20, // ₹700, ₹800, ₹900, ₹1000
      category: 'Haircut',
      icon: 'content_cut',
      image: haircutPhotos[style] || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop',
      description: `A professional ${style} haircut tailored to your styling preferences.`
    }));

    const beardStyles = [
      "Heavy Stubble", "Short Boxed Beard", "Corporate Beard", "Full Beard",
      "Beard Fade", "Balbo Beard", "Van Dyke Beard", "Goatee", "Anchor Beard"
    ];

    const defaultBeards = beardStyles.map((style, idx) => ({
      name: style,
      duration: 20 + (idx % 3) * 10, // 20, 30, 40 mins
      price: (20.0 + (idx % 4) * 5.0) * 20, // ₹400, ₹500, ₹600, ₹700
      category: 'Beard Trim',
      icon: 'face',
      image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&auto=format&fit=crop',
      description: `A professional ${style} beard detailing session tailored to your styling preferences.`
    }));

    const facialStyles = [
      "Deep Cleansing Facial", "Hydrating Facial", "Brightening Facial", "Anti-Aging Facial",
      "Gold Facial", "Diamond Facial", "Pearl Facial", "Fruit Facial",
      "Chocolate Facial", "Charcoal Facial", "Oxygen Facial"
    ];

    const defaultFacials = facialStyles.map((style, idx) => ({
      name: style,
      duration: 30 + (idx % 3) * 15, // 30, 45, 60 mins
      price: (40.0 + (idx % 4) * 10.0) * 20, // ₹800, ₹1000, ₹1200, ₹1400
      category: 'Facial',
      icon: 'spa',
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=500&auto=format&fit=crop',
      description: `A professional ${style} session designed to revitalize and refresh your skin.`
    }));

    const services = [
      {
        name: 'Master Haircut',
        duration: 45,
        price: 900.0,
        category: 'Haircut',
        icon: 'content_cut',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAbKUY4RwkAFYAZEDMMqs3xEOtgWpgLjbz_P9NFyTRZkLReF3zl4YLgGhkHaoE3Qi-Bdwu9N1hU1CZZd0uCs_GhCFAU2fBx4caf2gfdaAdhf10V_ZFJA_LQAGE6R8JtZ6dxCh6-_CGTIFBWgrm-atxyY7lUPywJ6oCRX_G8uIQ6dHcITaRS95MFtcRNpltdQkYjUFyx5s2TFy32SMZdbIh2_aHN9CajMHkOiMvD89baoiGQHUaEd523NNOBVVmzYokYMI5pdmfxQ',
        description: 'Precision fade, shear work, and a therapeutic hot towel finish with premium styling.'
      },
      ...defaultHaircuts,
      ...defaultBeards,
      ...defaultFacials,
      {
        name: 'Signature Beard Sculpt',
        duration: 30,
        price: 600.0,
        category: 'Beard Trim',
        icon: 'face',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8fvF1LNW2FBG69RBwCIE0qZmFYUl4EGN4koijXgTqodPKoP1LttEfAGr4UnPNqe8YZQy8OTPIos_bmZ4V8a2UwCtxutuIbK5K91RMJdo3ICL9331LvrzVnNoLYWf1Zs30LjfUz2oDG1hLDVlAiozJmfQCXJJ6Vjd3yBfKmiZTOm4u5i2iIliPUNd7UppOXaapGd6ftoFz4cq9eFfWCEAyXCQ2WdvY5zZBFTU76hwTTrT5bhN-SmE6WnUKZoNAjWR1upI0iuQ9VQ',
        description: 'Complete beard redesign including lineup, length adjustment, and signature oil treatment.'
      },
      {
        name: 'Executive Spa Facial',
        duration: 60,
        price: 1500.0,
        category: 'Facial',
        icon: 'spa',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBicMGiVJQM2V6hYppMkHYcdnvJmd0i5yHwBoaKb_wUqDv9z-xuSBIizI62gbnnannGsBlxcK6266VetkqWwBGqBWn8vKkLtOTXKcLnKgjITPMCxQpizElY7vN7kVzCAWib4x22IxE6uCbyr1kr3r_NSBn_F7IsXNb6IXLHNBeCLRiRIx0Fl-1ISe17r1GuOjNz81u-ThaDNggk_SbNRitw8-h2b0d6fTkCibntfR-3BZRvmTngklaMvJF-dLRMtH5Dhm0r_gNIjQ',
        description: 'Deep cleansing treatment using charcoal extracts, followed by a revitalizing facial massage.'
      },
      {
        name: 'The Royal Shave',
        duration: 40,
        price: 1100.0,
        category: 'Beard Trim',
        icon: 'cleaning_services',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvgILciXNG7Zk1WzGzr6jrxW5DpcbLJrRTAIjtxKxdmbZRIsm5rnz0l6vdI-cGX70dbPErZ9xYMbIPaxpd4mOUi8vREu4Cic0-rCJGPLZd1WKi_G3II40CVYmfSlv2Q_KEyWWTIQc269rEoaUFCbS80V5bf7bShxKEYAy5mqpDOpkfChw_3lcCqx0OY-8lyMODoOn-Y1-JLx2Kaa5Y85Hn_r9nyFDOJw4qamUHoP3QSNRFOR1q4HPEkEWdLUNLENtbA_N3NkCqSw',
        description: 'Traditional straight-razor shave with multi-step hot towel preparation and pre-shave oil.'
      },
      {
        name: 'The Luxe Ritual Package',
        duration: 90,
        price: 3200.0,
        category: 'Packages',
        icon: 'celebration',
        image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80',
        description: 'The ultimate package: Executive Scissor Cut, Royal Beard Detail, and charcoal mask detox.'
      },
      {
        name: 'The Groom\'s Privilege',
        duration: 120,
        price: 4500.0,
        category: 'Packages',
        icon: 'celebration',
        image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80',
        description: 'Our finest package. Executive Scissor Cut, Hot Towel Shave, Gold Brightening Facial, and hair treatment.'
      }
    ];

    const seededServices = await Service.insertMany(services);
    console.log(`${seededServices.length} services seeded.`);

    console.log('Database seeding successfully finished!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
};

seedData();
