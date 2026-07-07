const express = require('express');
const { verifyAdmin } = require('../middleware/admin.middleware');
const { verifyCustomer } = require('../middleware/auth.middleware');

const {
  // Customer
  requestCancellation,
  getCustomerCancellations,
  getCancellationPolicy,
  previewCancellationRefund,
  // Admin
  getAdminCancellations,
  approveCancellation,
  rejectCancellation,
  getAdminRefunds,
  processRefund,
  getCancellationSettings,
  updateCancellationSettings
} = require('../controllers/cancellation.controller');

// ── Admin Routes ───────────────────────────────────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(verifyAdmin);

adminRouter.route('/cancellations').get(getAdminCancellations);
adminRouter.route('/cancellations/:id/approve').put(approveCancellation);
adminRouter.route('/cancellations/:id/reject').put(rejectCancellation);

adminRouter.route('/refunds').get(getAdminRefunds);
adminRouter.route('/refunds/:id/process').put(processRefund);

adminRouter.route('/cancellation/settings').get(getCancellationSettings).put(updateCancellationSettings);

// ── Customer Routes ────────────────────────────────────────────────────────────
const customerRouter = express.Router();
customerRouter.use(verifyCustomer);

customerRouter.route('/cancellations').get(getCustomerCancellations).post(requestCancellation);
customerRouter.route('/cancellations/policy').get(getCancellationPolicy);
customerRouter.route('/cancellations/preview').post(previewCancellationRefund);

module.exports = { adminCancellationRouter: adminRouter, customerCancellationRouter: customerRouter };
