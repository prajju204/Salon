import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const API = `${API_BASE}/api/admin`;

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Approved: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    Refunded: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };
  const icons = { Pending: 'schedule', Approved: 'thumb_up', Rejected: 'cancel', Refunded: 'check_circle' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.Pending}`}>
      <span className="material-symbols-outlined text-xs">{icons[status] || 'schedule'}</span>
      {status}
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

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const RefundManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') === 'Online' ? 'Online' : 'Salon';
  const initialAppointmentId = searchParams.get('appointmentId') || '';

  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState([]);
  const [salonPendingCount, setSalonPendingCount] = useState(0);
  const [onlinePendingCount, setOnlinePendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refundCategory, setRefundCategory] = useState(initialCategory); // 'Salon' or 'Online'
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [processModal, setProcessModal] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // appointmentId used to highlight / auto-open specific record from Appointments page
  const [highlightAppointmentId, setHighlightAppointmentId] = useState(initialAppointmentId);
  const limit = 10;

  // Sync category and appointmentId with URL query params
  useEffect(() => {
    const cat = searchParams.get('category');
    const aptId = searchParams.get('appointmentId') || '';
    if (cat && (cat === 'Salon' || cat === 'Online') && cat !== refundCategory) {
      setRefundCategory(cat);
    }
    if (aptId !== highlightAppointmentId) {
      setHighlightAppointmentId(aptId);
    }
  }, [searchParams]);

  // Fetch pending counts for both tabs so badges always show accurately
  const fetchCategoryPendingCounts = useCallback(async () => {
    try {
      const [salonRes, onlineRes] = await Promise.all([
        axios.get(`${API}/refunds`, {
          headers: authHeader(),
          params: { refundCategory: 'Salon', status: 'Pending', limit: 1 }
        }),
        axios.get(`${API}/refunds`, {
          headers: authHeader(),
          params: { refundCategory: 'Online', status: 'Pending', limit: 1 }
        })
      ]);
      setSalonPendingCount(salonRes.data?.total || 0);
      setOnlinePendingCount(onlineRes.data?.total || 0);
    } catch {
      // ignore badge fetch errors
    }
  }, []);

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/refunds`, {
        headers: authHeader(),
        params: { status: statusFilter, refundCategory, search, startDate, endDate, page, limit }
      });
      if (res.data.success) {
        const data = res.data.data || [];
        setRefunds(data);
        setTotal(res.data.total || 0);
        setStats(res.data.stats || []);

        // If we arrived here from a specific appointment, auto-open its refund
        if (highlightAppointmentId && data.length > 0) {
          const matched = data.find(r => r.appointmentId === highlightAppointmentId);
          if (matched) {
            setProcessModal(matched);
            setTransactionRef('');
            setAdminNotes('');
            // Clear the highlight so it doesn't re-open on every refresh
            setHighlightAppointmentId('');
          }
        }
      }
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, refundCategory, search, startDate, endDate, page, highlightAppointmentId]);

  useEffect(() => {
    fetchRefunds();
    fetchCategoryPendingCounts();
  }, [fetchRefunds, fetchCategoryPendingCounts]);

  const handleProcess = async () => {
    if (!processModal) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/refunds/${processModal._id}/process`,
        { transactionRef, adminNotes }, { headers: authHeader() });
      toast.success(`Refund of ₹${processModal.refundAmount} accepted & marked as refunded!`);
      setProcessModal(null);
      fetchRefunds();
      fetchCategoryPendingCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept refund');
    } finally {
      setSubmitting(false);
    }
  };

  const switchCategory = (cat) => {
    setRefundCategory(cat);
    setPage(1);
    setSearchParams({ category: cat });
  };

  const totalPages = Math.ceil(total / limit);
  const getTotal = (s) => stats.find(x => x._id === s)?.total || 0;
  const getCount = (s) => stats.find(x => x._id === s)?.count || 0;

  const totalRefunded = getTotal('Refunded');
  const pendingCount = getCount('Pending');

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">currency_rupee</span>
            Refund Management
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Track and process customer refunds</p>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-surface-container border border-white/10 p-1 rounded-2xl w-full max-w-md mb-6">
          <button
            onClick={() => switchCategory('Salon')}
            className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              refundCategory === 'Salon' 
                ? 'bg-primary text-on-primary shadow-lg' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span>Salon Refunds</span>
            {salonPendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                refundCategory === 'Salon' ? 'bg-black/20 text-on-primary' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {salonPendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => switchCategory('Online')}
            className={`flex-1 py-2.5 px-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              refundCategory === 'Online' 
                ? 'bg-primary text-on-primary shadow-lg' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span>Online Returns</span>
            {onlinePendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                refundCategory === 'Online' ? 'bg-black/20 text-on-primary' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {onlinePendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Pending Refunds', value: pendingCount, color: 'text-amber-400', icon: 'schedule' },
            { label: 'Total Refunded', value: `₹${totalRefunded.toLocaleString('en-IN')}`, color: 'text-emerald-400', icon: 'check_circle' },
            { label: 'Refunded Count', value: getCount('Refunded'), color: 'text-blue-400', icon: 'receipt' },
            { label: 'Rejected', value: getCount('Rejected'), color: 'text-red-400', icon: 'cancel' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container border border-white/10 rounded-2xl p-4">
              <span className={`material-symbols-outlined text-2xl ${s.color}`}>{s.icon}</span>
              <p className={`text-xl font-bold mt-2 ${s.color}`}>{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by customer…" className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Refunded">Refunded</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>

        {/* Table */}
        <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface-container-high rounded-xl animate-pulse" />)}</div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">currency_rupee</span>
              <p className="text-on-surface-variant mt-3">No refunds found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Customer', refundCategory === 'Salon' ? 'Service' : 'Order Items', refundCategory === 'Salon' ? 'Appt. Date' : 'Order ID', 'Original', 'Refund Amt', 'Method', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r, i) => (
                    <tr key={r._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${
                      r.appointmentId && r.appointmentId === initialAppointmentId
                        ? 'ring-2 ring-inset ring-amber-500/50 bg-amber-500/5'
                        : i % 2 === 0 ? '' : 'bg-white/[0.01]'
                    }`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{r.customerName}</p>
                        <p className="text-xs text-on-surface-variant">{r.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {refundCategory === 'Salon' ? (
                          <>
                            <p className="text-on-surface">{r.serviceName || '—'}</p>
                            <p className="text-xs text-on-surface-variant">{r.barberName}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-on-surface">{r.orderId?.items?.length ? `${r.orderId.items.length} items` : 'Online Order'}</p>
                            <p className="text-xs text-on-surface-variant truncate max-w-[120px]">
                              {r.orderId?.items?.map(it => it.name).join(', ') || '—'}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {refundCategory === 'Salon' ? (r.appointmentDate || '—') : (r.orderId?.receiptNumber || '—')}
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">₹{(r.originalAmount || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-emerald-400">₹{(r.refundAmount || 0).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-on-surface-variant">{r.refundPercentage}%</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.method}</td>
                      <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3">
                        {r.status === 'Pending' && (
                          <button
                            onClick={() => { setProcessModal(r); setTransactionRef(''); setAdminNotes(''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
                            title="Accept and approve this refund"
                          >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Accept Refund
                          </button>
                        )}
                        {r.transactionRef && (
                          <p className="text-xs text-on-surface-variant font-mono">{r.transactionRef}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
              <span className="text-xs text-on-surface-variant">Showing {((page-1)*limit)+1}–{Math.min(page*limit,total)} of {total}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 hover:bg-white/10 cursor-pointer">←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1.5 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 hover:bg-white/10 cursor-pointer">→</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accept / Process Refund Modal */}
      <Modal open={!!processModal} onClose={() => setProcessModal(null)}>
        {processModal && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                Accept & Process Refund
              </h2>
              <button onClick={() => setProcessModal(null)} className="text-on-surface-variant hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant">Approving and processing refund of</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">₹{processModal.refundAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-on-surface-variant mt-1">to {processModal.customerName}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                  Credited directly to Customer's Digital Wallet
                </div>
                {processModal.orderId && (
                  <p className="text-[11px] text-emerald-300/80 mt-2 font-mono">Order: {processModal.orderId.receiptNumber || processModal.orderId._id}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Transaction / Refund Reference (optional)</label>
                <input value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="e.g. TXN-REF-2024-XXXXXXXX" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Admin Notes (optional)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Refund reason or notes…" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setProcessModal(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleProcess} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 cursor-pointer flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">check_circle</span>
                {submitting ? 'Processing…' : 'Accept & Complete Refund'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundManagement;
