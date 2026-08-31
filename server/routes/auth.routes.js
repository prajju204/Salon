const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  getServices,
  getServiceCategories,
  getBarbers,
  getAppointments,
  createAppointment,
  deleteAppointment,
  rescheduleAppointment,
  getPayments,
  createPayment,
  getReviews,
  addReview,
  getNotifications,
  getApprovedLeaves,
  refreshToken,
  verifyEmail,
  resendVerification,
  updateProfile
} = require('../controllers/auth.controller');
const { verifyCustomer } = require('../middleware/auth.middleware');

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Public Menu/Details Endpoints
router.get('/services/categories', getServiceCategories);
router.get('/services', getServices);
router.get('/barbers', getBarbers);
router.get('/reviews', getReviews);
router.get('/leaves/approved', getApprovedLeaves);

// Protected Client Portal Endpoints
router.get('/profile', verifyCustomer, getProfile);
router.put('/profile', verifyCustomer, updateProfile);
router.post('/logout', verifyCustomer, logout);

const { restrictUnverified } = require('../middleware/email.middleware');

router.route('/appointments')
  .get(verifyCustomer, getAppointments)
  .post(verifyCustomer, restrictUnverified, createAppointment);

router.delete('/appointments/:id', verifyCustomer, deleteAppointment);
router.put('/appointments/:id/reschedule', verifyCustomer, restrictUnverified, rescheduleAppointment);

router.route('/payments')
  .get(verifyCustomer, getPayments)
  .post(verifyCustomer, restrictUnverified, createPayment);

router.post('/reviews', verifyCustomer, restrictUnverified, addReview);
router.get('/notifications', verifyCustomer, getNotifications);

const { getBookingSettings } = require('../controllers/admin.controller');
router.get('/settings', getBookingSettings);

// Products Endpoint (Public/Customer)
const { getProducts } = require('../controllers/product.controller');
router.get('/products', getProducts);

const { getProductReviews, addProductReview } = require('../controllers/productReview.controller');
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', verifyCustomer, restrictUnverified, addProductReview);

module.exports = router;
