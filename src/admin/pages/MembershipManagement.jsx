import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/admin';

const TIER_COLORS = {
  Basic: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-300', icon: '👤' },
  Silver: { bg: 'bg-slate-400/10', border: 'border-slate-400/30', text: 'text-slate-300', icon: '🥈' },
  Gold: { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary', icon: '⭐' },
  Platinum: { bg: 'bg-white/5', border: 'border-white/20', text: 'text-white', icon: '💎' },
};

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MembershipManagement = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/memberships`, { headers: authHeader() });
      if (res.data.success) setMemberships(res.data.data || []);
    } catch {
      // Use default tiers
      setMemberships([
        { _id: '1', tier: 'Basic', minSpend: 0, discountPercentage: 0, priorityBooking: false, freeGroomingSessions: 0, rewardPointMultiplier: 1, description: 'Welcome tier for all new members' },
        { _id: '2', tier: 'Silver', minSpend: 5000, discountPercentage: 5, priorityBooking: false, freeGroomingSessions: 0, rewardPointMultiplier: 1.5, description: 'Earn more points and unlock member discounts' },
        { _id: '3', tier: 'Gold', minSpend: 15000, discountPercentage: 10, priorityBooking: true, freeGroomingSessions: 1, rewardPointMultiplier: 2, description: 'Priority booking, exclusive services, and double points' },
        { _id: '4', tier: 'Platinum', minSpend: 40000, discountPercentage: 15, priorityBooking: true, freeGroomingSessions: 2, rewardPointMultiplier: 3, description: 'The ultimate luxury experience with maximum rewards' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const startEdit = (m) => {
    setEditingTier(m._id);
    setForm({
      discountPercentage: m.discountPercentage,
      minSpend: m.minSpend,
      priorityBooking: m.priorityBooking,
      freeGroomingSessions: m.freeGroomingSessions,
      rewardPointMultiplier: m.rewardPointMultiplier,
      description: m.description,
      exclusiveServices: Array.isArray(m.exclusiveServices) ? m.exclusiveServices.join(', ') : ''
    });
  };

  const handleSave = async (id) => {
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        discountPercentage: Number(form.discountPercentage),
        minSpend: Number(form.minSpend),
        freeGroomingSessions: Number(form.freeGroomingSessions),
        rewardPointMultiplier: Number(form.rewardPointMultiplier),
        exclusiveServices: form.exclusiveServices ? form.exclusiveServices.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      await axios.put(`${API}/memberships/${id}`, payload, { headers: authHeader() });
      toast.success('Membership tier updated');
      setEditingTier(null);
      fetchMemberships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const tiers = ['Basic', 'Silver', 'Gold', 'Platinum'];

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">workspace_premium</span>
            Membership Management
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure membership tiers, benefits, and reward multipliers</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-60 bg-surface-container rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tiers.map(tierName => {
              const m = memberships.find(x => x.tier === tierName);
              if (!m) return null;
              const colors = TIER_COLORS[tierName];
              const isEditing = editingTier === m._id;

              return (
                <div key={m._id} className={`${colors.bg} border ${colors.border} rounded-2xl p-6 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{colors.icon}</span>
                      <div>
                        <h3 className={`text-xl font-bold ${colors.text}`}>{m.tier}</h3>
                        <p className="text-xs text-on-surface-variant mt-0.5">Min. spend: ₹{(m.minSpend || 0).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    {!isEditing && (
                      <button onClick={() => startEdit(m)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 cursor-pointer">
                        <span className="material-symbols-outlined text-base">edit</span>
                        Edit
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">Min. Spend (₹)</label>
                          <input type="number" min="0" value={form.minSpend} onChange={e => setForm(f => ({ ...f, minSpend: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">Discount %</label>
                          <input type="number" min="0" max="100" value={form.discountPercentage} onChange={e => setForm(f => ({ ...f, discountPercentage: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">Points Multiplier</label>
                          <input type="number" min="0.1" step="0.1" value={form.rewardPointMultiplier} onChange={e => setForm(f => ({ ...f, rewardPointMultiplier: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
                        </div>
                        <div>
                          <label className="text-xs text-on-surface-variant mb-1 block">Free Sessions/Month</label>
                          <input type="number" min="0" value={form.freeGroomingSessions} onChange={e => setForm(f => ({ ...f, freeGroomingSessions: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Exclusive Services (comma-separated)</label>
                        <input value={form.exclusiveServices} onChange={e => setForm(f => ({ ...f, exclusiveServices: e.target.value }))} placeholder="e.g. Executive Cut, Royal Treatment" className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
                      </div>
                      <div>
                        <label className="text-xs text-on-surface-variant mb-1 block">Description</label>
                        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
                      </div>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" id={`pb-${m._id}`} checked={form.priorityBooking} onChange={e => setForm(f => ({ ...f, priorityBooking: e.target.checked }))} className="w-4 h-4 accent-primary cursor-pointer" />
                        <label htmlFor={`pb-${m._id}`} className="text-sm text-on-surface cursor-pointer">Priority Booking</label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setEditingTier(null)} className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-on-surface-variant hover:bg-white/5 cursor-pointer">Cancel</button>
                        <button onClick={() => handleSave(m._id)} disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-on-primary text-sm font-bold hover:bg-primary-container disabled:opacity-60 cursor-pointer">
                          {submitting ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-on-surface-variant">{m.description}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {[
                          { label: 'Discount', value: `${m.discountPercentage}%` },
                          { label: 'Points ×', value: `${m.rewardPointMultiplier}x` },
                          { label: 'Priority Booking', value: m.priorityBooking ? '✓ Yes' : '✗ No' },
                          { label: 'Free Sessions', value: `${m.freeGroomingSessions}/mo` },
                        ].map(b => (
                          <div key={b.label} className="bg-black/20 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">{b.label}</p>
                            <p className={`text-sm font-bold mt-0.5 ${colors.text}`}>{b.value}</p>
                          </div>
                        ))}
                      </div>
                      {m.exclusiveServices?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-on-surface-variant mb-1">Exclusive Services:</p>
                          <div className="flex flex-wrap gap-1">
                            {m.exclusiveServices.map(s => (
                              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} border ${colors.border} ${colors.text}`}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-primary">info</span>
            <div>
              <p className="text-sm font-semibold text-on-surface">Automatic Tier Upgrades</p>
              <p className="text-xs text-on-surface-variant mt-1">Customers are automatically upgraded to the appropriate tier based on their total lifetime spend. Changes to tier thresholds take effect immediately for all new spending milestones.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembershipManagement;
