const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/admin.middleware');
const { verifyCustomer } = require('../middleware/auth.middleware');

const {
  // Admin
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponAnalytics,
  getMemberships,
  updateMembership,
  getLoyaltySettings,
  updateLoyaltySettings,
  // Customer
  getAvailableCoupons,
  validateCoupon,
  getLoyaltyAccount,
  redeemLoyaltyPoints
} = require('../controllers/coupon.controller');

// ── Admin Routes (protected by verifyAdmin) ───────────────────────────────────
const adminRouter = express.Router();
adminRouter.use(verifyAdmin);

adminRouter.route('/coupons').get(getAdminCoupons).post(createCoupon);
adminRouter.route('/coupons/analytics').get(getCouponAnalytics);
adminRouter.route('/coupons/:id').put(updateCoupon).delete(deleteCoupon);
adminRouter.route('/coupons/:id/toggle').patch(toggleCouponStatus);

adminRouter.route('/memberships').get(getMemberships);
adminRouter.route('/memberships/:id').put(updateMembership);

adminRouter.route('/loyalty/settings').get(getLoyaltySettings).put(updateLoyaltySettings);

// ── Customer Routes (protected by verifyCustomer) ─────────────────────────────
const customerRouter = express.Router();
customerRouter.use(verifyCustomer);

customerRouter.route('/coupons').get(getAvailableCoupons);
customerRouter.route('/coupons/validate').post(validateCoupon);
customerRouter.route('/loyalty').get(getLoyaltyAccount);
customerRouter.route('/loyalty/redeem').post(redeemLoyaltyPoints);

module.exports = { adminCouponRouter: adminRouter, customerCouponRouter: customerRouter };
