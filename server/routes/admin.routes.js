const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getBarbers,
  createBarber,
  updateBarber,
  deleteBarber,
  resetBarberPassword,
  getServices,
  getServiceCategories,
  createService,
  updateService,
  deleteService,
  getAppointments,
  updateStatus,
  deleteAppointment,
  getPayments,
  refundPayment,
  getReviews,
  approveReview,
  replyReview,
  deleteReview,
  getNotifications,
  createNotification,
  markAllRead,
  deleteNotification,
  getDashboardReport,
  uploadImage,
  getBookingSettings,
  updateBookingSettings,
  getLeaves,
  updateLeaveStatus,
  getAllAttendance,
  payStaff
} = require('../controllers/admin.controller');
const { verifyAdmin } = require('../middleware/admin.middleware');
const upload = require('../middleware/upload.middleware');

// Public Admin Auth
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Admin Panel Endpoints
router.use(verifyAdmin);

router.get('/profile', getProfile);
router.post('/logout', logout);

// Image Upload (multipart/form-data, field name: "image")
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, uploadImage);


// Customer Management
router.route('/customers')
  .get(getCustomers)
  .post(createCustomer);

router.route('/customers/:id')
  .put(updateCustomer)
  .delete(deleteCustomer);

// Barber Management
router.route('/barbers')
  .get(getBarbers)
  .post(createBarber);

router.route('/barbers/:id')
  .put(updateBarber)
  .delete(deleteBarber);

router.put('/barbers/:id/reset-password', resetBarberPassword);
router.post('/barbers/:id/pay', payStaff);

// Service Management
router.get('/services/categories', getServiceCategories);

router.route('/services')
  .get(getServices)
  .post(createService);

router.route('/services/:id')
  .put(updateService)
  .delete(deleteService);

// Appointment Management
router.route('/appointments')
  .get(getAppointments);

router.route('/appointments/:id/status')
  .put(updateStatus);

router.route('/appointments/:id')
  .delete(deleteAppointment);

// Payment Management
router.route('/payments')
  .get(getPayments);

router.route('/payments/:id/refund')
  .put(refundPayment);

// Review Management
router.route('/reviews')
  .get(getReviews);

router.route('/reviews/:id/approve')
  .put(approveReview);

router.route('/reviews/:id/reply')
  .put(replyReview);

router.route('/reviews/:id')
  .delete(deleteReview);

// Notification Management
router.route('/notifications')
  .get(getNotifications)
  .post(createNotification);

router.route('/notifications/read')
  .put(markAllRead);

router.route('/notifications/:id')
  .delete(deleteNotification);

// Reports & Analytics
router.get('/reports/dashboard', getDashboardReport);

// General Booking Settings
router.route('/settings')
  .get(getBookingSettings)
  .put(updateBookingSettings);

// Leave Management
router.route('/leaves')
  .get(getLeaves);

router.route('/leaves/:id/status')
  .put(updateLeaveStatus);

// Attendance Management
router.route('/attendance')
  .get(getAllAttendance);

// Product Management
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
router.route('/products')
  .get(getProducts)
  .post(createProduct);

router.route('/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

module.exports = router;
