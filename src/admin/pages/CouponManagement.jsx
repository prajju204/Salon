import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { formatCurrency } from "@/shared/utils/format";
import { API_BASE } from "@/shared/utils/api";

const API = `${API_BASE}/api/admin`;

const DISCOUNT_TYPES = ['percentage', 'fixed'];
const REASON_CATEGORIES = [
  'Schedule Conflict', 'Emergency', 'Changed My Mind', 'Found Another Salon',
  'Health Issue', 'Weather', 'Travel Plans Changed', 'Service No Longer Needed', 'Other'
];

const StatusBadge = ({ status }) => {
  const map = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
    Refunded: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.inactive}`}>
      {status}
    </span>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-14 bg-surface-container-high rounded-xl animate-pulse" />
    ))}
  </div>
);

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-surface-container border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const emptyForm = {
  code: '', name: '', description: '',
  discountType: 'percentage', discountValue: '',
  minBookingAmount: 0, maxDiscount: '',
  validFrom: '', validUntil: '',
  usageLimit: '', perUserLimit: 1,
  applicableServices: '', applicableStaff: '',
  isActive: true, assignedTo: ''
};

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('list'); // list | analytics
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const limit = 10;

  const authHeader = () => {
    const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/coupons`, {
        headers: authHeader(),
        params: { search, status: statusFilter, page, limit }
      });
      if (res.data.success) {
        setCoupons(res.data.data || []);
        setTotal(res.data.total || 0);
      }
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/coupons/analytics`, { headers: authHeader() });
      if (res.data.success) setAnalytics(res.data.data);
    } catch { /* silent */ }
  }, []);

  const fetchTopCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/customers/top`, { headers: authHeader() });
      if (res.data.success) setTopCustomers(res.data.data || []);
    } catch {
      setTopCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);
  useEffect(() => { if (activeTab === 'analytics') fetchAnalytics(); }, [activeTab, fetchAnalytics]);
  useEffect(() => { if (activeTab === 'top_customers') fetchTopCustomers(); }, [activeTab, fetchTopCustomers]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({
      ...c,
      validFrom: c.validFrom ? c.validFrom.split('T')[0] : '',
      validUntil: c.validUntil ? c.validUntil.split('T')[0] : '',
      maxDiscount: c.maxDiscount ?? '',
      usageLimit: c.usageLimit ?? '',
      applicableServices: Array.isArray(c.applicableServices) ? c.applicableServices.join(', ') : '',
      applicableStaff: Array.isArray(c.applicableStaff) ? c.applicableStaff.join(', ') : '',
      assignedTo: c.assignedTo || ''
    });
    setEditingId(c._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...form,
      discountValue: Number(form.discountValue),
      minBookingAmount: Number(form.minBookingAmount) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: Number(form.perUserLimit) || 1,
      applicableServices: form.applicableServices ? form.applicableServices.split(',').map(s => s.trim()).filter(Boolean) : [],
      applicableStaff: form.applicableStaff ? form.applicableStaff.split(',').map(s => s.trim()).filter(Boolean) : [],
      assignedTo: form.assignedTo ? form.assignedTo.trim() : null
    };

    try {
      if (editingId) {
        await axios.put(`${API}/coupons/${editingId}`, payload, { headers: authHeader() });
        toast.success('Coupon updated successfully');
      } else {
        await axios.post(`${API}/coupons`, payload, { headers: authHeader() });
        toast.success('Coupon created successfully');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(`${API}/coupons/${id}/toggle`, {}, { headers: authHeader() });
      toast.success('Coupon status updated');
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/coupons/${id}`, { headers: authHeader() });
      toast.success('Coupon deleted');
      setConfirmDelete(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
              Coupon Management
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">Create, manage and analyse promotional coupons</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Create Coupon
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {['list', 'analytics', 'top_customers'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold capitalize transition-colors border-b-2 ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab === 'list' ? 'Coupon List' : tab === 'analytics' ? 'Analytics' : 'Top Customers'}
            </button>
          ))}
        </div>

        {activeTab === 'list' ? (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">search</span>
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search by code or name…"
                  className="w-full bg-surface-container border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Table */}
            <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="p-6"><LoadingSkeleton /></div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-20">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant">local_activity</span>
                  <p className="text-on-surface-variant mt-3">No coupons found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {['Code', 'Name', 'Discount', 'Valid Until', 'Usage', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((c, i) => (
                        <tr key={c._id} className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                          <td className="px-4 py-3">
                            <code className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-bold tracking-widest">{c.code}</code>
                          </td>
                          <td className="px-4 py-3 text-on-surface font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-on-surface-variant">
                            {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                            {c.maxDiscount && <span className="text-xs text-on-surface-variant ml-1">(max ₹{c.maxDiscount})</span>}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-xs">
                            {c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant text-xs">
                            {c.usedCount}/{c.usageLimit ?? '∞'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={c.isActive ? 'active' : 'inactive'} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors cursor-pointer" title="Edit">
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button onClick={() => handleToggle(c._id)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${c.isActive ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-emerald-500/10 text-emerald-400'}`} title={c.isActive ? 'Deactivate' : 'Activate'}>
                                <span className="material-symbols-outlined text-lg">{c.isActive ? 'toggle_on' : 'toggle_off'}</span>
                              </button>
                              <button onClick={() => setConfirmDelete(c)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer" title="Delete">
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                  <span className="text-xs text-on-surface-variant">Showing {((page-1)*limit)+1}–{Math.min(page*limit,total)} of {total}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 hover:bg-white/10 cursor-pointer">←</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-surface-container-high text-sm disabled:opacity-40 hover:bg-white/10 cursor-pointer">→</button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'analytics' ? (
          /* Analytics Tab */
          <div className="space-y-6">
            {analytics ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Coupons', value: analytics.totalCoupons, icon: 'local_activity', color: 'text-primary' },
                    { label: 'Active Coupons', value: analytics.activeCoupons, icon: 'check_circle', color: 'text-emerald-400' },
                    { label: 'Total Used', value: analytics.totalUsed, icon: 'how_to_reg', color: 'text-blue-400' },
                    { label: 'Total Discount Given', value: `₹${(analytics.totalDiscount || 0).toLocaleString('en-IN')}`, icon: 'savings', color: 'text-amber-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-surface-container border border-white/10 rounded-2xl p-5">
                      <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
                      <p className="text-2xl font-bold text-on-surface mt-2">{s.value}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Top Coupons */}
                {analytics.topCoupons?.length > 0 && (
                  <div className="bg-surface-container border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-on-surface mb-4">Top Performing Coupons</h3>
                    <div className="space-y-3">
                      {analytics.topCoupons.map(c => (
                        <div key={c._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                          <code className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{c.code}</code>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-on-surface">{c.usedCount} uses</p>
                            <p className="text-xs text-on-surface-variant">₹{(c.totalDiscountGiven || 0).toLocaleString('en-IN')} saved</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Usage History */}
                {analytics.usageHistory?.length > 0 && (
                  <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10">
                      <h3 className="text-sm font-semibold text-on-surface">Recent Usage History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            {['Code', 'Customer', 'Discount', 'Date'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.usageHistory.map(u => (
                            <tr key={u._id} className="border-b border-white/5 hover:bg-white/3">
                              <td className="px-4 py-3"><code className="bg-primary/10 text-primary px-1.5 rounded text-xs">{u.couponCode}</code></td>
                              <td className="px-4 py-3 text-on-surface-variant">{u.customerName}</td>
                              <td className="px-4 py-3 text-emerald-400 font-semibold">₹{u.discountApplied}</td>
                              <td className="px-4 py-3 text-on-surface-variant text-xs">{new Date(u.usedAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20"><LoadingSkeleton /></div>
            )}
          </div>
        ) : (
          /* Top Customers Tab */
          <div className="bg-surface-container border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-on-surface">Top Customers by Booking Amount</h3>
            </div>
            {loading ? <div className="p-4"><LoadingSkeleton /></div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Customer', 'Email', 'Total Spent', 'Bookings', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                        <td className="px-4 py-3 text-on-surface font-semibold">{c.name}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{c.email}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-on-surface-variant">{c.bookingCount}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => {
                              setForm({ ...emptyForm, assignedTo: c.email });
                              setEditingId(null);
                              setShowModal(true);
                            }}
                            className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-semibold hover:bg-primary/30"
                          >
                            Assign Coupon
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {topCustomers.length === 0 && <div className="p-6 text-center text-on-surface-variant">No completed bookings found.</div>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-on-surface text-lg">{editingId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <button type="button" onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-white cursor-pointer">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Coupon Code *</label>
                <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER25" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50 font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Coupon Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Special" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Assigned To (Email, Optional)</label>
                <input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="user@example.com" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Discount Type *</label>
                <select required value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">
                  Discount Value * {form.discountType === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input required type="number" min="0" step="0.01" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === 'percentage' ? '10' : '100'} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Min Booking Amount (₹)</label>
                <input type="number" min="0" value={form.minBookingAmount} onChange={e => setForm(f => ({ ...f, minBookingAmount: e.target.value }))} placeholder="0" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Max Discount (₹, blank = no cap)</label>
                <input type="number" min="0" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="e.g. 500" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Valid From *</label>
                <input required type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Valid Until *</label>
                <input required type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Usage Limit (blank = unlimited)</label>
                <input type="number" min="1" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="e.g. 100" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Per User Limit</label>
                <input type="number" min="1" value={form.perUserLimit} onChange={e => setForm(f => ({ ...f, perUserLimit: e.target.value }))} className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Applicable Services (comma-separated, blank = all)</label>
              <input value={form.applicableServices} onChange={e => setForm(f => ({ ...f, applicableServices: e.target.value }))} placeholder="e.g. Haircut, Shave, Beard Trim" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide block mb-1.5">Applicable Staff (comma-separated, blank = all)</label>
              <input value={form.applicableStaff} onChange={e => setForm(f => ({ ...f, applicableStaff: e.target.value }))} placeholder="e.g. Alexander, Marcus" className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary/50" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 accent-primary cursor-pointer" />
              <label htmlFor="isActive" className="text-sm text-on-surface cursor-pointer">Active (visible to customers)</label>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl border border-white/10 text-on-surface-variant hover:bg-white/5 text-sm font-semibold cursor-pointer">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary-container disabled:opacity-60 cursor-pointer">
              {submitting ? 'Saving…' : (editingId ? 'Update Coupon' : 'Create Coupon')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">warning</span>
          <h3 className="text-lg font-bold text-on-surface mb-2">Delete Coupon?</h3>
          <p className="text-on-surface-variant text-sm mb-6">
            Are you sure you want to delete coupon <code className="text-primary">{confirmDelete?.code}</code>? This cannot be undone.
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setConfirmDelete(null)} className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-semibold hover:bg-white/5 cursor-pointer">Cancel</button>
            <button onClick={() => handleDelete(confirmDelete._id)} className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 cursor-pointer">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CouponManagement;
