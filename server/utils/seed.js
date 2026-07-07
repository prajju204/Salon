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
    const barbers = [
      {
        name: 'Alexander Vance',
        role: 'Master Barber',
        rating: 4.9,
        revenue: 3420.0,
        completedBookings: 142,
        activeDays: 5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5cDCXWUi3juq1IzPadvAbJXnF4mAIhjSHR8ACR4oPCArfoRW5aNmxfz7i1HXasrp1_Q6-qHhbJ_S3kgVAsWWdhFVArKgXtRMj2sI88VQ1CQ8BZIYsWDHSAHq4kYY0ZgGoLEXW9JOhCSXvjsQbzxaGoiCXZCGOckJs6J9bpfxrxLIRJOw6x1VISjDIjydLWsRgAn_uQidyKS4rwcLZ8ZgByHussuwp-W4UU4xdtvj76ac-JEAgR9ma4pjU7-HzzQqICcvx41-ZYg',
        skills: ['Beard Sculpting', 'Traditional Shave', 'Fades'],
        availability: { 'Monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] }
      },
      {
        name: 'Julian Mercer',
        role: 'Barber Stylist',
        rating: 4.8,
        revenue: 2150.0,
        completedBookings: 98,
        activeDays: 4,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTjWe7JD3UcNWuvnlhi1TDsX2OTmHhb0wYh2Zcb0LlHuuNCUvSB3mJke5zUPAlnUfVaQbkP88HP1O7EzWab3RjEmlV0dwPlQMtIrOxFG-U1f1geaaMfpKWjFQ7E3DX5iXC-3uRrff5wY2ITxjrA-Cc9TlUOyit-_3tY8aZr1KN5NNI_gJGwZcG4nuGczymN1t5FJ0VOrR1ZbYyZxI-0znc45Qs0z6q0PF7q4O6HI9vaCzXuEw2q5wdu51JjoFFsB5tFScM6Lr2pQ',
        skills: ['Hair Coloring', 'Modern Fades'],
        availability: { 'Monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] }
      },
      {
        name: 'Sophia Rossi',
        role: 'Creative Stylist',
        rating: 4.8,
        revenue: 2980.0,
        completedBookings: 115,
        activeDays: 5,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYoXOZ1akvYcsO4FIuJ_TnD9lYLIgGRgooJhkgOQhX06Fv6RsLLI9sGJbTvuTWVmji61JcqhswwjbVVTk24hUetUnf9RTBnK9FQINnc5Sy-LtIcKqmB1WI5NoRik8hOL_BCud3q_j0c8b6rZ5gC21dTXqGgwq1uxGQSDD0yP8-qSYTEjXCujMdYXB4hx6TMDf3XZS_daaj-M66xQl363Apoa2zWCiQIm83qT7Tex0UD3bVL43X2H1yl-zYS7F92-XMH3scR-KE3A',
        skills: ['Executive Facials', 'Scissors Styling'],
        availability: { 'Monday': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'] }
      }
    ];

    const seededBarbers = await Barber.insertMany(barbers);
    console.log(`${seededBarbers.length} barbers seeded.`);

    // Seed Services
    const services = [
      {
        name: 'Master Haircut',
        duration: 45,
        price: 45.0,
        category: 'Haircut',
        icon: 'content_cut',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAbKUY4RwkAFYAZEDMMqs3xEOtgWpgLjbz_P9NFyTRZkLReF3zl4YLgGhkHaoE3Qi-Bdwu9N1hU1CZZd0uCs_GhCFAU2fBx4caf2gfdaAdhf10V_ZFJA_LQAGE6R8JtZ6dxCh6-_CGTIFBWgrm-atxyY7lUPywJ6oCRX_G8uIQ6dHcITaRS95MFtcRNpltdQkYjUFyx5s2TFy32SMZdbIh2_aHN9CajMHkOiMvD89baoiGQHUaEd523NNOBVVmzYokYMI5pdmfxQ',
        description: 'Precision fade, shear work, and a therapeutic hot towel finish with premium styling.'
      },
      {
        name: 'Signature Beard Sculpt',
        duration: 30,
        price: 30.0,
        category: 'Beard Trim',
        icon: 'face',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8fvF1LNW2FBG69RBwCIE0qZmFYUl4EGN4koijXgTqodPKoP1LttEfAGr4UnPNqe8YZQy8OTPIos_bmZ4V8a2UwCtxutuIbK5K91RMJdo3ICL9331LvrzVnNoLYWf1Zs30LjfUz2oDG1hLDVlAiozJmfQCXJJ6Vjd3yBfKmiZTOm4u5i2iIliPUNd7UppOXaapGd6ftoFz4cq9eFfWCEAyXCQ2WdvY5zZBFTU76hwTTrT5bhN-SmE6WnUKZoNAjWR1upI0iuQ9VQ',
        description: 'Complete beard redesign including lineup, length adjustment, and signature oil treatment.'
      },
      {
        name: 'Executive Spa Facial',
        duration: 60,
        price: 75.0,
        category: 'Luxury Spa',
        icon: 'spa',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBicMGiVJQM2V6hYppMkHYcdnvJmd0i5yHwBoaKb_wUqDv9z-xuSBIizI62gbnnannGsBlxcK6266VetkqWwBGqBWn8vKkLtOTXKcLnKgjITPMCxQpizElY7vN7kVzCAWib4x22IxE6uCbyr1kr3r_NSBn_F7IsXNb6IXLHNBeCLRiRIx0Fl-1ISe17r1GuOjNz81u-ThaDNggk_SbNRitw8-h2b0d6fTkCibntfR-3BZRvmTngklaMvJF-dLRMtH5Dhm0r_gNIjQ',
        description: 'Deep cleansing treatment using charcoal extracts, followed by a revitalizing facial massage.'
      },
      {
        name: 'The Royal Shave',
        duration: 40,
        price: 55.0,
        category: 'Luxury Shave',
        icon: 'cleaning_services',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvgILciXNG7Zk1WzGzr6jrxW5DpcbLJrRTAIjtxKxdmbZRIsm5rnz0l6vdI-cGX70dbPErZ9xYMbIPaxpd4mOUi8vREu4Cic0-rCJGPLZd1WKi_G3II40CVYmfSlv2Q_KEyWWTIQc269rEoaUFCbS80V5bf7bShxKEYAy5mqpDOpkfChw_3lcCqx0OY-8lyMODoOn-Y1-JLx2Kaa5Y85Hn_r9nyFDOJw4qamUHoP3QSNRFOR1q4HPEkEWdLUNLENtbA_N3NkCqSw',
        description: 'Traditional straight-razor shave with multi-step hot towel preparation and pre-shave oil.'
      }
    ];

    const seededServices = await Service.insertMany(services);
    console.log(`${seededServices.length} services seeded.`);

    // Seed Appointments
    const appointments = [
      {
        clientName: 'Marcus Sterling',
        clientEmail: 'marcus@gmail.com',
        clientMobile: '+919999999999',
        serviceName: 'Master Haircut',
        price: 45.0,
        date: new Date().toISOString().split('T')[0], // Today
        time: '09:00 AM',
        barberId: seededBarbers[0]._id.toString(),
        barberName: seededBarbers[0].name,
        status: 'Completed'
      },
      {
        clientName: 'Julian Vance',
        clientEmail: 'julian@gmail.com',
        clientMobile: '+918888888888',
        serviceName: 'The Royal Shave',
        price: 55.0,
        date: new Date().toISOString().split('T')[0], // Today
        time: '10:15 AM',
        barberId: seededBarbers[0]._id.toString(),
        barberName: seededBarbers[0].name,
        status: 'In Progress'
      },
      {
        clientName: 'Arthur Morgan',
        clientEmail: 'arthur@gmail.com',
        clientMobile: '+917777777777',
        serviceName: 'Signature Beard Sculpt',
        price: 30.0,
        date: new Date().toISOString().split('T')[0], // Today
        time: '11:30 AM',
        barberId: seededBarbers[0]._id.toString(),
        barberName: seededBarbers[0].name,
        status: 'Confirmed'
      },
      {
        clientName: 'James Mercer',
        clientEmail: 'customer@luxegroom.com',
        clientMobile: '+919876543210',
        serviceName: 'Master Haircut',
        price: 45.0,
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: '10:00 AM',
        barberId: seededBarbers[0]._id.toString(),
        barberName: seededBarbers[0].name,
        status: 'Confirmed'
      }
    ];

    const seededAppointments = await Appointment.insertMany(appointments);
    console.log(`${seededAppointments.length} appointments seeded.`);

    // Seed Payments & Invoices for Completed Appointments
    for (const apt of seededAppointments) {
      if (apt.status === 'Completed') {
        await Payment.create({
          appointmentId: apt._id.toString(),
          clientName: apt.clientName,
          amount: apt.price,
          method: 'Credit Card',
          status: 'Paid'
        });

        await Invoice.create({
          invoiceNumber: 'INV-' + Date.now() + Math.floor(Math.random() * 100),
          appointmentId: apt._id.toString(),
          amount: apt.price,
          status: 'Paid'
        });
      }
    }

    // Seed Reviews
    const reviews = [
      {
        clientName: 'James Mercer',
        barberName: seededBarbers[0].name,
        rating: 5,
        text: 'Best haircut in the city. Truly luxurious experience.',
        date: '2026-06-28',
        approved: true
      },
      {
        clientName: 'Sebastian Cole',
        barberName: seededBarbers[2].name,
        rating: 4,
        text: 'Fantastic attention to detail, very premium environment.',
        date: '2026-06-27',
        approved: true
      }
    ];
    await Review.insertMany(reviews);
    console.log('Reviews seeded.');

    // Seed Notifications
    const notifications = [
      { text: 'Arthur Morgan booked an appointment for 11:30 AM', time: '10 mins ago', read: false, recipientRole: 'admin' },
      { text: 'System update: Analytics dashboard is live.', time: '1 hour ago', read: true, recipientRole: 'admin' }
    ];
    await Notification.insertMany(notifications);
    console.log('Notifications seeded.');

    console.log('Database seeding successfully finished!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
};

seedData();
