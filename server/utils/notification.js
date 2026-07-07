const Notification = require('../models/Notification');

const createAdminNotification = async (app, data) => {
  try {
    const notifId = data.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Ensure notifications are not duplicated
    const existing = await Notification.findOne({ notificationId: notifId });
    if (existing) {
      console.log(`Duplicate notification ignored: ${notifId}`);
      return existing;
    }

    const notif = await Notification.create({
      notificationId: notifId,
      recipient: 'admin',
      recipientRole: 'admin', // Legacy fallback
      type: data.type || 'New Booking',
      title: data.title || 'New Alert',
      message: data.message || '',
      text: data.message || '', // Legacy fallback
      bookingId: data.bookingId,
      userId: data.userId || 'unknown-client',
      isRead: false,
      read: false, // Legacy fallback
      time: 'Just now', // Legacy fallback
      bookingDetails: data.bookingDetails || null
    });

    const io = app.get('io');
    if (io) {
      io.to('admin-room').emit('new-notification', { ...notif.toObject(), bookingDetails: data.bookingDetails });
      console.log(`Socket.IO event 'new-notification' emitted to admin-room:`, notifId);
    }
    return notif;
  } catch (error) {
    console.error('Error creating admin notification:', error.message);
  }
};

module.exports = { createAdminNotification };
