import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const DeliveryBoyDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('delivery_boy') || 'null');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchDeliveries = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/delivery/my-deliveries/${user.id || user._id}`);
        if (res.data.success) {
          setDeliveries(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to fetch deliveries');
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, [user, navigate]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`${API_BASE}/api/delivery/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Status updated to ${newStatus}`);
        setDeliveries(deliveries.map(d => d._id === orderId ? { ...d, status: newStatus } : d));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_boy');
    toast.success('Logged out');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-on-background pb-10">
      <header className="bg-surface/85 backdrop-blur-xl border-b border-white/10 h-20 flex justify-between items-center px-6 shadow-2xl">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-widest">Delivery Dashboard</h1>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Welcome, {user.name}</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-red-950/30 hover:text-red-400 border border-transparent transition-all cursor-pointer text-on-surface-variant"
          title="Log Out"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto mt-6">
        <h2 className="text-2xl font-bold mb-6">Assigned Deliveries</h2>
        
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant">Loading deliveries...</div>
        ) : deliveries.length === 0 ? (
          <div className="bg-surface-container rounded-xl border border-white/10 p-10 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">local_shipping</span>
            <p className="text-on-surface-variant">You have no assigned deliveries at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map(delivery => (
              <div key={delivery._id} className="bg-surface-container rounded-xl border border-white/10 p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded">#{delivery.receiptNumber}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      delivery.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                      delivery.status === 'Delivered' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {delivery.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1">Deliver to: {delivery.user?.name || 'Customer'}</h3>
                  {delivery.user?.phone && <p className="text-sm text-on-surface-variant mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">call</span> {delivery.user.phone}</p>}
                  
                  <div className="space-y-2 mb-4 bg-white/5 p-3 rounded-lg">
                    <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold mb-2">Items:</p>
                    {delivery.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm font-bold">Total Amount to Collect: <span className="text-primary">₹{delivery.totalAmount}</span></p>
                  <p className="text-xs text-on-surface-variant mt-1">Payment Status: {delivery.paymentStatus}</p>
                </div>
                
                <div className="flex flex-col justify-end gap-3 min-w-[200px]">
                  {delivery.status === 'Shipped' && (
                    <button
                      onClick={() => updateStatus(delivery._id, 'Delivered')}
                      className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {delivery.status === 'Delivered' && (
                    <button
                      onClick={() => updateStatus(delivery._id, 'Completed')}
                      className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryBoyDashboard;
