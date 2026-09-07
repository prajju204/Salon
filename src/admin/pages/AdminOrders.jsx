import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const API = `${API_BASE}/api/admin`;

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [deliveryBoys, setDeliveryBoys] = useState([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/orders`, { headers: authHeader() });
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeliveryBoys = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/delivery-boys`, { headers: authHeader() });
      if (res.data.success) {
        setDeliveryBoys(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load delivery boys:', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryBoys();
  }, [fetchOrders, fetchDeliveryBoys]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await axios.put(
        `${API}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: authHeader() }
      );
      if (res.data.success) {
        toast.success(`Order status updated to: ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignDeliveryBoy = async (orderId, deliveryBoyId) => {
    if (!deliveryBoyId) return;
    setUpdatingId(orderId);
    try {
      const res = await axios.put(
        `${API}/orders/${orderId}/assign`,
        { deliveryBoyId },
        { headers: authHeader() }
      );
      if (res.data.success) {
        toast.success('Delivery boy assigned successfully!');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, deliveryBoyId, status: 'Shipped' } : o))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to assign delivery boy.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Processing':
        return 'Order Placed';
      case 'Shipped':
        return 'Out for Delivery';
      case 'Completed':
      case 'Delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Shipped':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
  };

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="p-6 md:p-8 lg:p-12 pt-24 md:pt-28 lg:pt-32 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Product Orders</h1>
        <p className="text-sm text-on-surface-variant mt-1">View, track, and update product fulfillment states.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar border-b border-white/5">
        {['All', 'Processing', 'Shipped', 'Completed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
              statusFilter === status
                ? 'bg-primary text-on-primary border-primary shadow-[0_0_10px_rgba(242,202,80,0.2)]'
                : 'bg-white/2 border-white/5 text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            {status === 'All' ? 'All Orders' : getStatusText(status)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id || order.id}
              className="bg-surface-container rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row justify-between gap-6 hover:border-primary/20 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
            >
              {/* Left Column: Client & items */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-primary">
                    {order.receiptNumber || 'N/A'}
                  </span>
                  <span className="text-xs text-on-surface-variant">•</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Placed by: <strong className="text-on-surface">{order.user?.fullName || 'Guest'}</strong> ({order.user?.email || 'N/A'})
                  </span>
                  <span className="text-xs text-on-surface-variant">•</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                <div className="flex flex-col gap-3.5 bg-white/2 p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Items Ordered</h4>
                  <div className="flex flex-col gap-2.5 divide-y divide-white/5">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm pt-2.5 first:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{item.quantity}x</span>
                          <span className="text-on-surface font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold text-on-surface">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {order.deliveryBoyId && (
                  <div className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-2 bg-white/2 p-2.5 rounded-xl border border-white/5 w-fit">
                    <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                    Assigned Delivery Boy: <strong className="text-on-surface ml-1">
                      {deliveryBoys.find(b => b._id === order.deliveryBoyId)?.name || 'Assigned'}
                    </strong>
                  </div>
                )}
              </div>

              {/* Right Column: Status Controls & pricing */}
              <div className="flex flex-col md:items-end justify-between gap-4 shrink-0 min-w-[200px]">
                <div className="text-left md:text-right">
                  <span className="text-xs text-on-surface-variant font-medium">Total Revenue:</span>
                  <p className="text-2xl font-headline font-black text-primary mt-0.5">₹{order.totalAmount}</p>
                  <span className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider mt-1 block">
                    Paid via {order.paymentMethod}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex items-center justify-between md:justify-end gap-2">
                    <span className="text-xs text-on-surface-variant">Fulfillment Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase border tracking-wider ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                    >
                      <option value="Processing">Order Placed</option>
                      <option value="Shipped">Out for Delivery</option>
                      <option value="Completed">Delivered</option>
                    </select>

                    {order.status !== 'Completed' && order.status !== 'Delivered' && (
                      <select
                        value={order.deliveryBoyId || ''}
                        disabled={updatingId === order._id}
                        onChange={(e) => handleAssignDeliveryBoy(order._id, e.target.value)}
                        className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface"
                      >
                        <option value="">-- Assign Delivery Boy --</option>
                        {deliveryBoys.map((boy) => (
                          <option key={boy._id} value={boy._id}>
                            {boy.name} ({boy.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container rounded-3xl border border-white/5 text-center px-6">
          <span className="material-symbols-outlined text-6xl text-primary/40 mb-4">receipt_long</span>
          <h3 className="text-xl font-bold text-on-surface mb-1">No Orders Found</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            There are no orders matching the selected status filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
