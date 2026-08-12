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
  getApprovedLeaves
} = require('../controllers/auth.controller');
const { verifyCustomer } = require('../middleware/auth.middleware');

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Public Menu/Details Endpoints
router.get('/services/categories', getServiceCategories);
router.get('/services', getServices);
router.get('/barbers', getBarbers);
router.get('/reviews', getReviews);
router.get('/leaves/approved', getApprovedLeaves);

// Protected Client Portal Endpoints
router.get('/profile', verifyCustomer, getProfile);
router.post('/logout', verifyCustomer, logout);

router.route('/appointments')
  .get(verifyCustomer, getAppointments)
  .post(verifyCustomer, createAppointment);

router.delete('/appointments/:id', verifyCustomer, deleteAppointment);
router.put('/appointments/:id/reschedule', verifyCustomer, rescheduleAppointment);

router.route('/payments')
  .get(verifyCustomer, getPayments)
  .post(verifyCustomer, createPayment);

router.post('/reviews', verifyCustomer, addReview);
router.get('/notifications', verifyCustomer, getNotifications);

const { getBookingSettings } = require('../controllers/admin.controller');
router.get('/settings', getBookingSettings);

// Products Endpoint (Public/Customer)
const { getProducts } = require('../controllers/product.controller');
router.get('/products', getProducts);

const { getProductReviews, addProductReview } = require('../controllers/productReview.controller');
router.get('/products/:id/reviews', getProductReviews);
router.post('/products/:id/reviews', verifyCustomer, addProductReview);

module.exports = router;
