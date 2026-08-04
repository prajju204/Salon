const express = require('express');
const router = express.Router();
const { createOrder, getOrders } = require('../controllers/order.controller');
const { verifyCustomer } = require('../middleware/auth.middleware');

router.route('/')
  .post(verifyCustomer, createOrder)
  .get(verifyCustomer, getOrders);

module.exports = router;
