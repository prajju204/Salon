import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { io } from 'socket.io-client';
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
  const [loading, setLoading] = useState(true);
  const [newAssignment, setNewAssignment] = useState(null);
  const navigate = useNavigate();
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const beepRef = React.useRef(null);
  const audioCtxRef = React.useRef(null);
  const socketRef = React.useRef(null);
  
  const user = JSON.parse(localStorage.getItem('delivery_boy') || 'null');

  // Attempt to unlock audio on first interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioCtxRef.current) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
            // Play a silent note to force unlock
            const osc = audioCtxRef.current.createOscillator();
            osc.connect(audioCtxRef.current.destination);
            osc.start(0);
            osc.stop(0.01);
            setAudioUnlocked(true);
          }
        } catch (e) {
          console.error('Audio unlock failed:', e);
        }
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().then(() => setAudioUnlocked(true));
      }
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/delivery-login');
      return;
    }

    const fetchDeliveries = async () => {
      try {
        const token = localStorage.getItem('luxe_delivery_token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await axios.get(`${API_BASE}/api/delivery/my-deliveries/${user.id}`);
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

    // Socket Connection for Real-time assignments
    const socket = io(API_BASE);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', `delivery-${user.id}`);
    });

    socket.on('new-notification', (notif) => {
      if (notif.type === 'Order Update' && notif.title === 'New Order Assigned') {
        setNewAssignment(notif);
        playBeep();
        // Refresh deliveries to get the new assignment
        fetchDeliveries();
      }
    });

    // Subscribe to push notifications if not already subscribed
    import('@/shared/utils/pushNotifications').then(({ subscribeUserToPush }) => {
      subscribeUserToPush('delivery').catch(err => console.error('Push sub error:', err));
    });

    return () => {
      stopBeep();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, navigate]);

  const playBeep = () => {
    if (!beepRef.current && audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        
        const oscillator = audioCtxRef.current.createOscillator();
        const gainNode = audioCtxRef.current.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtxRef.current.currentTime); // A5

        gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        
        const beepInterval = setInterval(() => {
          if (audioCtxRef.current.state === 'running') {
            gainNode.gain.setTargetAtTime(1, audioCtxRef.current.currentTime, 0.05);
            gainNode.gain.setTargetAtTime(0, audioCtxRef.current.currentTime + 0.2, 0.05);
          }
        }, 1000);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtxRef.current.destination);
        oscillator.start();

        beepRef.current = { oscillator, beepInterval };
      } catch (e) {
        console.error('AudioContext error:', e);
      }
    }
  };

  const stopBeep = () => {
    if (beepRef.current) {
      clearInterval(beepRef.current.beepInterval);
      try {
        beepRef.current.oscillator.stop();
      } catch (e) {}
      beepRef.current = null;
    }
  };

  const acknowledgeAssignment = () => {
    stopBeep();
    setNewAssignment(null);
  };

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
    navigate('/delivery-login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-on-background pb-10 relative">
      {/* Assignment Alert Modal */}
      {newAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-surface-container-high border border-primary/50 p-8 rounded-2xl shadow-2xl shadow-primary/20 max-w-sm w-full text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="material-symbols-outlined text-primary text-5xl">notifications_active</span>
            </div>
            <h2 className="text-2xl font-headline font-bold text-primary mb-2">New Delivery!</h2>
            <p className="text-on-surface-variant mb-8">{newAssignment.message}</p>
            <button
              onClick={acknowledgeAssignment}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/30"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Audio Unlock Banner */}
      {!audioUnlocked && (
        <div className="bg-red-900/50 text-red-200 text-xs text-center py-2 px-4 cursor-pointer flex items-center justify-center gap-2" onClick={() => {}}>
          <span className="material-symbols-outlined text-[16px]">volume_off</span>
          Tap anywhere to enable sound alerts for new deliveries
        </div>
      )}

      <header className="bg-surface/90 backdrop-blur-xl border-b border-white/10 h-16 sm:h-20 flex justify-between items-center px-4 sm:px-6 sticky top-0 z-30 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl sm:text-2xl">local_shipping</span>
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-headline font-bold text-primary tracking-wider leading-tight">Delivery Portal</h1>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">
              {user.name} {user.phone ? `• ${user.phone}` : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDeliveries}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-on-surface-variant hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Refresh Deliveries"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Log Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="p-3 sm:p-6 max-w-4xl mx-auto mt-2 sm:mt-4 space-y-4">
        {/* Mobile Quick Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-surface-container border border-white/5 rounded-xl p-3 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs text-on-surface-variant uppercase tracking-wider font-bold block">Total</span>
            <span className="text-lg sm:text-2xl font-headline font-black text-on-surface">{deliveries.length}</span>
          </div>
          <div className="bg-surface-container border border-white/5 rounded-xl p-3 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs text-amber-400 uppercase tracking-wider font-bold block">Active</span>
            <span className="text-lg sm:text-2xl font-headline font-black text-amber-400">
              {deliveries.filter(d => !['Completed', 'Returned to Company'].includes(d.status)).length}
            </span>
          </div>
          <div className="bg-surface-container border border-white/5 rounded-xl p-3 sm:p-4 text-center">
            <span className="text-[10px] sm:text-xs text-emerald-400 uppercase tracking-wider font-bold block">Done</span>
            <span className="text-lg sm:text-2xl font-headline font-black text-emerald-400">
              {deliveries.filter(d => ['Completed', 'Returned to Company'].includes(d.status)).length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface">Assigned Deliveries ({deliveries.length})</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
            <span className="text-xs sm:text-sm">Loading your deliveries...</span>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="bg-surface-container rounded-2xl border border-white/10 p-8 sm:p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-primary">local_shipping</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-on-surface mb-1">No Orders Assigned Yet</h3>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm mx-auto">
              New deliveries assigned to you by the salon admin will instantly alert you here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map(delivery => {
              const isFinished = ['Completed', 'Delivered', 'Returned to Company'].includes(delivery.status);
              return (
                <div 
                  key={delivery._id} 
                  className={`bg-surface-container rounded-2xl border transition-all p-4 sm:p-6 flex flex-col lg:flex-row justify-between gap-5 sm:gap-6 shadow-xl ${
                    isFinished ? 'border-white/5 opacity-90' : 'border-primary/30 shadow-primary/5'
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Top Order Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                          #{delivery.receiptNumber || delivery._id.slice(-6)}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          delivery.status === 'Completed' || delivery.status === 'Delivered'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : delivery.status === 'Picked' || delivery.status === 'Returned to Company'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}>
                          {delivery.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {delivery.createdAt ? new Date(delivery.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                      </span>
                    </div>
                    
                    {/* Customer Contact Details */}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Deliver To</span>
                      <h3 className="text-base sm:text-lg font-bold text-on-surface truncate mt-0.5">
                        {delivery.user?.name || delivery.shippingAddress?.fullName || 'Customer'}
                      </h3>
                      
                      {/* Address preview if available */}
                      {delivery.shippingAddress && (
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {[delivery.shippingAddress.addressLine1, delivery.shippingAddress.city, delivery.shippingAddress.postalCode].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Phone call button */}
                      {(delivery.user?.phone || delivery.shippingAddress?.phone) && (
                        <div className="mt-2.5">
                          <a 
                            href={`tel:${delivery.user?.phone || delivery.shippingAddress?.phone}`}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-bold transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[16px]">call</span>
                            <span>Call: {delivery.user?.phone || delivery.shippingAddress?.phone}</span>
                          </a>
                        </div>
                      )}
                    </div>
                    
                    {/* Order Items Breakdown */}
                    <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1.5">
                      <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">
                        Items ({delivery.items?.reduce((s, it) => s + (it.quantity || 1), 0) || 0}):
                      </p>
                      <div className="space-y-1 divide-y divide-white/5">
                        {delivery.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs pt-1 first:pt-0">
                            <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                            <span className="font-mono text-on-surface-variant shrink-0">₹{item.price * (item.quantity || 1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Amount to collect & payment method */}
                    <div className="flex flex-wrap items-baseline justify-between pt-1 gap-2 border-t border-white/5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Collection Amount</span>
                        <p className="text-lg font-headline font-black text-primary">₹{delivery.totalAmount}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">Payment</span>
                        <span className={`text-xs font-bold ${delivery.paymentStatus === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {delivery.paymentStatus || 'Pending'} ({delivery.paymentMethod || 'COD'})
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side: Map & Touch Controls */}
                  <div className="flex flex-col justify-between gap-3 w-full lg:w-72 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5">
                    {delivery.location && delivery.location.lat && delivery.location.lng ? (
                      <div className="bg-surface-container rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-md">
                        <div className="h-36 sm:h-40 w-full bg-slate-900 z-0 relative">
                          <MapContainer 
                            center={[delivery.location.lat, delivery.location.lng]} 
                            zoom={14} 
                            scrollWheelZoom={false}
                            style={{ height: '100%', width: '100%' }}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={[delivery.location.lat, delivery.location.lng]} />
                          </MapContainer>
                        </div>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${delivery.location.lat},${delivery.location.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-primary/10 hover:bg-primary/20 text-primary text-center py-2.5 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 z-10 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">directions</span>
                          Navigate on Google Maps
                        </a>
                      </div>
                    ) : (
                      <div className="h-28 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex flex-col items-center justify-center p-4 text-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant/40 mb-1">map</span>
                        <span className="text-[11px] text-on-surface-variant">Live map coordinates not attached</span>
                      </div>
                    )}

                    {/* Touch-Friendly Status Update Picker */}
                    <div className="space-y-1.5 mt-auto">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block">
                        Update Delivery Status
                      </label>
                      <select
                        value={delivery.status === 'Processing' ? 'Taken' : delivery.status}
                        onChange={(e) => updateStatus(delivery._id, e.target.value)}
                        className="w-full bg-surface-container-high border border-white/15 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-primary text-on-surface cursor-pointer active:scale-[0.99] transition-transform"
                      >
                        <option value="Taken">Taken</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Completed">Completed</option>
                        <option value="Picked">Picked (Return Pickup)</option>
                        <option value="Returned to Company">Returned to Company</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryBoyDashboard;
