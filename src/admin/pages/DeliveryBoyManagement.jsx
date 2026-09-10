import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyManagement = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', phone: '', salary: '', revenue: '' });
  const [showPassword, setShowPassword] = useState(false);

  const [detailsBoy, setDetailsBoy] = useState(null);
  const [detailsOrders, setDetailsOrders] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const navigate = useNavigate();

  const fetchDeliveryBoys = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/delivery-boys`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
      });
      if (res.data.success) {
        setDeliveryBoys(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch delivery boys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryBoys();
  }, []);

  const fetchDetailsOrders = async (boyId) => {
    setLoadingDetails(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
      });
      if (res.data.success) {
        const orders = res.data.data.filter(o => o.deliveryBoyId === boyId);
        setDetailsOrders(orders);
      }
    } catch (err) {
      toast.error('Failed to fetch orders for this delivery agent');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBoy) {
        const res = await axios.put(`${API_BASE}/api/admin/delivery-boys/${editingBoy._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
        });
        if (res.data.success) {
          toast.success('Delivery boy updated successfully');
          setShowModal(false);
          setEditingBoy(null);
          setFormData({ name: '', username: '', password: '', phone: '', salary: '', revenue: '', upiId: '', bankAccountNumber: '' });
          fetchDeliveryBoys();
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/admin/delivery-boys`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
        });
        if (res.data.success) {
          toast.success('Delivery boy created. Credentials saved to text file.');
          setShowModal(false);
          setFormData({ name: '', username: '', password: '', phone: '', salary: '', revenue: '', upiId: '', bankAccountNumber: '' });
          fetchDeliveryBoys();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editingBoy ? 'update' : 'create'} delivery boy`);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      const res = await axios.put(`${API_BASE}/api/admin/delivery-boys/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
      });
      if (res.data.success) {
        toast.success('Status updated');
        fetchDeliveryBoys();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery boy?')) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/admin/delivery-boys/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
      });
      if (res.data.success) {
        toast.success('Delivery boy deleted successfully');
        fetchDeliveryBoys();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete delivery boy');
    }
  };

  return (
    <div className="p-6 pt-24 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Delivery Boys</h1>
          <p className="text-sm text-on-surface-variant">Manage your delivery staff</p>
        </div>
        <button
          onClick={() => {
            setEditingBoy(null);
            setFormData({ name: '', username: '', password: '', phone: '', salary: '', revenue: '', upiId: '', bankAccountNumber: '' });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Add Delivery Boy
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-on-surface-variant">Loading...</div>
      ) : (
        <div className="bg-surface-container rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Username</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-white/10">
              {deliveryBoys.map((boy) => (
                <tr key={boy._id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-on-surface font-semibold">{boy.name}</td>
                  <td className="p-4 text-on-surface-variant">{boy.username}</td>
                  <td className="p-4 text-on-surface-variant">{boy.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${boy.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {boy.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => handleStatusToggle(boy._id, boy.status)}
                      className="text-primary hover:underline text-xs cursor-pointer"
                    >
                      Toggle Status
                    </button>
                    <button
                      onClick={() => {
                        setDetailsBoy(boy);
                        fetchDetailsOrders(boy._id);
                      }}
                      className="text-emerald-400 hover:underline text-xs font-bold cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setEditingBoy(boy);
                        setFormData({ name: boy.name, username: boy.username, password: '', phone: boy.phone || '', salary: boy.salary || '', revenue: boy.revenue || '', upiId: boy.upiId || '', bankAccountNumber: boy.bankAccountNumber || '' });
                        setShowModal(true);
                      }}
                      className="text-blue-400 hover:underline text-xs font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(boy._id)}
                      className="text-red-400 hover:underline text-xs font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {deliveryBoys.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-on-surface-variant">No delivery boys found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-surface p-6 rounded-2xl w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-xl font-bold text-on-surface mb-4">{editingBoy ? 'Edit Delivery Boy' : 'Add Delivery Boy'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="^[a-zA-Z\s]+$"
                  title="Name should only contain letters and spaces, at least 3 characters long."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="Username should only contain letters, numbers, and underscores, without spaces."
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Password {editingBoy && '(Leave blank to keep current)'}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required={!editingBoy}
                    minLength={6}
                    title="Password must be at least 6 characters long."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 pr-10 text-on-surface focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  required
                  pattern="^[0-9]{10}$"
                  maxLength={10}
                  title="Phone number must be exactly 10 digits."
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // only allow digits
                    if (val.length <= 10) {
                      setFormData({ ...formData, phone: val });
                    }
                  }}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Salary (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              {editingBoy && (
                <div>
                  <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Earned Revenue Balance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-on-surface-variant mt-1">Adjust this to manually credit the delivery boy's payout balance.</p>
                </div>
              )}
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">UPI ID</label>
                <input
                  type="text"
                  value={formData.upiId || ''}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                  placeholder="e.g. name@upi"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBoy(null);
                    setFormData({ name: '', username: '', password: '', phone: '', salary: '', revenue: '', upiId: '', bankAccountNumber: '' });
                  }}
                  className="px-4 py-2 text-on-surface-variant hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary/90 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {detailsBoy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface p-6 rounded-2xl w-full max-w-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-on-surface">Delivery Agent Details</h3>
              <button onClick={() => setDetailsBoy(null)} className="text-on-surface-variant hover:text-white cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Actions Section */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              <button
                onClick={() => {
                  const msg = encodeURIComponent(`Hello ${detailsBoy.name},\n\nThis is a message from the admin regarding your delivery assignments.`);
                  window.open(`https://wa.me/${detailsBoy.phone}?text=${msg}`, '_blank');
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">chat</span>
                <span className="text-xs font-semibold">WhatsApp</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(detailsBoy.phone);
                  toast.success('Number copied to clipboard');
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 text-on-surface rounded-xl hover:bg-white/10 transition-colors border border-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">content_copy</span>
                <span className="text-xs font-semibold">Copy Number</span>
              </button>
              <button
                onClick={() => navigate('/admin/orders')}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors border border-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                <span className="text-xs font-semibold">Assign Order</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Personal Info */}
              <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                  Personal Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Name</span>
                    <span className="text-on-surface font-semibold">{detailsBoy.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Username</span>
                    <span className="text-on-surface">{detailsBoy.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Phone</span>
                    <span className="text-on-surface">{detailsBoy.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Status</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${detailsBoy.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {detailsBoy.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Joined</span>
                    <span className="text-on-surface">
                      {detailsBoy.createdAt ? new Date(detailsBoy.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-400">account_balance</span>
                  Payment Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">UPI ID</span>
                    <span className="text-on-surface font-semibold">{detailsBoy.upiId || <span className="text-on-surface-variant italic font-normal">Not Provided</span>}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-on-surface-variant">Bank Details</span>
                    <span className="text-on-surface whitespace-pre-wrap">{detailsBoy.bankAccountNumber || <span className="text-on-surface-variant italic">Not Provided</span>}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Stats */}
              <div className="bg-surface-container p-4 rounded-xl border border-white/5">
                <h4 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">query_stats</span>
                  Delivery Statistics
                </h4>
                {loadingDetails ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant">Loading stats...</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-on-surface">{detailsOrders.length}</div>
                      <div className="text-[10px] uppercase tracking-wider text-on-surface-variant mt-1">Total Orders</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {detailsOrders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-green-500/70 mt-1">Completed</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {detailsOrders.filter(o => o.status === 'Shipped' || o.status === 'Out for Delivery').length}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-blue-500/70 mt-1">In Progress</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {detailsOrders.filter(o => o.status === 'Cancelled').length}
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-orange-500/70 mt-1">Cancelled</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Assignments & History */}
            <div className="bg-surface-container rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-400">history</span>
                  Order History & Assignments
                </h4>
              </div>
              
              <div className="p-0">
                {loadingDetails ? (
                  <div className="text-center py-8 text-sm text-on-surface-variant">Loading orders...</div>
                ) : detailsOrders.length === 0 ? (
                  <div className="text-center py-8 text-sm text-on-surface-variant">No orders assigned yet.</div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 text-[10px] uppercase tracking-wider text-on-surface-variant sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs divide-y divide-white/5">
                        {detailsOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((order) => (
                          <tr key={order._id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 font-mono text-on-surface-variant">#{order._id.slice(-6)}</td>
                            <td className="p-3 text-on-surface">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 text-on-surface font-semibold">₹{order.totalAmount}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full
                                ${order.status === 'Delivered' ? 'bg-green-500/20 text-green-400' : ''}
                                ${order.status === 'Shipped' || order.status === 'Out for Delivery' ? 'bg-blue-500/20 text-blue-400' : ''}
                                ${order.status === 'Cancelled' ? 'bg-red-500/20 text-red-400' : ''}
                                ${order.status === 'Pending' || order.status === 'Processing' ? 'bg-orange-500/20 text-orange-400' : ''}
                              `}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DeliveryBoyManagement;
