const Notification = require('../models/Notification');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const DeliveryBoy = require('../models/DeliveryBoy');
const webpush = require('web-push');

// Configure Web Push (if keys exist)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const axios = require('axios');

// Helpers
const sendEmailNotification = async (email, title, message) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Optional but recommended for REST api

  if (!serviceId || !templateId || !publicKey || !email) {
    console.log(`Skipping EmailJS: Missing config or email address (${email})`);
    return;
  }
  
  try {
    const data = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: email,
        subject: title,
        message: message,
        to_name: 'Customer' // You can pass actual name if available
      }
    };
    if (privateKey) {
      data.accessToken = privateKey;
    }

    await axios.post('https://api.emailjs.com/api/v1.0/email/send', data);
    console.log(`EmailJS sent successfully to ${email}`);
  } catch (err) {
    console.error(`EmailJS error to ${email}:`, err.response?.data || err.message);
  }
};

const sendWebPushNotification = async (subscriptions, title, message) => {
  if (!subscriptions || subscriptions.length === 0 || !process.env.VAPID_PUBLIC_KEY) return;
  
  const payload = JSON.stringify({ title, body: message });
  
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
    } catch (err) {
      console.error('Web Push error:', err.message);
    }
  }
};


const createAdminNotification = async (app, data) => {
  try {
    const notifId = data.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await Notification.findOne({ notificationId: notifId });
    if (existing) return existing;

    const notif = await Notification.create({
      notificationId: notifId,
      recipient: 'admin',
      recipientRole: 'admin',
      type: data.type || 'New Alert',
      title: data.title || 'New Alert',
      message: data.message || '',
      text: data.message || '',
      bookingId: data.bookingId,
      userId: data.userId || 'unknown-client',
      isRead: false,
      read: false,
      time: 'Just now',
      bookingDetails: data.bookingDetails || null,
      bookingPayload: data.bookingPayload || null
    });

    const io = app.get('io');
    if (io) {
      io.to('admin-room').emit('new-notification', { ...notif.toObject(), bookingDetails: data.bookingDetails, bookingPayload: data.bookingPayload });
    }
    
    // Optionally email admin if ADMIN_EMAIL in env
    if (process.env.ADMIN_EMAIL) {
      await sendEmailNotification(process.env.ADMIN_EMAIL, data.title, data.message);
    }

    return notif;
  } catch (error) {
    console.error('Error creating admin notification:', error.message);
  }
};

const createCustomerNotification = async (app, data) => {
  try {
    const notifId = data.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await Notification.findOne({ notificationId: notifId });
    if (existing) return existing;

    const notif = await Notification.create({
      notificationId: notifId,
      recipient: data.recipient || 'customer',
      recipientRole: 'customer',
      type: data.type || 'Alert',
      title: data.title || 'Alert',
      message: data.message || '',
      text: data.message || '',
      bookingId: data.bookingId,
      userId: data.userId || 'unknown-client',
      isRead: false,
      read: false,
      time: 'Just now',
      bookingDetails: data.bookingDetails || null,
      bookingPayload: data.bookingPayload || null
    });

    const io = app.get('io');
    const targetRoom = data.clientEmail || data.userId || 'customer';
    if (io) {
      io.to(targetRoom).emit('new-notification', notif);
    }
    
    // Send email and web push if user exists
    if (data.userId || data.clientEmail) {
      let customer;
      if (data.userId && data.userId !== 'unknown-client') {
        customer = await Customer.findById(data.userId);
      }
      if (!customer && data.clientEmail) {
        customer = await Customer.findOne({ email: data.clientEmail });
      }
      
      if (customer) {
        if (customer.email) await sendEmailNotification(customer.email, data.title, data.message);
        if (customer.pushSubscriptions && customer.pushSubscriptions.length > 0) {
          await sendWebPushNotification(customer.pushSubscriptions, data.title, data.message);
        }
      }
    }

    return notif;
  } catch (error) {
    console.error('Error creating customer notification:', error.message);
  }
};

const createStaffNotification = async (app, data) => {
  try {
    const notifId = data.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await Notification.findOne({ notificationId: notifId });
    if (existing) return existing;

    const notif = await Notification.create({
      notificationId: notifId,
      recipient: data.staffId,
      recipientRole: 'staff',
      type: data.type || 'Alert',
      title: data.title || 'Alert',
      message: data.message || '',
      text: data.message || '',
      bookingId: data.bookingId,
      isRead: false,
      read: false,
      time: 'Just now'
    });

    const io = app.get('io');
    if (io && data.staffId) {
      io.to(`staff-${data.staffId}`).emit('new-notification', notif);
    }

    if (data.staffId) {
      const staff = await Barber.findById(data.staffId);
      if (staff) {
        if (staff.email) await sendEmailNotification(staff.email, data.title, data.message);
        if (staff.pushSubscriptions && staff.pushSubscriptions.length > 0) {
          await sendWebPushNotification(staff.pushSubscriptions, data.title, data.message);
        }
      }
    }

    return notif;
  } catch (error) {
    console.error('Error creating staff notification:', error.message);
  }
};

const createDeliveryNotification = async (app, data) => {
  try {
    const notifId = data.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await Notification.findOne({ notificationId: notifId });
    if (existing) return existing;

    const notif = await Notification.create({
      notificationId: notifId,
      recipient: data.deliveryBoyId,
      recipientRole: 'delivery',
      type: data.type || 'Alert',
      title: data.title || 'Alert',
      message: data.message || '',
      text: data.message || '',
      bookingId: data.bookingId, // could be orderId
      isRead: false,
      read: false,
      time: 'Just now'
    });

    const io = app.get('io');
    if (io && data.deliveryBoyId) {
      io.to(`delivery-${data.deliveryBoyId}`).emit('new-notification', notif);
    }

    if (data.deliveryBoyId) {
      const dboy = await DeliveryBoy.findById(data.deliveryBoyId);
      if (dboy) {
        // No email in DeliveryBoy schema natively, but if it exists we can send
        if (dboy.email) await sendEmailNotification(dboy.email, data.title, data.message);
        if (dboy.pushSubscriptions && dboy.pushSubscriptions.length > 0) {
          await sendWebPushNotification(dboy.pushSubscriptions, data.title, data.message);
        }
      }
    }

    return notif;
  } catch (error) {
    console.error('Error creating delivery notification:', error.message);
  }
};

module.exports = { 
  createAdminNotification, 
  createCustomerNotification,
  createStaffNotification,
  createDeliveryNotification
};
