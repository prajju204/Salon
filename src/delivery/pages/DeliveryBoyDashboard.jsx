import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DeliveryBoyDashboard = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [orderTab, setOrderTab] = useState('pending');
  const [activeTab, setActiveTab] = useState('orders');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('delivery_boy') || 'null');
    } catch {
      return null;
    }
  });

  const pendingDeliveries = deliveries.filter(d => 
    !['Completed', 'Delivered', 'Cancelled', 'Return/Exchange Requested', 'Return Requested', 'Exchange Requested', 'Picked', 'Returned to Company', 'Refunded'].includes(d.status)
  );

  const completedDeliveries = deliveries.filter(d => 
    ['Completed', 'Delivered', 'Cancelled'].includes(d.status)
  );

  const returnDeliveries = deliveries.filter(d => 
    ['Return/Exchange Requested', 'Return Requested', 'Exchange Requested', 'Picked', 'Returned to Company', 'Refunded'].includes(d.status)
  );

  const pendingCount = pendingDeliveries.length;
  const completedCount = completedDeliveries.length;
  const returnsCount = returnDeliveries.length;

  const displayedDeliveries = orderTab === 'pending'
    ? pendingDeliveries
    : orderTab === 'completed'
    ? completedDeliveries
    : returnDeliveries;

  const getItemImage = (item) => {
    if (item.image) return item.image;
    if (products && products.length > 0) {
      const found = products.find(
        (p) =>
          (item.productId && (p._id === item.productId || p.id === item.productId)) ||
          p.name?.toLowerCase() === item.name?.toLowerCase()
      );
      if (found && (found.image || found.imageUrl)) return found.image || found.imageUrl;
    }
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80';
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const userId = user.id || user._id;
        const [delRes, profRes, prodRes] = await Promise.all([
          axios.get(`${API_BASE}/api/delivery/my-deliveries/${userId}`),
          axios.get(`${API_BASE}/api/delivery/profile/${userId}`),
          axios.get(`${API_BASE}/api/auth/products`).catch(() => axios.get(`${API_BASE}/api/products`)).catch(() => ({ data: { success: false } }))
        ]);
        if (delRes.data?.success) {
          setDeliveries(delRes.data.data);
        }
        if (profRes.data?.success) {
          const p = profRes.data.data;
          setProfile(p);
          if (p.upiId) setUpiId(p.upiId);
          if (p.bankAccountNumber) setBankAccountNumber(p.bankAccountNumber);
        }
        if (prodRes.data?.success && Array.isArray(prodRes.data.data)) {
          setProducts(prodRes.data.data);
        }
      } catch (err) {
        toast.error('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id || user?.id, navigate]);

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

  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    if (!upiId && !bankAccountNumber) {
      toast.error('Please provide either UPI ID or Bank details');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      const res = await axios.put(`${API_BASE}/api/delivery/profile/${user.id || user._id}/payment`, {
        upiId,
        bankAccountNumber
      });
      if (res.data.success) {
        toast.success('Payment details updated successfully');
        setProfile(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to update payment details');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (!user) return null;

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-widest font-headline">LUXE GROOM</h1>
          <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Delivery Portal</span>
        </div>
        {mobileSidebarOpen && (
          <button 
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-white hover:bg-white/5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">
          Deliveries
        </div>

        {/* Pending Deliveries */}
        <button 
          onClick={() => { setActiveTab('orders'); setOrderTab('pending'); setMobileSidebarOpen(false); }} 
          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'orders' && orderTab === 'pending'
              ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">schedule</span>
            <span>Pending Deliveries</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            activeTab === 'orders' && orderTab === 'pending'
              ? 'bg-primary text-black'
              : 'bg-white/10 text-on-surface-variant'
          }`}>
            {pendingCount}
          </span>
        </button>
        
        {/* Completed Deliveries */}
        <button 
          onClick={() => { setActiveTab('orders'); setOrderTab('completed'); setMobileSidebarOpen(false); }} 
          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'orders' && orderTab === 'completed'
              ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            <span>Completed Deliveries</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            activeTab === 'orders' && orderTab === 'completed'
              ? 'bg-primary text-black'
              : 'bg-white/10 text-on-surface-variant'
          }`}>
            {completedCount}
          </span>
        </button>

        {/* Returns */}
        <button 
          onClick={() => { setActiveTab('orders'); setOrderTab('returns'); setMobileSidebarOpen(false); }} 
          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
            activeTab === 'orders' && orderTab === 'returns'
              ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">assignment_return</span>
            <span>Returns</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            activeTab === 'orders' && orderTab === 'returns'
              ? 'bg-primary text-black'
              : 'bg-white/10 text-on-surface-variant'
          }`}>
            {returnsCount}
          </span>
        </button>

        <div className="px-3 pt-5 pb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 border-t border-white/5 mt-3">
          Staff & Finance
        </div>

        {/* Earnings & Salary */}
        <button 
          onClick={() => { setActiveTab('earnings'); setMobileSidebarOpen(false); }} 
          className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all cursor-pointer ${
            activeTab === 'earnings'
              ? 'bg-primary/20 text-primary border border-primary/50 shadow-sm'
              : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-white/5 border border-white/5'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          <span>Earnings & Salary</span>
        </button>
      </nav>
      
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white/5 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">{user.name?.charAt(0) || 'D'}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
            <p className="text-[10px] text-on-surface-variant truncate">{user.phone || 'Delivery Agent'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full text-left px-3 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-container border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface hover:text-primary transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
          <div>
            <h1 className="text-base font-bold text-primary tracking-wider leading-none">LUXE GROOM</h1>
            <span className="text-[9px] text-on-surface-variant uppercase tracking-widest">Delivery Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-xs">{user.name?.charAt(0) || 'D'}</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-surface-container border-r border-white/10 z-50 md:hidden flex flex-col transition-transform duration-300 ease-in-out ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {navContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-surface-container border-r border-white/10 flex-col h-screen sticky top-0 shrink-0">
        {navContent}
      </aside>

      <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        {/* Earnings & Salary Tab */}
        {activeTab === 'earnings' && !loading && profile && (
          <div className="animate-in fade-in duration-300">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">payments</span>
                Earnings & Salary
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Assigned Salary</p>
                  <p className="text-xl font-bold text-on-surface">₹{profile.salary || 0}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-green-500/70 font-bold mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-green-400">₹{profile.paidAmount || 0}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-blue-500/70 font-bold mb-1">Pending Balance</p>
                  <p className="text-xl font-bold text-blue-400">₹{Math.max(0, (profile.revenue || 0) - (profile.paidAmount || 0))}</p>
                </div>
              </div>
            </div>
            
            {(profile.payouts && profile.payouts.length > 0) && (
              <div className="flex-1 max-h-48 overflow-y-auto pr-2">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">history</span>
                  Recent Payouts
                </h3>
                <div className="space-y-2">
                  {profile.payouts.slice().reverse().map((payout, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-green-400">+₹{payout.amount}</span>
                        <span className="text-[10px] text-on-surface-variant">{payout.note || 'Payout'}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{new Date(payout.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile & Payment Info */}
        {activeTab === 'earnings' && !loading && profile && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 h-fit mb-8 animate-in fade-in duration-300">
            <h3 className="text-xl font-headline text-on-surface mb-2">Payment Details</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Enter your UPI ID or Bank account details. The admin will use this information to process your payouts.
            </p>
            <form onSubmit={submitPaymentDetails} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                  placeholder="e.g. name@upi"
                />
              </div>

              <div className="flex items-center my-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-3 text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">OR / AND</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Bank Account Details</label>
                <textarea
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface min-h-[80px]"
                  placeholder="Bank Name:&#10;Account Number:&#10;IFSC Code:&#10;Account Holder Name:"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayment}
                className="w-full py-2.5 bg-primary text-on-primary font-bold uppercase tracking-widest text-[11px] rounded-lg hover:brightness-110 cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingPayment ? 'Saving...' : 'Save Payment Details'}
              </button>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  {orderTab === 'pending' && (
                    <>
                      <span className="material-symbols-outlined text-primary">schedule</span>
                      <span>Pending Deliveries</span>
                    </>
                  )}
                  {orderTab === 'completed' && (
                    <>
                      <span className="material-symbols-outlined text-green-400">task_alt</span>
                      <span>Completed Deliveries</span>
                    </>
                  )}
                  {orderTab === 'returns' && (
                    <>
                      <span className="material-symbols-outlined text-amber-400">assignment_return</span>
                      <span>Returns & Exchanges</span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {orderTab === 'pending' && 'Active orders assigned to you for delivery and customer handover'}
                  {orderTab === 'completed' && 'Delivered and finalized orders'}
                  {orderTab === 'returns' && 'Return and exchange requests requiring pickup or company return'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-container border border-white/10 text-on-surface-variant">
                  Total: <span className="text-primary font-bold">{displayedDeliveries.length}</span> {displayedDeliveries.length === 1 ? 'order' : 'orders'}
                </span>
              </div>
            </div>

            {/* Mobile quick tab pill switcher */}
            <div className="flex md:hidden gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setOrderTab('pending')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  orderTab === 'pending'
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-surface-container text-on-surface-variant border border-white/5'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setOrderTab('completed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  orderTab === 'completed'
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-surface-container text-on-surface-variant border border-white/5'
                }`}
              >
                Completed ({completedCount})
              </button>
              <button
                onClick={() => setOrderTab('returns')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                  orderTab === 'returns'
                    ? 'bg-primary/20 text-primary border border-primary/50'
                    : 'bg-surface-container text-on-surface-variant border border-white/5'
                }`}
              >
                Returns ({returnsCount})
              </button>
            </div>

            {loading ? (
              <div className="text-center py-10 text-on-surface-variant">Loading deliveries...</div>
            ) : displayedDeliveries.length === 0 ? (
              <div className="bg-surface-container rounded-xl border border-white/10 p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">local_shipping</span>
                <p className="text-on-surface-variant">You have no {orderTab} deliveries at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedDeliveries.map(delivery => (
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
                    <div className="space-y-2">
                      {delivery.items.map((item, idx) => {
                        const imgUrl = getItemImage(item);
                        return (
                          <div key={idx} className="flex items-center justify-between text-sm gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-white/10 overflow-hidden flex-shrink-0">
                                <img
                                  src={imgUrl}
                                  alt={item.name}
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&auto=format&fit=crop&q=80';
                                  }}
                                />
                              </div>
                              <span className="font-semibold text-on-surface">{item.quantity}x {item.name}</span>
                            </div>
                            {item.price && (
                              <span className="text-xs text-on-surface-variant">₹{item.price * item.quantity}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <p className="text-sm font-bold">Total Amount to Collect: <span className="text-primary">₹{delivery.totalAmount}</span></p>
                  <p className="text-xs text-on-surface-variant mt-1">Payment Status: {delivery.paymentStatus}</p>
                </div>
                
                <div className="flex flex-col justify-end gap-3 min-w-[200px] w-full md:w-64">
                  {delivery.location && delivery.location.lat && delivery.location.lng && (
                    <div className="bg-surface-container rounded-lg border border-white/5 overflow-hidden flex flex-col h-40 mt-auto shadow-md">
                      <div className="h-full w-full bg-slate-800 z-0 relative">
                        <MapContainer 
                          center={[delivery.location.lat, delivery.location.lng]} 
                          zoom={14} 
                          scrollWheelZoom={false}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; OpenStreetMap'
                          />
                          <Marker position={[delivery.location.lat, delivery.location.lng]} />
                        </MapContainer>
                      </div>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${delivery.location.lat},${delivery.location.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-white/10 text-center py-2 text-[10px] font-bold tracking-widest uppercase hover:bg-white/20 transition-all cursor-pointer flex items-center justify-center gap-1 z-10"
                      >
                        <span className="material-symbols-outlined text-[14px]">directions</span>
                        Get Directions
                      </a>
                    </div>
                  )}

                  <div className="mt-auto">
                    <select
                      value={delivery.status === 'Processing' ? 'Taken' : delivery.status}
                      onChange={(e) => updateStatus(delivery._id, e.target.value)}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-3.5 py-3 text-sm font-bold focus:outline-none focus:border-primary text-on-surface"
                    >
                      {orderTab === 'returns' ? (
                        <>
                          {delivery.status !== 'Picked' && delivery.status !== 'Returned to Company' && (
                            <option value={delivery.status} disabled>{delivery.status}</option>
                          )}
                          <option value="Picked">Picked</option>
                          <option value="Returned to Company">Returned to Company</option>
                        </>
                      ) : (
                        <>
                          <option value="Taken">Taken</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Completed">Completed</option>
                          <option value="Picked">Picked</option>
                          <option value="Returned to Company">Returned to Company</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryBoyDashboard;
