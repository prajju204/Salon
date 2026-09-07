import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyManagement = () => {
  const [deliveryBoys, setDeliveryBoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoy, setEditingBoy] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', phone: '' });

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
          setFormData({ name: '', username: '', password: '', phone: '' });
          fetchDeliveryBoys();
        }
      } else {
        const res = await axios.post(`${API_BASE}/api/admin/delivery-boys`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` }
        });
        if (res.data.success) {
          toast.success('Delivery boy created. Credentials saved to text file.');
          setShowModal(false);
          setFormData({ name: '', username: '', password: '', phone: '' });
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
            setFormData({ name: '', username: '', password: '', phone: '' });
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
                        setEditingBoy(boy);
                        setFormData({ name: boy.name, username: boy.username, password: '', phone: boy.phone || '' });
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
            className="bg-surface p-6 rounded-2xl w-full max-w-md border border-white/10"
          >
            <h3 className="text-xl font-bold text-on-surface mb-4">{editingBoy ? 'Edit Delivery Boy' : 'Add Delivery Boy'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  required
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
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Password {editingBoy && '(Leave blank to keep current)'}</label>
                <input
                  type="password"
                  required={!editingBoy}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant uppercase tracking-wider mb-1">Phone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg p-2.5 text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBoy(null);
                    setFormData({ name: '', username: '', password: '', phone: '' });
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
    </div>
  );
};

export default DeliveryBoyManagement;
