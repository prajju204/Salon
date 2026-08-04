const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus } = require('../controllers/order.controller');
const { verifyAdmin } = require('../middleware/admin.middleware');

router.use(verifyAdmin);

router.route('/')
  .get(getAllOrders);

router.route('/:id/status')
  .put(updateOrderStatus);

module.exports = router;
