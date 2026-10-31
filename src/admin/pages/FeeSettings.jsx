import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { API_BASE } from '@/shared/utils/api';

const API = `${API_BASE}/api/admin`;

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const InfoCard = ({ icon, label, value, color = 'text-primary' }) => (
  <div className="bg-surface-container rounded-xl p-4 border border-white/5 flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center`}>
      <span className={`material-symbols-outlined ${color}`}>{icon}</span>
    </div>
    <div>
      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-lg font-headline font-bold ${color}`}>{value}</p>
    </div>
  </div>
);

const FeeSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    platformFee: 5,
    deliveryFeeWithin: 30,
    deliveryFeeOutside: 60,
    deliveryDistanceThresholdKm: 30,
    isFreeDeliveryEnabled: false,
    freeDeliveryMinOrderAmount: 0,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fee-settings`, { headers: authHeader() });
      if (res.data.success) {
        const d = res.data.data;
        setForm({
          platformFee: d.platformFee ?? 5,
          deliveryFeeWithin: d.deliveryFeeWithin ?? 30,
          deliveryFeeOutside: d.deliveryFeeOutside ?? 60,
          deliveryDistanceThresholdKm: d.deliveryDistanceThresholdKm ?? 30,
          isFreeDeliveryEnabled: d.isFreeDeliveryEnabled ?? false,
          freeDeliveryMinOrderAmount: d.freeDeliveryMinOrderAmount ?? 0,
        });
      }
    } catch {
      toast.error('Failed to load fee settings. Showing defaults.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.platformFee < 0 || form.deliveryFeeWithin < 0 || form.deliveryFeeOutside < 0) {
      toast.error('Fees cannot be negative.');
      return;
    }
    if (form.deliveryDistanceThresholdKm < 1) {
      toast.error('Distance threshold must be at least 1 km.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(`${API}/fee-settings`, {
        platformFee: Number(form.platformFee),
        deliveryFeeWithin: Number(form.deliveryFeeWithin),
        deliveryFeeOutside: Number(form.deliveryFeeOutside),
        deliveryDistanceThresholdKm: Number(form.deliveryDistanceThresholdKm),
        isFreeDeliveryEnabled: form.isFreeDeliveryEnabled,
        freeDeliveryMinOrderAmount: Number(form.freeDeliveryMinOrderAmount),
      }, { headers: authHeader() });
      toast.success('Fee settings saved successfully!');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-on-surface-variant text-sm">Loading fee settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-headline font-bold">Fee Settings</h1>
            <p className="text-on-surface-variant text-xs mt-0.5">Manage platform fee &amp; delivery charges applied to every product order</p>
          </div>
        </div>
      </motion.div>

      {/* Live Preview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
      >
        <InfoCard icon="storefront" label="Platform Fee" value={`Rs.${form.platformFee}`} color="text-primary" />
        <InfoCard
          icon="near_me"
          label={`Delivery <= ${form.deliveryDistanceThresholdKm} km`}
          value={form.isFreeDeliveryEnabled ? 'FREE' : `Rs.${form.deliveryFeeWithin}`}
          color="text-emerald-400"
        />
        <InfoCard
          icon="map"
          label={`Delivery > ${form.deliveryDistanceThresholdKm} km`}
          value={form.isFreeDeliveryEnabled ? 'FREE' : `Rs.${form.deliveryFeeOutside}`}
          color="text-amber-400"
        />
      </motion.div>

      {/* Settings Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSave}
        className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden shadow-xl"
      >
        {/* Platform Fee Section */}
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">storefront</span>
            Platform Fee
          </h2>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
              Platform Fee (Rs.) — added to every order
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.platformFee}
                  onChange={e => handleChange('platformFee', e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                />
              </div>
              <p className="text-xs text-on-surface-variant">Fixed charge per order</p>
            </div>
          </div>
        </div>

        {/* Delivery Fee Section */}
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            Delivery Charges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Distance Threshold */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Distance Threshold (km)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative max-w-xs w-full">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.deliveryDistanceThresholdKm}
                    onChange={e => handleChange('deliveryDistanceThresholdKm', e.target.value)}
                    className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-3 pr-14 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs font-bold">km</span>
                </div>
                <p className="text-xs text-on-surface-variant">Breakpoint for delivery tier pricing</p>
              </div>
            </div>

            {/* Within */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Within {form.deliveryDistanceThresholdKm} km (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.deliveryFeeWithin}
                  onChange={e => handleChange('deliveryFeeWithin', e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono disabled:opacity-40"
                  disabled={form.isFreeDeliveryEnabled}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">Less than or equal to {form.deliveryDistanceThresholdKm} km delivery</p>
            </div>

            {/* Beyond */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Beyond {form.deliveryDistanceThresholdKm} km (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.deliveryFeeOutside}
                  onChange={e => handleChange('deliveryFeeOutside', e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono disabled:opacity-40"
                  disabled={form.isFreeDeliveryEnabled}
                />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">More than {form.deliveryDistanceThresholdKm} km delivery</p>
            </div>
          </div>
        </div>

        {/* Free Delivery Overrides */}
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">redeem</span>
            Free Delivery Options
          </h2>
          <div className="flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex items-center justify-between bg-surface-container-high p-4 rounded-xl border border-white/5">
              <div>
                <p className="text-sm font-bold">Enable Free Delivery for All Orders</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Overrides all delivery fee tiers globally</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('isFreeDeliveryEnabled', !form.isFreeDeliveryEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${form.isFreeDeliveryEnabled ? 'bg-primary' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.isFreeDeliveryEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Min Order Amount for free delivery */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                Free Delivery Min. Order Amount (Rs.) <span className="text-white/30 normal-case font-normal">— 0 to disable</span>
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-sm">Rs.</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.freeDeliveryMinOrderAmount}
                  onChange={e => handleChange('freeDeliveryMinOrderAmount', e.target.value)}
                  className="w-full bg-surface-container-high border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1">
                {Number(form.freeDeliveryMinOrderAmount) > 0
                  ? `Orders with subtotal >= Rs.${form.freeDeliveryMinOrderAmount} get free delivery`
                  : 'This feature is disabled (set above 0 to enable)'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-4 bg-primary/5 border-b border-white/5">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
            <div className="text-xs text-on-surface-variant leading-relaxed">
              <p className="font-bold text-on-surface mb-1">How fees are applied at checkout</p>
              <p>
                Platform fee is always added. Delivery fee is based on the customer location pin distance.
                Currently: <strong className="text-on-surface">within {form.deliveryDistanceThresholdKm} km = Rs.{form.deliveryFeeWithin}</strong> and{' '}
                <strong className="text-on-surface">beyond = Rs.{form.deliveryFeeOutside}</strong>.
                Changes take effect immediately on the next order.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-6">
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 hover:opacity-90 active:scale-98 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">save</span>
                Save Fee Settings
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default FeeSettingsPage;
