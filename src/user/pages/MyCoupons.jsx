import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth`;

const authHeader = () => {
  const token = localStorage.getItem('luxe_user_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CouponCard = ({ coupon, onCopy }) => {
  const isExpiring = coupon.validUntil && (new Date(coupon.validUntil) - new Date()) < 3 * 24 * 60 * 60 * 1000;
  const daysLeft = coupon.validUntil
    ? Math.ceil((new Date(coupon.validUntil) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all group"
    >
      {/* Top color band */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-primary-container" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-on-surface">{coupon.name}</h3>
            {coupon.description && <p className="text-xs text-on-surface-variant mt-0.5">{coupon.description}</p>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-black text-primary">
              {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wide">
              {coupon.discountType === 'percentage' ? 'Discount' : 'Off'}
            </span>
          </div>
        </div>

        {/* Code + Copy */}
        <div className="flex items-center gap-2 bg-surface-container-high rounded-xl px-4 py-2.5 mb-4 group/code cursor-pointer"
          onClick={() => onCopy(coupon.code)}>
          <span className="material-symbols-outlined text-primary text-lg">local_activity</span>
          <code className="flex-1 text-primary font-bold tracking-[0.15em] text-sm">{coupon.code}</code>
          <span className="material-symbols-outlined text-on-surface-variant text-base group-hover/code:text-primary transition-colors">content_copy</span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-xs text-on-surface-variant">
          {coupon.minBookingAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">shopping_bag</span>
              Min. booking: ₹{coupon.minBookingAmount.toLocaleString('en-IN')}
            </div>
          )}
          {coupon.maxDiscount && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">price_check</span>
              Max. discount: ₹{coupon.maxDiscount.toLocaleString('en-IN')}
            </div>
          )}
          {coupon.applicableServices?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">content_cut</span>
              {coupon.applicableServices.join(', ')}
            </div>
          )}
        </div>

        {/* Expiry */}
        <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${isExpiring ? 'text-red-400' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-base">{isExpiring ? 'warning' : 'event'}</span>
          {daysLeft !== null
            ? daysLeft <= 0 ? 'Expires today!'
              : isExpiring ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — Hurry!`
              : `Valid until ${new Date(coupon.validUntil).toLocaleDateString('en-IN')}`
            : 'No expiry'}
        </div>

        {/* Usage info */}
        {coupon.usageLimit && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-on-surface-variant mb-1">
              <span>Used</span>
              <span>{coupon.usedCount}/{coupon.usageLimit}</span>
            </div>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 rounded-full" style={{ width: `${Math.min(100, (coupon.usedCount / coupon.usageLimit) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MyCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/coupons`, { headers: authHeader() });
      if (res.data.success) setCoupons(res.data.data || []);
    } catch {
      // Use demo coupons
      setCoupons([
        {
          _id: '1', code: 'WELCOME20', name: 'Welcome Offer',
          description: 'Get 20% off your first booking with us!',
          discountType: 'percentage', discountValue: 20,
          minBookingAmount: 300, maxDiscount: 500,
          validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          usedCount: 45, usageLimit: 100, applicableServices: []
        },
        {
          _id: '2', code: 'MONSOON25', name: 'Monsoon Special',
          description: '25% off all facial treatments this season.',
          discountType: 'percentage', discountValue: 25,
          minBookingAmount: 500, maxDiscount: 750,
          validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          usedCount: 20, usageLimit: 50, applicableServices: ['Facial', 'Face Mask']
        },
        {
          _id: '3', code: 'FLAT200', name: 'Flat ₹200 Off',
          description: 'Flat ₹200 discount on any booking above ₹999.',
          discountType: 'fixed', discountValue: 200,
          minBookingAmount: 999, maxDiscount: null,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          usedCount: 0, usageLimit: null, applicableServices: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
    toast.success(`Code "${code}" copied to clipboard!`);
  };

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
            My Coupons
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Available discounts for your next booking</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search coupons by code or name…"
            className="w-full bg-surface-container border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50"
          />
        </div>

        {/* How to use banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">info</span>
          <p className="text-sm text-on-surface-variant">
            Copy any coupon code and apply it during booking on the <strong className="text-on-surface">Confirm & Pay</strong> step. Coupons cannot be combined with loyalty points in the same booking.
          </p>
        </div>

        {/* Coupons Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">local_activity</span>
            <p className="text-on-surface-variant mt-3">
              {searchQuery ? `No coupons matching "${searchQuery}"` : 'No available coupons right now. Check back soon!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(c => (
                <CouponCard key={c._id} coupon={c} onCopy={handleCopy} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCoupons;
