import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/admin';

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const LoyaltySettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    pointsPerHundred: 10,
    redemptionValue: 0.5,
    minRedeemablePoints: 100,
    maxRedeemablePoints: 5000,
    maxRedemptionPercent: 50,
    isEnabled: true
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/loyalty/settings`, { headers: authHeader() });
      if (res.data.success) {
        setSettings(res.data.data);
        setForm(res.data.data);
      }
    } catch { /* use defaults */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        pointsPerHundred: Number(form.pointsPerHundred),
        redemptionValue: Number(form.redemptionValue),
        minRedeemablePoints: Number(form.minRedeemablePoints),
        maxRedeemablePoints: Number(form.maxRedeemablePoints),
        maxRedemptionPercent: Number(form.maxRedemptionPercent),
        isEnabled: form.isEnabled
      };
      await axios.put(`${API}/loyalty/settings`, payload, { headers: authHeader() });
      toast.success('Loyalty settings updated successfully');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  // Computed preview
  const exampleSpend = 1000;
  const pointsEarned = Math.floor((exampleSpend / 100) * (Number(form.pointsPerHundred) || 10));
  const pointsValue = pointsEarned * (Number(form.redemptionValue) || 0.5);
  const minPoints = Number(form.minRedeemablePoints) || 100;
  const maxPoints = Number(form.maxRedeemablePoints) || 5000;

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">stars</span>
            Loyalty Program Settings
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Configure how customers earn and redeem loyalty points</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-surface-container border border-white/10 rounded-2xl p-6 animate-pulse h-80" />
            ) : (
              <form onSubmit={handleSave} className="bg-surface-container border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-on-surface">Configuration</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Program Status:</span>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                        form.isEnabled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">{form.isEnabled ? 'check_circle' : 'cancel'}</span>
                      {form.isEnabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Earning Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-xl">trending_up</span>
                      <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Earning Rules</h3>
                    </div>
                    <div className="bg-surface-container-high rounded-xl p-4">
                      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">
                        Points Earned per ₹100 Spent
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          value={form.pointsPerHundred}
                          onChange={e => setForm(f => ({ ...f, pointsPerHundred: e.target.value }))}
                          className="w-32 bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface text-lg font-bold focus:outline-none focus:border-primary/50"
                        />
                        <span className="text-on-surface-variant text-sm">points per ₹100</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-2">Customer earns {form.pointsPerHundred} points for every ₹100 spent (multiplied by tier bonus)</p>
                    </div>
                  </div>

                  {/* Redemption Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-amber-400 text-xl">redeem</span>
                      <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">Redemption Rules</h3>
                    </div>
                    <div className="bg-surface-container-high rounded-xl p-4 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Value of 1 Point (₹)</label>
                        <div className="flex items-center gap-3">
                          <span className="text-on-surface-variant text-sm">₹</span>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.redemptionValue}
                            onChange={e => setForm(f => ({ ...f, redemptionValue: e.target.value }))}
                            className="w-32 bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface text-lg font-bold focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Min. Redeemable Points</label>
                          <input
                            type="number"
                            min="0"
                            value={form.minRedeemablePoints}
                            onChange={e => setForm(f => ({ ...f, minRedeemablePoints: e.target.value }))}
                            className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Max. Redeemable Points</label>
                          <input
                            type="number"
                            min="1"
                            value={form.maxRedeemablePoints}
                            onChange={e => setForm(f => ({ ...f, maxRedeemablePoints: e.target.value }))}
                            className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">
                          Max. Redemption % of Booking Amount
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={form.maxRedemptionPercent}
                            onChange={e => setForm(f => ({ ...f, maxRedemptionPercent: e.target.value }))}
                            className="w-32 bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50"
                          />
                          <span className="text-on-surface-variant text-sm">% maximum discount per booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary-container disabled:opacity-60 cursor-pointer transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-xl">save</span>
                    {submitting ? 'Saving…' : 'Save Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Preview Card */}
          <div className="space-y-4">
            <div className="bg-surface-container border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">calculate</span>
                Live Preview
              </h3>
              <div className="space-y-3">
                <div className="bg-surface-container-high rounded-xl p-3">
                  <p className="text-xs text-on-surface-variant">Customer spends</p>
                  <p className="text-xl font-bold text-on-surface mt-1">₹{exampleSpend.toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">arrow_downward</span>
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
                  <p className="text-xs text-primary">Points earned</p>
                  <p className="text-xl font-bold text-primary mt-1">+{pointsEarned} pts</p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-400">arrow_downward</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-xs text-amber-400">Point value</p>
                  <p className="text-xl font-bold text-amber-400 mt-1">₹{pointsValue.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-container border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Redemption Limits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Min to redeem</span>
                  <span className="text-on-surface font-semibold">{minPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Max per booking</span>
                  <span className="text-on-surface font-semibold">{maxPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Max discount</span>
                  <span className="text-on-surface font-semibold">{form.maxRedemptionPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status</span>
                  <span className={`font-semibold ${form.isEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                    {form.isEnabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltySettings;
