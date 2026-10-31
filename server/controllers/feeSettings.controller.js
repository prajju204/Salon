const FeeSettings = require('../models/FeeSettings');

// GET fee settings (public endpoint — needed at checkout)
exports.getFeeSettings = async (req, res) => {
  try {
    let settings = await FeeSettings.findOne({ key: 'global' });
    if (!settings) {
      // Auto-create with defaults on first access
      settings = await FeeSettings.create({ key: 'global' });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT fee settings (admin only)
exports.updateFeeSettings = async (req, res) => {
  try {
    const {
      platformFee,
      deliveryFeeWithin,
      deliveryFeeOutside,
      deliveryDistanceThresholdKm,
      isFreeDeliveryEnabled,
      freeDeliveryMinOrderAmount
    } = req.body;

    const update = {};
    if (platformFee !== undefined) update.platformFee = Number(platformFee);
    if (deliveryFeeWithin !== undefined) update.deliveryFeeWithin = Number(deliveryFeeWithin);
    if (deliveryFeeOutside !== undefined) update.deliveryFeeOutside = Number(deliveryFeeOutside);
    if (deliveryDistanceThresholdKm !== undefined) update.deliveryDistanceThresholdKm = Number(deliveryDistanceThresholdKm);
    if (isFreeDeliveryEnabled !== undefined) update.isFreeDeliveryEnabled = Boolean(isFreeDeliveryEnabled);
    if (freeDeliveryMinOrderAmount !== undefined) update.freeDeliveryMinOrderAmount = Number(freeDeliveryMinOrderAmount);

    const settings = await FeeSettings.findOneAndUpdate(
      { key: 'global' },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: settings, message: 'Fee settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
