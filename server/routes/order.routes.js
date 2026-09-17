const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatusCustomer } = require('../controllers/order.controller');
const { verifyCustomer } = require('../middleware/auth.middleware');
const { restrictUnverified } = require('../middleware/email.middleware');

router.route('/')
  .post(verifyCustomer, restrictUnverified, createOrder)
  .get(verifyCustomer, getOrders);

router.put('/:id/status', verifyCustomer, updateOrderStatusCustomer);

module.exports = router;
