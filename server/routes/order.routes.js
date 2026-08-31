const express = require('express');
const router = express.Router();
const { createOrder, getOrders } = require('../controllers/order.controller');
const { verifyCustomer } = require('../middleware/auth.middleware');
const { restrictUnverified } = require('../middleware/email.middleware');

router.route('/')
  .post(verifyCustomer, restrictUnverified, createOrder)
  .get(verifyCustomer, getOrders);

module.exports = router;
