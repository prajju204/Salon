import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API = 'http://localhost:5000/api/auth';

const authHeader = () => {
  const token = localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const StatusBadge = ({ status }) => {
  const map = {
    Pending: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: 'schedule' },
    Approved: { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: 'thumb_up' },
    Rejected: { cls: 'bg-red-500/15 text-red-400 border-red-500/30', icon: 'cancel' },
  };
  const { cls, icon } = map[status] || map.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      <span className="material-symbols-outlined text-xs">{icon}</span>
      {status}
    </span>
  );
};

const RefundStatusBadge = ({ status }) => {
  const map = {
    Pending: { cls: 'bg-amber-500/15 text-amber-400', label: 'Refund Pending' },
    Approved: { cls: 'bg-blue-500/15 text-blue-400', label: 'Refund Approved' },
    Rejected: { cls: 'bg-red-500/15 text-red-400', label: 'Refund Rejected' },
    Refunded: { cls: 'bg-emerald-500/15 text-emerald-400', label: 'Refunded ✓' },
  };
  const { cls, label } = map[status] || map.Pending;
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{label}</span>;
};

const TypeLabel = ({ type }) => {
  const map = {
    free: { cls: 'text-emerald-400', label: 'Free Cancellation', icon: 'check_circle' },
    late: { cls: 'text-amber-400', label: 'Late Cancellation', icon: 'warning' },
    'no-show': { cls: 'text-red-400', label: 'No-Show', icon: 'person_off' },
  };
  const { cls, label, icon } = map[type] || map.late;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label}
    </span>
  );
};

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const DEMO_CANCELLATIONS = [
  {
    _id: 'c1',
    customerName: 'James Mercer',
    appointmentSnapshot: { serviceName: 'Executive Scissor Cut', barberName: 'Alexander Wright', date: '2026-06-28', time: '14:00', originalAmount: 850 },
    reasonCategory: 'Schedule Conflict',
    reason: 'Had an urgent work meeting scheduled at the same time.',
    status: 'Approved',
    cancellationType: 'free',
    refundAmount: 850,
    refundPercentage: 100,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    refund: { status: 'Refunded', refundAmount: 850, method: 'Original Payment Method' }
  },
  {
    _id: 'c2',
    customerName: 'James Mercer',
    appointmentSnapshot: { serviceName: 'Classic Hot Towel Shave', barberName: 'Marcus Sterling', date: '2026-07-01', time: '11:00', originalAmount: 600 },
    reasonCategory: 'Emergency',
    reason: 'Family emergency on the day of appointment.',
    status: 'Pending',
    cancellationType: 'late',
    refundAmount: 300,
    refundPercentage: 50,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    refund: null
  }
];

const CancellationHistoryPage = () => {
  const [cancellations, setCancellations] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('history'); // history | policy

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cancelRes, policyRes] = await Promise.allSettled([
        axios.get(`${API}/cancellations`, { headers: authHeader() }),
        axios.get(`${API}/cancellations/policy`, { headers: authHeader() })
      ]);

      if (cancelRes.status === 'fulfilled' && cancelRes.value.data.success) {
        setCancellations(cancelRes.value.data.data || []);
      } else {
        setCancellations(DEMO_CANCELLATIONS);
      }

      if (policyRes.status === 'fulfilled' && policyRes.value.data.success) {
        setPolicy(policyRes.value.data.data);
      } else {
        setPolicy({
          freeCancellationHours: 24,
          lateCancellationDeductionPercent: 50,
          noShowDeductionPercent: 100,
          policyText: 'Free cancellation up to 24 hours before your appointment. Late cancellations (less than 24 hours) will incur a 50% charge. No-shows will be charged the full amount.'
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pendingCount = cancellations.filter(c => c.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">cancel</span>
            Cancellation History
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Track your appointment cancellations and refund status</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Requests', value: cancellations.length, icon: 'receipt', color: 'text-on-surface' },
            { label: 'Pending Review', value: pendingCount, icon: 'schedule', color: 'text-amber-400' },
            { label: 'Approved', value: cancellations.filter(c => c.status === 'Approved').length, icon: 'check_circle', color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container border border-white/10 rounded-2xl p-4 text-center">
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: 'history', label: 'My Cancellations', icon: 'history' },
            { id: 'policy', label: 'Cancellation Policy', icon: 'policy' },
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

        {activeTab === 'history' && (
          <>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-surface-container rounded-2xl animate-pulse" />)}
              </div>
            ) : cancellations.length === 0 ? (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant">cancel</span>
                <p className="text-on-surface-variant mt-3">No cancellation requests yet.</p>
                <p className="text-xs text-on-surface-variant mt-1">To cancel an appointment, go to Appointment History and use the Cancel option.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {cancellations.map((c, i) => (
                    <motion.div
                      key={c._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-surface-container border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-on-surface">{c.appointmentSnapshot?.serviceName}</h3>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="text-xs text-on-surface-variant">with {c.appointmentSnapshot?.barberName}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {c.appointmentSnapshot?.date} at {c.appointmentSnapshot?.time}
                          </p>
                          <div className="mt-2">
                            <TypeLabel type={c.cancellationType} />
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-on-surface-variant">Refund</p>
                          <p className={`text-lg font-bold ${c.refundAmount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ₹{(c.refundAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-on-surface-variant">{c.refundPercentage}% of ₹{c.appointmentSnapshot?.originalAmount?.toLocaleString('en-IN')}</p>
                          {c.refund && (
                            <div className="mt-1">
                              <RefundStatusBadge status={c.refund.status} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                        <p className="text-xs text-on-surface-variant line-clamp-1 flex-1 mr-2">
                          <span className="font-semibold">{c.reasonCategory}:</span> {c.reason}
                        </p>
                        <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {activeTab === 'policy' && policy && (
          <div className="space-y-4">
            <div className="bg-surface-container border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">policy</span>
                Cancellation Policy
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">{policy.policyText}</p>

              <div className="space-y-4">
                {[
                  {
                    icon: 'check_circle',
                    iconCls: 'text-emerald-400',
                    bg: 'bg-emerald-500/5 border-emerald-500/20',
                    title: 'Free Cancellation',
                    desc: `Cancel at least ${policy.freeCancellationHours} hours before your appointment to receive a 100% refund.`
                  },
                  {
                    icon: 'warning',
                    iconCls: 'text-amber-400',
                    bg: 'bg-amber-500/5 border-amber-500/20',
                    title: 'Late Cancellation',
                    desc: `Cancellation within ${policy.freeCancellationHours} hours of your appointment incurs a ${policy.lateCancellationDeductionPercent}% charge. You receive ${100 - policy.lateCancellationDeductionPercent}% refund.`
                  },
                  {
                    icon: 'person_off',
                    iconCls: 'text-red-400',
                    bg: 'bg-red-500/5 border-red-500/20',
                    title: 'No-Show',
                    desc: `If you do not attend without cancellation, ${policy.noShowDeductionPercent}% of the booking amount is charged. ${100 - policy.noShowDeductionPercent > 0 ? `You receive a ${100 - policy.noShowDeductionPercent}% refund.` : 'No refund is issued.'}`
                  }
                ].map(rule => (
                  <div key={rule.title} className={`border rounded-2xl p-4 flex gap-4 ${rule.bg}`}>
                    <span className={`material-symbols-outlined text-2xl flex-shrink-0 ${rule.iconCls}`}>{rule.icon}</span>
                    <div>
                      <h4 className="font-semibold text-on-surface">{rule.title}</h4>
                      <p className="text-sm text-on-surface-variant mt-1">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-3">
              <span className="material-symbols-outlined text-primary text-xl flex-shrink-0">info</span>
              <div>
                <p className="text-sm font-semibold text-on-surface">Need Help?</p>
                <p className="text-xs text-on-surface-variant mt-1">If you need to cancel your appointment, go to <strong>Appointments</strong> and use the cancel option. Refunds are typically processed within 3–7 business days.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface">Cancellation Details</h2>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Service</span>
                  <span className="text-sm font-semibold text-on-surface">{selected.appointmentSnapshot?.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Staff</span>
                  <span className="text-sm text-on-surface">{selected.appointmentSnapshot?.barberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Date & Time</span>
                  <span className="text-sm text-on-surface">{selected.appointmentSnapshot?.date} {selected.appointmentSnapshot?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-on-surface-variant">Original Amount</span>
                  <span className="text-sm font-semibold text-on-surface">₹{selected.appointmentSnapshot?.originalAmount}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-on-surface-variant mb-1">Reason ({selected.reasonCategory})</p>
                <p className="text-sm text-on-surface bg-surface-container-high rounded-xl p-3">{selected.reason}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-container-high rounded-xl p-3">
                  <TypeLabel type={selected.cancellationType} />
                  <p className="text-xs text-on-surface-variant mt-1">Type</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-3">
                  <p className={`text-lg font-bold ${selected.refundAmount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{selected.refundAmount}</p>
                  <p className="text-xs text-on-surface-variant">Refund</p>
                </div>
                <div className="bg-surface-container-high rounded-xl p-3">
                  <StatusBadge status={selected.status} />
                  <p className="text-xs text-on-surface-variant mt-1">Status</p>
                </div>
              </div>

              {selected.refund && (
                <div className="bg-surface-container-high rounded-xl p-4">
                  <p className="text-xs text-on-surface-variant mb-2">Refund Status</p>
                  <div className="flex items-center justify-between">
                    <RefundStatusBadge status={selected.refund.status} />
                    <span className="text-sm text-on-surface-variant">{selected.refund.method}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CancellationHistoryPage;
