import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const API = `${API_BASE}/api/auth`;

const authHeader = () => {
  const token = localStorage.getItem('luxe_user_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const TIER_CONFIG = {
  Basic: { color: 'text-zinc-300', bg: 'from-zinc-700 to-zinc-900', border: 'border-zinc-600', icon: '👤', next: 'Silver' },
  Silver: { color: 'text-slate-200', bg: 'from-slate-500 to-slate-700', border: 'border-slate-400', icon: '🥈', next: 'Gold' },
  Gold: { color: 'text-primary', bg: 'from-amber-600 to-yellow-900', border: 'border-primary', icon: '⭐', next: 'Platinum' },
  Platinum: { color: 'text-white', bg: 'from-gray-400 to-gray-700', border: 'border-white/50', icon: '💎', next: null },
};

const TxIcon = ({ type }) => {
  const map = {
    earned: { icon: 'add_circle', cls: 'text-emerald-400' },
    redeemed: { icon: 'remove_circle', cls: 'text-amber-400' },
    expired: { icon: 'cancel', cls: 'text-red-400' },
    bonus: { icon: 'stars', cls: 'text-primary' },
    adjusted: { icon: 'tune', cls: 'text-blue-400' },
  };
  const { icon, cls } = map[type] || map.adjusted;
  return <span className={`material-symbols-outlined text-xl ${cls}`}>{icon}</span>;
};

const MyRewards = () => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | history | membership

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/loyalty`, { headers: authHeader() });
      if (res.data.success) setAccount(res.data.data);
    } catch {
      // Demo data
      setAccount({
        points: 1250,
        totalEarned: 2400,
        totalRedeemed: 1150,
        totalSpend: 18500,
        membershipTier: 'Gold',
        pointsValue: 625,
        loyaltySettings: { pointsPerHundred: 10, redemptionValue: 0.5, minRedeemablePoints: 100, maxRedeemablePoints: 5000 },
        currentTier: { tier: 'Gold', discountPercentage: 10, priorityBooking: true, freeGroomingSessions: 1, rewardPointMultiplier: 2, description: 'Priority booking, exclusive services, and double points' },
        nextTier: { tier: 'Platinum', minSpend: 40000 },
        memberships: [
          { tier: 'Basic', minSpend: 0, discountPercentage: 0, priorityBooking: false, freeGroomingSessions: 0, rewardPointMultiplier: 1 },
          { tier: 'Silver', minSpend: 5000, discountPercentage: 5, priorityBooking: false, freeGroomingSessions: 0, rewardPointMultiplier: 1.5 },
          { tier: 'Gold', minSpend: 15000, discountPercentage: 10, priorityBooking: true, freeGroomingSessions: 1, rewardPointMultiplier: 2 },
          { tier: 'Platinum', minSpend: 40000, discountPercentage: 15, priorityBooking: true, freeGroomingSessions: 2, rewardPointMultiplier: 3 },
        ],
        transactions: [
          { _id: '1', type: 'earned', points: 180, description: 'Points earned for appointment', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), balance: 1250 },
          { _id: '2', type: 'redeemed', points: -200, description: 'Points redeemed for appointment discount', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), balance: 1070 },
          { _id: '3', type: 'earned', points: 350, description: 'Points earned for appointment', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), balance: 1270 },
          { _id: '4', type: 'bonus', points: 100, description: 'Welcome bonus points', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), balance: 920 },
        ]
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccount(); }, [fetchAccount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-surface-container rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  const tier = account?.membershipTier || 'Basic';
  const tierCfg = TIER_CONFIG[tier] || TIER_CONFIG.Basic;
  const nextTierMinSpend = account?.nextTier?.minSpend;
  const progressPct = nextTierMinSpend
    ? Math.min(100, Math.round(((account?.totalSpend || 0) / nextTierMinSpend) * 100))
    : 100;
  const spendToNext = nextTierMinSpend ? Math.max(0, nextTierMinSpend - (account?.totalSpend || 0)) : 0;
  const currentTierData = account?.currentTier;
  const settings = account?.loyaltySettings;

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">stars</span>
            My Rewards
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Your loyalty points, membership, and reward history</p>
        </div>

        {/* Points Balance Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tierCfg.bg} border ${tierCfg.border} p-6 md:p-8 mb-6`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/20" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/20" />
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">Current Balance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-black text-white">{(account?.points || 0).toLocaleString('en-IN')}</span>
                  <span className="text-white/60 text-lg">pts</span>
                </div>
                <p className="text-white/70 text-sm mt-1">≈ ₹{((account?.points || 0) * (settings?.redemptionValue || 0.5)).toFixed(2)} value</p>
              </div>
              <div className="text-right">
                <div className="text-3xl mb-1">{tierCfg.icon}</div>
                <span className={`text-xl font-black ${tierCfg.color}`}>{tier}</span>
                <p className="text-white/60 text-xs uppercase tracking-widest mt-0.5">Member</p>
              </div>
            </div>

            {/* Tier Progress */}
            {account?.nextTier && (
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>₹{(account?.totalSpend || 0).toLocaleString('en-IN')} spent</span>
                  <span>₹{spendToNext.toLocaleString('en-IN')} to {account.nextTier.tier}</span>
                </div>
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-white/70 rounded-full"
                  />
                </div>
                <p className="text-xs text-white/60 mt-1.5">{progressPct}% progress to {account.nextTier.tier}</p>
              </div>
            )}
            {!account?.nextTier && (
              <div className="flex items-center gap-2 mt-2">
                <span className="material-symbols-outlined text-white text-lg">verified</span>
                <span className="text-sm text-white/80">You've reached the highest tier!</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Earned', value: (account?.totalEarned || 0).toLocaleString(), icon: 'trending_up', color: 'text-emerald-400' },
            { label: 'Total Redeemed', value: (account?.totalRedeemed || 0).toLocaleString(), icon: 'redeem', color: 'text-amber-400' },
            { label: 'Lifetime Spend', value: `₹${((account?.totalSpend || 0) / 1000).toFixed(1)}k`, icon: 'payments', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container border border-white/10 rounded-2xl p-4 text-center">
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
              <p className="text-lg font-bold text-on-surface mt-1">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: 'overview', label: 'How to Earn', icon: 'info' },
            { id: 'history', label: 'Transaction History', icon: 'receipt_long' },
            { id: 'membership', label: 'All Tiers', icon: 'workspace_premium' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">stars</span>
                Your {tier} Benefits
              </h3>
              {currentTierData && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Member Discount', value: `${currentTierData.discountPercentage}% off`, icon: 'discount', active: currentTierData.discountPercentage > 0 },
                    { label: 'Priority Booking', value: 'Yes', icon: 'priority_high', active: currentTierData.priorityBooking },
                    { label: 'Points Multiplier', value: `${currentTierData.rewardPointMultiplier}×`, icon: 'multiply', active: true },
                    { label: 'Free Sessions', value: `${currentTierData.freeGroomingSessions}/month`, icon: 'spa', active: currentTierData.freeGroomingSessions > 0 },
                  ].map(b => (
                    <div key={b.label} className={`flex items-center gap-3 p-3 rounded-xl border ${b.active ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-high border-white/5 opacity-50'}`}>
                      <span className={`material-symbols-outlined ${b.active ? 'text-primary' : 'text-on-surface-variant'}`}>{b.icon}</span>
                      <div>
                        <p className="text-xs text-on-surface-variant">{b.label}</p>
                        <p className={`text-sm font-bold ${b.active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{b.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {settings && (
              <div className="bg-surface-container border border-white/10 rounded-2xl p-6">
                <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400">trending_up</span>
                  How Points Work
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-on-surface-variant">Earn rate</span>
                    <span className="text-sm font-semibold text-on-surface">{settings.pointsPerHundred} pts per ₹100 spent</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-on-surface-variant">Your multiplier</span>
                    <span className="text-sm font-semibold text-primary">{currentTierData?.rewardPointMultiplier || 1}× ({tier} tier)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-on-surface-variant">1 point = </span>
                    <span className="text-sm font-semibold text-on-surface">₹{settings.redemptionValue}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-sm text-on-surface-variant">Min. to redeem</span>
                    <span className="text-sm font-semibold text-on-surface">{settings.minRedeemablePoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-on-surface-variant">Max per booking</span>
                    <span className="text-sm font-semibold text-on-surface">{settings.maxRedeemablePoints} pts</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">info</span>
              <p className="text-sm text-on-surface-variant">
                Redeem your points on the <strong className="text-on-surface">Confirm & Pay</strong> step when booking. Points cannot be combined with coupon codes in the same booking.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
            {account?.transactions?.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant">receipt_long</span>
                <p className="text-on-surface-variant mt-3">No transactions yet. Complete your first booking to earn points!</p>
              </div>
            ) : (
              <div>
                {(account?.transactions || []).map((tx, i) => (
                  <div key={tx._id || i} className={`flex items-center gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors ${i === 0 ? '' : ''}`}>
                    <TxIcon type={tx.type} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface">{tx.description}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${tx.points > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                      </p>
                      <p className="text-xs text-on-surface-variant">Balance: {tx.balance} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'membership' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(account?.memberships || []).map(m => {
              const cfg = TIER_CONFIG[m.tier] || TIER_CONFIG.Basic;
              const isCurrent = m.tier === tier;
              return (
                <div key={m.tier} className={`relative border rounded-2xl p-5 ${isCurrent ? `bg-gradient-to-br ${cfg.bg} border-2 ${cfg.border}` : 'bg-surface-container border-white/10'}`}>
                  {isCurrent && (
                    <span className="absolute top-3 right-3 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">Your Tier</span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{cfg.icon}</span>
                    <div>
                      <h3 className={`font-bold text-lg ${isCurrent ? 'text-white' : 'text-on-surface'}`}>{m.tier}</h3>
                      <p className={`text-xs ${isCurrent ? 'text-white/70' : 'text-on-surface-variant'}`}>from ₹{m.minSpend.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { l: 'Discount', v: `${m.discountPercentage}%` },
                      { l: 'Points Multiplier', v: `${m.rewardPointMultiplier}×` },
                      { l: 'Priority Booking', v: m.priorityBooking ? '✓' : '✗' },
                      { l: 'Free Sessions/Mo', v: m.freeGroomingSessions },
                    ].map(b => (
                      <div key={b.l} className={`flex justify-between ${isCurrent ? 'text-white/80' : 'text-on-surface-variant'}`}>
                        <span>{b.l}</span>
                        <span className={`font-semibold ${isCurrent ? 'text-white' : 'text-on-surface'}`}>{b.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRewards;
