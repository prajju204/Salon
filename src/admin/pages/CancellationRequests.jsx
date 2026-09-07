import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const API = `${API_BASE}/api/admin`;

const StatusBadge = ({ status }) => {
  const map = {
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  const icons = { Pending: 'schedule', Approved: 'check_circle', Rejected: 'cancel' };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.Pending}`}>
      <span className="material-symbols-outlined text-xs">{icons[status] || 'schedule'}</span>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const map = {
    free: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    late: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'no-show': 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${map[type] || map.late}`}>
      {type === 'free' ? 'Free Cancel' : type === 'late' ? 'Late Cancel' : 'No-Show'}
    </span>
  );
};

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CancellationRequests = () => {
  const [cancellations, setCancellations] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', cancellation }
  const [adminRemarks, setAdminRemarks] = useState('');
  const [refundMethod, setRefundMethod] = useState('Original Payment Method');
  const [submitting, setSubmitting] = useState(false);
  const limit = 10;

  const fetchCancellations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/cancellations`, {
        headers: authHeader(),
        params: { status: statusFilter, search, startDate, endDate, page, limit }
      });
      if (res.data.success) {
        setCancellations(res.data.data || []);
        setTotal(res.data.total || 0);
        setStats(res.data.stats || []);
      }
    } catch {
      setCancellations([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, startDate, endDate, page]);

  useEffect(() => { fetchCancellations(); }, [fetchCancellations]);

  const handleApprove = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/cancellations/${actionModal.cancellation._id}/approve`,
        { adminRemarks, refundMethod }, { headers: authHeader() });
      toast.success('Cancellation approved and refund initiated');
      setActionModal(null);
      setSelected(null);
      fetchCancellations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!actionModal) return;
    setSubmitting(true);
    try {
      await axios.put(`${API}/cancellations/${actionModal.cancellation._id}/reject`,
        { adminRemarks }, { headers: authHeader() });
      toast.success('Cancellation rejected');
      setActionModal(null);
      setSelected(null);
      fetchCancellations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const getStatCount = (s) => stats.find(x => x._id === s)?.count || 0;
  const getStatTotal = (s) => stats.find(x => x._id === s)?.totalRefund || 0;

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">cancel</span>
            Cancellation Requests
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Review, approve, or reject customer cancellation requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', status: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Approved', status: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Rejected', status: 'Rejected', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map(s => (
            <div key={s.label} className={`border rounded-2xl p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{getStatCount(s.status)}</p>
              <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
              {s.status === 'Approved' && (
                <p className="text-xs text-emerald-400 mt-0.5">₹{getStatTotal(s.status).toLocaleString('en-IN')} refunded</p>
              )}
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by customer or service…" className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50">
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
        </div>

        {/* Table */}
        <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-surface-container-high rounded-xl animate-pulse" />)}</div>
          ) : cancellations.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant">cancel</span>
              <p className="text-on-surface-variant mt-3">No cancellation requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Customer', 'Service', 'Date', 'Type', 'Refund', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cancellations.map((c, i) => (
                    <tr key={c._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-on-surface">{c.customerName}</p>
                        <p className="text-xs text-on-surface-variant">{c.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-on-surface">{c.appointmentSnapshot?.serviceName || '—'}</p>
                        <p className="text-xs text-on-surface-variant">{c.appointmentSnapshot?.barberName}</p>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                        {c.appointmentSnapshot?.date}
                        <br />
                        <span className="text-[10px]">{c.appointmentSnapshot?.time}</span>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={c.cancellationType} /></td>
                      <td className="px-4 py-3">
                        <p className={`font-semibold text-sm ${c.refundAmount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ₹{(c.refundAmount || 0).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-on-surface-variant">{c.refundPercentage}% refund</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSelected(c)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary cursor-pointer" title="View Details">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                          {c.status === 'Pending' && (
                            <>
                              <button onClick={() => { setActionModal({ type: 'approve', cancellation: c }); setAdminRemarks(''); setRefundMethod('Original Payment Method'); }} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 cursor-pointer" title="Approve">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                              </button>
                              <button onClick={() => { setActionModal({ type: 'reject', cancellation: c }); setAdminRemarks(''); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer" title="Reject">
                                <span className="material-symbols-outlined text-lg">cancel</span>
                              </button>
                            </>
                          )}
                        </div>
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

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface">Cancellation Details</h2>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-on-surface-variant">Customer</p><p className="text-sm font-semibold text-on-surface">{selected.customerName}</p></div>
                <div><p className="text-xs text-on-surface-variant">Email</p><p className="text-sm text-on-surface-variant">{selected.customerEmail}</p></div>
                <div><p className="text-xs text-on-surface-variant">Service</p><p className="text-sm text-on-surface">{selected.appointmentSnapshot?.serviceName}</p></div>
                <div><p className="text-xs text-on-surface-variant">Staff</p><p className="text-sm text-on-surface">{selected.appointmentSnapshot?.barberName}</p></div>
                <div><p className="text-xs text-on-surface-variant">Appointment Date</p><p className="text-sm text-on-surface">{selected.appointmentSnapshot?.date} {selected.appointmentSnapshot?.time}</p></div>
                <div><p className="text-xs text-on-surface-variant">Original Amount</p><p className="text-sm font-semibold text-on-surface">₹{selected.appointmentSnapshot?.originalAmount?.toLocaleString('en-IN')}</p></div>
              </div>
              <div className="bg-surface-container-high rounded-xl p-4">
                <p className="text-xs text-on-surface-variant">Cancellation Reason ({selected.reasonCategory})</p>
                <p className="text-sm text-on-surface mt-1">{selected.reason}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-surface-container-high rounded-xl p-3">
                  <TypeBadge type={selected.cancellationType} />
                  <p className="text-xs text-on-surface-variant mt-1">Type</p>
                </div>
                <div className="text-center bg-surface-container-high rounded-xl p-3">
                  <p className={`text-lg font-bold ${selected.refundAmount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>₹{selected.refundAmount}</p>
                  <p className="text-xs text-on-surface-variant mt-1">Refund Amount</p>
                </div>
                <div className="text-center bg-surface-container-high rounded-xl p-3">
                  <p className="text-lg font-bold text-on-surface">{selected.refundPercentage}%</p>
                  <p className="text-xs text-on-surface-variant mt-1">Refund %</p>
                </div>
              </div>
              {selected.adminRemarks && (
                <div className="bg-surface-container-high rounded-xl p-3">
                  <p className="text-xs text-on-surface-variant">Admin Remarks</p>
                  <p className="text-sm text-on-surface mt-1">{selected.adminRemarks}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <StatusBadge status={selected.status} />
                {selected.processedAt && (
                  <p className="text-xs text-on-surface-variant">Processed: {new Date(selected.processedAt).toLocaleString('en-IN')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal open={actionModal?.type === 'approve'} onClose={() => setActionModal(null)}>
        {actionModal?.type === 'approve' && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                Approve Cancellation
              </h2>
              <button onClick={() => setActionModal(null)} className="text-on-surface-variant hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <p className="text-sm text-emerald-400">Approving this will initiate a refund of <strong>₹{actionModal.cancellation.refundAmount}</strong> ({actionModal.cancellation.refundPercentage}% of original amount).</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Refund Method</label>
                <select value={refundMethod} onChange={e => setRefundMethod(e.target.value)} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50">
                  <option>Original Payment Method</option>
                  <option>Bank Transfer</option>
                  <option>Wallet Credit</option>
                  <option>Cash</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Admin Remarks (optional)</label>
                <textarea value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} rows={2} placeholder="Add a note…" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setActionModal(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleApprove} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-60 cursor-pointer">
                {submitting ? 'Processing…' : 'Approve & Refund'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={actionModal?.type === 'reject'} onClose={() => setActionModal(null)}>
        {actionModal?.type === 'reject' && (
          <div>
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-red-400">cancel</span>
                Reject Cancellation
              </h2>
              <button onClick={() => setActionModal(null)} className="text-on-surface-variant hover:text-white cursor-pointer"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-400">Rejecting this request will notify the customer and no refund will be issued.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-2">Reason for Rejection *</label>
                <textarea value={adminRemarks} onChange={e => setAdminRemarks(e.target.value)} rows={3} required placeholder="Please provide a reason for rejection…" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
              <button onClick={() => setActionModal(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 text-sm font-semibold cursor-pointer">Cancel</button>
              <button onClick={handleReject} disabled={submitting || !adminRemarks.trim()} className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-60 cursor-pointer">
                {submitting ? 'Processing…' : 'Reject Request'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CancellationRequests;
