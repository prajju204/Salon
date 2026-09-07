import React, { useState, useEffect, useCallback } from 'react';
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
  const [refunds, setRefunds] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [processModal, setProcessModal] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/refunds`, {
        headers: authHeader(),
        params: { status: statusFilter, search, startDate, endDate, page, limit }
      });
      if (res.data.success) {
        setRefunds(res.data.data || []);
        setTotal(res.data.total || 0);
        setStats(res.data.stats || []);
      }
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, startDate, endDate, page]);

  useEffect(() => { fetchRefunds(); }, [fetchRefunds]);

  const handleProcess = async () => {
    if (!processModal) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/refunds/${processModal._id}/process`,
        { transactionRef, adminNotes }, { headers: authHeader() });
      toast.success(`Refund of ₹${processModal.refundAmount} marked as processed`);
      setProcessModal(null);
      fetchRefunds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process refund');
    } finally {
      setSubmitting(false);
    }
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
                    {['Customer', 'Service', 'Appt. Date', 'Original', 'Refund Amt', 'Method', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r, i) => (
                    <tr key={r._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{r.customerName}</p>
                        <p className="text-xs text-on-surface-variant">{r.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-on-surface">{r.serviceName || '—'}</p>
                        <p className="text-xs text-on-surface-variant">{r.barberName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{r.appointmentDate || '—'}</td>
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
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">payments</span>
                            Process
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

      {/* Process Refund Modal */}
      <Modal open={!!processModal} onClose={() => setProcessModal(null)}>
        {processModal && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">payments</span>
                Process Refund
              </h2>
              <button onClick={() => setProcessModal(null)} className="text-on-surface-variant hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-on-surface-variant">Processing refund of</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">₹{processModal.refundAmount.toLocaleString('en-IN')}</p>
                <p className="text-xs text-on-surface-variant mt-1">to {processModal.customerName} via {processModal.method}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Transaction Reference (optional)</label>
                <input value={transactionRef} onChange={e => setTransactionRef(e.target.value)} placeholder="e.g. TXN-2024-XXXXXXXX" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Admin Notes (optional)</label>
                <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Any additional notes…" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setProcessModal(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleProcess} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 cursor-pointer">
                {submitting ? 'Processing…' : 'Mark as Refunded'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RefundManagement;
