const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Membership = require('../models/Membership');
const LoyaltyAccount = require('../models/LoyaltyAccount');
const LoyaltySetting = require('../models/LoyaltySetting');
const ActivityLog = require('../models/ActivityLog');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const getOrCreateLoyaltySetting = async () => {
  let setting = await LoyaltySetting.findOne({ key: 'global' });
  if (!setting) {
    setting = await LoyaltySetting.create({ key: 'global' });
  }
  return setting;
};

const seedMembershipsIfEmpty = async () => {
  const count = await Membership.countDocuments();
  if (count === 0) {
    await Membership.insertMany([
      {
        tier: 'Basic',
        minSpend: 0,
        discountPercentage: 0,
        priorityBooking: false,
        exclusiveServices: [],
        freeGroomingSessions: 0,
        rewardPointMultiplier: 1.0,
        description: 'Welcome tier for all new members',
        color: '#c6c6c6',
        icon: 'person'
      },
      {
        tier: 'Silver',
        minSpend: 5000,
        discountPercentage: 5,
        priorityBooking: false,
        exclusiveServices: [],
        freeGroomingSessions: 0,
        rewardPointMultiplier: 1.5,
        description: 'Earn more points and unlock member discounts',
        color: '#a8a8a8',
        icon: 'workspace_premium'
      },
      {
        tier: 'Gold',
        minSpend: 15000,
        discountPercentage: 10,
        priorityBooking: true,
        exclusiveServices: ['Executive Scissor Cut', 'Hot Towel Shave'],
        freeGroomingSessions: 1,
        rewardPointMultiplier: 2.0,
        description: 'Priority booking, exclusive services, and double points',
        color: '#f2ca50',
        icon: 'star'
      },
      {
        tier: 'Platinum',
        minSpend: 40000,
        discountPercentage: 15,
        priorityBooking: true,
        exclusiveServices: ['Executive Scissor Cut', 'Hot Towel Shave', 'Beard Sculpt', 'Royal Treatment'],
        freeGroomingSessions: 2,
        rewardPointMultiplier: 3.0,
        description: 'The ultimate luxury experience with maximum rewards',
        color: '#e5e4e2',
        icon: 'diamond'
      }
    ]);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — COUPON MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.getAdminCoupons = async (req, res) => {
  try {
    const { search = '', status = 'all', page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({ success: true, data: coupons, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'CREATE_COUPON',
      details: `Created coupon: ${coupon.code}`
    });
    return res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'UPDATE_COUPON',
      details: `Updated coupon: ${coupon.code}`
    });
    return res.json({ success: true, data: coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'DELETE_COUPON',
      details: `Deleted coupon: ${coupon.code}`
    });
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleCouponStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'TOGGLE_COUPON',
      details: `${coupon.isActive ? 'Activated' : 'Deactivated'} coupon: ${coupon.code}`
    });
    return res.json({ success: true, data: coupon, message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCouponAnalytics = async (req, res) => {
  try {
    const totalCoupons = await Coupon.countDocuments();
    const activeCoupons = await Coupon.countDocuments({ isActive: true });

    const aggregation = await Coupon.aggregate([
      {
        $group: {
          _id: null,
          totalUsed: { $sum: '$usedCount' },
          totalDiscount: { $sum: '$totalDiscountGiven' }
        }
      }
    ]);
    const stats = aggregation[0] || { totalUsed: 0, totalDiscount: 0 };

    const usageHistory = await CouponUsage.find()
      .sort({ usedAt: -1 })
      .limit(50)
      .lean();

    const topCoupons = await Coupon.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select('code name usedCount totalDiscountGiven');

    return res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        totalUsed: stats.totalUsed,
        totalDiscount: stats.totalDiscount,
        usageHistory,
        topCoupons
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — MEMBERSHIP MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

exports.getMemberships = async (req, res) => {
  try {
    await seedMembershipsIfEmpty();
    const memberships = await Membership.find().sort({ minSpend: 1 });
    return res.json({ success: true, data: memberships });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await Membership.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!membership) return res.status(404).json({ success: false, message: 'Membership tier not found' });

    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'UPDATE_MEMBERSHIP',
      details: `Updated membership tier: ${membership.tier}`
    });
    return res.json({ success: true, data: membership, message: 'Membership updated successfully' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — LOYALTY SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

exports.getLoyaltySettings = async (req, res) => {
  try {
    const setting = await getOrCreateLoyaltySetting();
    return res.json({ success: true, data: setting });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLoyaltySettings = async (req, res) => {
  try {
    const setting = await LoyaltySetting.findOneAndUpdate(
      { key: 'global' },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    await ActivityLog.create({
      userEmail: req.user?.email,
      role: 'admin',
      action: 'UPDATE_LOYALTY_SETTINGS',
      details: 'Updated loyalty program settings'
    });
    return res.json({ success: true, data: setting, message: 'Loyalty settings updated' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — VIEW AVAILABLE COUPONS
// ─────────────────────────────────────────────────────────────────────────────

exports.getAvailableCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
      ]
    }).sort({ createdAt: -1 });

    // Filter out coupons where customer has hit perUserLimit
    const customerId = req.user?._id;
    const usages = await CouponUsage.aggregate([
      { $match: { customerId: customerId } },
      { $group: { _id: '$couponId', count: { $sum: 1 } } }
    ]);
    const usageMap = {};
    usages.forEach(u => { usageMap[u._id.toString()] = u.count; });

    const available = coupons.filter(c => {
      const used = usageMap[c._id.toString()] || 0;
      return used < c.perUserLimit;
    });

    return res.json({ success: true, data: available });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — VALIDATE & APPLY COUPON
// ─────────────────────────────────────────────────────────────────────────────

exports.validateCoupon = async (req, res) => {
  try {
    const { code, bookingAmount, serviceId } = req.body;
    const customerId = req.user?._id;

    if (!code || !bookingAmount) {
      return res.status(400).json({ success: false, message: 'Coupon code and booking amount are required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    // Existence check
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    if (!coupon.isActive) return res.status(400).json({ success: false, message: 'This coupon is no longer active' });

    // Date validity
    const now = new Date();
    if (now < coupon.validFrom) return res.status(400).json({ success: false, message: 'This coupon is not yet valid' });
    if (now > coupon.validUntil) return res.status(400).json({ success: false, message: 'This coupon has expired' });

    // Global usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit' });
    }

    // Per-user limit
    const userUsageCount = await CouponUsage.countDocuments({ couponId: coupon._id, customerId });
    if (userUsageCount >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: `You can only use this coupon ${coupon.perUserLimit} time(s)` });
    }

    // Min booking amount
    if (bookingAmount < coupon.minBookingAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum booking amount of ₹${coupon.minBookingAmount} required to use this coupon`
      });
    }

    // Applicable services check (empty array = all services)
    if (coupon.applicableServices.length > 0 && serviceId) {
      if (!coupon.applicableServices.includes(serviceId)) {
        return res.status(400).json({ success: false, message: 'This coupon is not applicable to the selected service' });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (bookingAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount !== null) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }
    discountAmount = Math.min(discountAmount, bookingAmount); // Cannot exceed booking amount
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(0, bookingAmount - discountAmount);

    return res.json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount,
        originalAmount: bookingAmount
      },
      message: `Coupon applied! You save ₹${discountAmount.toFixed(2)}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER — LOYALTY ACCOUNT
// ─────────────────────────────────────────────────────────────────────────────

exports.getLoyaltyAccount = async (req, res) => {
  try {
    const customerId = req.user?._id;
    await seedMembershipsIfEmpty();

    let account = await LoyaltyAccount.findOne({ customerId });
    if (!account) {
      account = await LoyaltyAccount.create({
        customerId,
        customerEmail: req.user.email,
        points: 0,
        totalSpend: 0,
        membershipTier: 'Basic'
      });
    }

    const memberships = await Membership.find().sort({ minSpend: 1 });
    const setting = await getOrCreateLoyaltySetting();

    // Get next tier info
    const currentTierIndex = ['Basic', 'Silver', 'Gold', 'Platinum'].indexOf(account.membershipTier);
    const nextTier = memberships[currentTierIndex + 1] || null;

    return res.json({
      success: true,
      data: {
        ...account.toObject(),
        memberships,
        currentTier: memberships.find(m => m.tier === account.membershipTier),
        nextTier,
        loyaltySettings: setting,
        pointsValue: account.points * setting.redemptionValue
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeemLoyaltyPoints = async (req, res) => {
  try {
    const { points, bookingAmount } = req.body;
    const customerId = req.user?._id;

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid points amount' });
    }

    const setting = await getOrCreateLoyaltySetting();
    if (!setting.isEnabled) {
      return res.status(400).json({ success: false, message: 'Loyalty program is currently disabled' });
    }

    const account = await LoyaltyAccount.findOne({ customerId });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Loyalty account not found' });
    }

    if (account.points < setting.minRedeemablePoints) {
      return res.status(400).json({
        success: false,
        message: `You need at least ${setting.minRedeemablePoints} points to redeem`
      });
    }

    const redeemable = Math.min(points, account.points, setting.maxRedeemablePoints);
    const discountAmount = Math.round(redeemable * setting.redemptionValue * 100) / 100;
    const maxAllowedDiscount = (bookingAmount * setting.maxRedemptionPercent) / 100;
    const actualDiscount = Math.min(discountAmount, maxAllowedDiscount);

    return res.json({
      success: true,
      data: {
        pointsToRedeem: redeemable,
        discountAmount: actualDiscount,
        finalAmount: Math.max(0, bookingAmount - actualDiscount),
        currentBalance: account.points,
        remainingAfter: account.points - redeemable
      },
      message: `Redeeming ${redeemable} points for ₹${actualDiscount.toFixed(2)} discount`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Internal: called after appointment is completed to award points
exports.awardLoyaltyPoints = async (customerId, customerEmail, appointmentId, amountPaid, membershipTier) => {
  try {
    const setting = await getOrCreateLoyaltySetting();
    if (!setting.isEnabled) return;

    const memberships = await Membership.find().sort({ minSpend: 1 });
    const tierConfig = memberships.find(m => m.tier === membershipTier) || { rewardPointMultiplier: 1.0 };
    const basePoints = Math.floor((amountPaid / 100) * setting.pointsPerHundred);
    const earnedPoints = Math.floor(basePoints * tierConfig.rewardPointMultiplier);

    let account = await LoyaltyAccount.findOne({ customerId });
    if (!account) {
      account = await LoyaltyAccount.create({ customerId, customerEmail });
    }

    const newBalance = account.points + earnedPoints;
    account.points = newBalance;
    account.totalEarned += earnedPoints;
    account.totalSpend += amountPaid;
    account.transactions.push({
      type: 'earned',
      points: earnedPoints,
      description: `Points earned for appointment`,
      appointmentId: appointmentId.toString(),
      balance: newBalance
    });

    // Recalculate tier
    await account.recalculateTier();
    await account.save();
    return earnedPoints;
  } catch (err) {
    console.error('Error awarding loyalty points:', err.message);
  }
};

// Internal: called when appointment is booked with loyalty redemption
exports.deductLoyaltyPoints = async (customerId, appointmentId, pointsToDeduct) => {
  try {
    const account = await LoyaltyAccount.findOne({ customerId });
    if (!account || account.points < pointsToDeduct) return false;

    const newBalance = account.points - pointsToDeduct;
    account.points = newBalance;
    account.totalRedeemed += pointsToDeduct;
    account.transactions.push({
      type: 'redeemed',
      points: -pointsToDeduct,
      description: `Points redeemed for appointment discount`,
      appointmentId: appointmentId.toString(),
      balance: newBalance
    });
    await account.save();
    return true;
  } catch (err) {
    console.error('Error deducting loyalty points:', err.message);
    return false;
  }
};

// Internal: record coupon usage after booking
exports.recordCouponUsage = async (couponCode, customerId, customerName, customerEmail, appointmentId, originalAmount, discountApplied) => {
  try {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) return;

    await CouponUsage.create({
      couponId: coupon._id,
      couponCode: coupon.code,
      customerId,
      customerName,
      customerEmail,
      appointmentId,
      originalAmount,
      discountApplied,
      finalAmount: originalAmount - discountApplied
    });

    // Update coupon aggregate stats
    await Coupon.findByIdAndUpdate(coupon._id, {
      $inc: { usedCount: 1, totalDiscountGiven: discountApplied }
    });
  } catch (err) {
    console.error('Error recording coupon usage:', err.message);
  }
};
