import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

const API_URL = 'http://localhost:5000/api';

export const AppProvider = ({ children }) => {
  const { user } = useAuth();

  // --- Refs for Waitlist Timers ---
  const waitlistTimers = useRef({});

  // --- States ---
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [products, setProducts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Notifications State
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('luxe.notifications');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // 2. Wallet & Payments State
  const [walletCards, setWalletCards] = useState(() => {
    const stored = localStorage.getItem('luxe.wallet.cards');
    return stored ? JSON.parse(stored) : [];
  });

  const [walletTransactions, setWalletTransactions] = useState(() => {
    const stored = localStorage.getItem('luxe.wallet.transactions');
    return stored ? JSON.parse(stored) : [];
  });

  const [giftCardBalance, setGiftCardBalance] = useState(() => {
    const stored = localStorage.getItem('luxe.wallet.giftcard.balance');
    return stored ? Number(stored) : 0;
  });

  const [giftCardRedemptions, setGiftCardRedemptions] = useState(() => {
    const stored = localStorage.getItem('luxe.wallet.giftcard.redemptions');
    return stored ? JSON.parse(stored) : [];
  });

  // 3. Reviews State (User-submitted reviews)
  const [reviews, setReviews] = useState(() => {
    const stored = localStorage.getItem('luxe.reviews');
    return stored ? JSON.parse(stored) : [];
  });

  // 4. Waitlist State
  const [waitlist, setWaitlist] = useState(() => {
    const stored = localStorage.getItem('luxe.waitlist');
    return stored ? JSON.parse(stored) : [];
  });

  // Dynamic API URL prefix based on active portal (Admin: 5174, User: 5173)
  const getRolePrefix = () => {
    return (window.location.port === '5174' || document.title.includes('Admin')) ? `${API_URL}/admin` : `${API_URL}/auth`;
  };

  // --- Sync State changes to LocalStorage ---
  useEffect(() => {
    localStorage.setItem('luxe.notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('luxe.wallet.cards', JSON.stringify(walletCards));
  }, [walletCards]);

  useEffect(() => {
    localStorage.setItem('luxe.wallet.transactions', JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  useEffect(() => {
    localStorage.setItem('luxe.wallet.giftcard.balance', giftCardBalance.toString());
  }, [giftCardBalance]);

  useEffect(() => {
    localStorage.setItem('luxe.wallet.giftcard.redemptions', JSON.stringify(giftCardRedemptions));
  }, [giftCardRedemptions]);

  useEffect(() => {
    localStorage.setItem('luxe.reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('luxe.waitlist', JSON.stringify(waitlist));
  }, [waitlist]);

  // --- Fetch Data from Backend ---
  const fetchAllData = async () => {
    const isAdminPortal = window.location.port === '5174' || document.title.includes('Admin');
    const TOKEN_KEY = isAdminPortal ? 'luxe_admin_token' : 'luxe_user_token';
    const token = localStorage.getItem(TOKEN_KEY);

    // For admin portal: allow fetch if token exists even without user context
    // For customer portal: require user context
    if (!user && !isAdminPortal) return;
    if (isAdminPortal && !token) return; // admin needs a token

    setLoadingData(true);
    const prefix = getRolePrefix();
    const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      // Services (Admin or Client)
      try {
        const resServices = await axios.get(`${prefix}/services`, authConfig);
        if (resServices.data?.success && resServices.data.data.length > 0) {
          const normalized = resServices.data.data.map(s => ({ ...s, id: s._id || s.id }));
          setServices(normalized);
        } else {
          setServices([]);
        }
      } catch (err) {
        setServices([]);
      }

      // Barbers (Admin or Client)
      try {
        const resBarbers = await axios.get(`${prefix}/barbers`, authConfig);
        if (resBarbers.data?.success && resBarbers.data.data.length > 0) {
          const normalized = resBarbers.data.data.map(b => ({ ...b, id: b._id || b.id }));
          setBarbers(normalized);
        } else {
          setBarbers([]);
        }
      } catch (err) {
        setBarbers([]);
      }

      // Products (Admin or Client)
      try {
        const resProducts = await axios.get(`${prefix}/products`, authConfig);
        if (resProducts.data?.success && resProducts.data.data.length > 0) {
          const normalized = resProducts.data.data.map(p => ({ ...p, id: p._id || p.id }));
          setProducts(normalized);
        } else {
          setProducts([]);
        }
      } catch (err) {
        setProducts([]);
      }

      // Protected data — appointments & notifications
      if (token) {
        // Appointments
        try {
          const resApts = await axios.get(`${prefix}/appointments`, authConfig);
          if (resApts.data?.success) {
            const normalized = resApts.data.data.map(apt => ({ ...apt, id: apt._id }));
            setAppointments(normalized);
            localStorage.setItem('luxe_appointments', JSON.stringify(normalized));
          }
        } catch (err) {
          const stored = localStorage.getItem('luxe_appointments');
          if (stored) {
            setAppointments(JSON.parse(stored));
          }
        }
        // Orders
        try {
          const resOrders = await axios.get(`${prefix}/orders`, authConfig);
          if (resOrders.data?.success) {
            const normalized = resOrders.data.data.map(ord => ({ ...ord, id: ord._id }));
            setOrders(normalized);
            localStorage.setItem('luxe_orders', JSON.stringify(normalized));
          }
        } catch (err) {
          const stored = localStorage.getItem('luxe_orders');
          if (stored) {
            setOrders(JSON.parse(stored));
          }
        }
        // Notifications
        try {
          const resNotifs = await axios.get(`${prefix}/notifications`, authConfig);
          if (resNotifs.data?.success) {
            const mappedNotifs = resNotifs.data.data.map(notif => ({
              id: notif.notificationId || notif._id,
              type: notif.type ? notif.type.toLowerCase().replace(/ /g, '_') : 'info',
              title: notif.title || 'New Notification',
              description: notif.message || notif.text || '',
              timestamp: notif.time || 'Just now',
              createdAt: notif.createdAt || new Date().toISOString(),
              read: notif.isRead || notif.read || false,
              deepLink: notif.bookingId ? `/appointments/${notif.bookingId}` : '/notifications',
              recipient: notif.recipient || notif.recipientRole || (isAdminPortal ? 'admin' : 'customer'),
              bookingDetails: notif.bookingDetails || null,
              bookingPayload: notif.bookingPayload || null
            }));
            setNotifications(mappedNotifs);
          }
        } catch (err) {
          const stored = localStorage.getItem('luxe.notifications');
          if (stored) setNotifications(JSON.parse(stored));
        }
      } else {
        // No token, load local appointments
        const storedApt = localStorage.getItem('luxe_appointments');
        if (storedApt) setAppointments(JSON.parse(storedApt));
        const storedOrders = localStorage.getItem('luxe_orders');
        if (storedOrders) setOrders(JSON.parse(storedOrders));
        const storedNotif = localStorage.getItem('luxe.notifications');
        if (storedNotif) setNotifications(JSON.parse(storedNotif));
      }
    } catch (error) {
      console.error('Error fetching data from API:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Trigger fetchAllData whenever user changes (login/logout)
  useEffect(() => {
    fetchAllData();
  }, [user]);

  // For admin portal: also fetch on mount even if user context not yet hydrated
  // This handles page refresh where token exists but user state takes a moment
  useEffect(() => {
    if (window.location.port === '5174' || document.title.includes('Admin')) {
      const adminToken = localStorage.getItem('luxe_admin_token');
      if (adminToken) {
        fetchAllData();
      }
    }
  }, []);

  // --- Demo Timer for Incoming Notifications ---
  useEffect(() => {
    if (!user) return;

    // Simulate a welcome offer promo notification 8 seconds after login
    const timer = setTimeout(() => {
      const exists = notifications.some(n => n.id === 'promo-welcome');
      if (!exists) {
        addLocalNotification(
          'promo',
          'Exclusive Offer Unlocked!',
          'Enjoy ₹300 off your next grooming session using code WELCOME300 at checkout.',
          '/wallet'
        );
        toast.info('New Notification: Exclusive Offer Unlocked!');
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [user]);

  // --- Real‑time admin/customer notifications via Socket.IO & Polling ---
  useEffect(() => {
    if (!user) return;
    const isAdmin = window.location.port === '5174' || document.title.includes('Admin');

    // 1. Initialize socket connection
    const socket = io('http://localhost:5000');
    socket.emit('join', isAdmin ? 'admin' : (user.email || 'customer'));

    // 2. Listen for new notifications from server
    socket.on('new-notification', (notif) => {
      const mapped = {
        id: notif.notificationId || `notif-${Date.now()}`,
        type: notif.type ? notif.type.toLowerCase().replace(/ /g, '_') : 'info',
        title: notif.title || 'New Notification',
        description: notif.message || notif.text || '',
        timestamp: 'Just now',
        createdAt: notif.createdAt || new Date().toISOString(),
        read: false,
        deepLink: '/notifications',
        recipient: notif.recipient || (isAdmin ? 'admin' : 'customer'),
        bookingDetails: notif.bookingDetails || null,
        bookingPayload: notif.bookingPayload || null
      };

      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some(n => n.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });

      // Play sound and show toast
      if (isAdmin && mapped.recipient === 'admin') {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Audio play blocked:', e));
        } catch (e) { console.log('Audio error', e); }
        toast.info(`🔔 ${mapped.title}`, { description: mapped.description });
      } else if (!isAdmin) {
        toast.info(`New Notification: ${mapped.title}`);
      }

      // Auto-inject booking into appointments if included in payload
      if (isAdmin && (notif.type === 'New Booking' || notif.type === 'booking_request') && notif.bookingDetails) {
        setAppointments(prev => {
          if (prev.some(a => a._id === notif.bookingDetails._id)) return prev;
          return [notif.bookingDetails, ...prev];
        });
      }
    });

    // Real-time product updates sync listener
    socket.on('products_updated', () => {
      console.log('[Socket] Products updated. Refreshing data...');
      fetchAllData();
    });


    // 3. Fallback Polling (Every 30 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const prefix = isAdmin ? `${API_URL}/admin` : `${API_URL}/auth`;
        const pollToken = isAdmin
          ? localStorage.getItem('luxe_admin_token')
          : localStorage.getItem('luxe_user_token');
        if (!pollToken) return;
        const pollConfig = { headers: { Authorization: `Bearer ${pollToken}` } };
        const resNotifs = await axios.get(`${prefix}/notifications`, pollConfig);
        if (resNotifs.data?.success) {
          const mappedNotifs = resNotifs.data.data.map(notif => ({
            id: notif.notificationId || notif._id,
            type: notif.type || 'info',
            title: notif.title || 'New Notification',
            description: notif.message || notif.text || '',
            timestamp: notif.time || 'Just now',
            createdAt: notif.createdAt || new Date().toISOString(),
            read: notif.isRead || notif.read || false,
            deepLink: notif.bookingId ? `/appointments/${notif.bookingId}` : '/notifications',
            recipient: notif.recipient || notif.recipientRole || (isAdmin ? 'admin' : 'customer'),
            bookingDetails: notif.bookingDetails || null,
            bookingPayload: notif.bookingPayload || null
          }));
          setNotifications(prev => {
            // Merge to avoid overriding local state (like read status before sync)
            const newIds = new Set(mappedNotifs.map(n => n.id));
            const existingToKeep = prev.filter(n => !newIds.has(n.id));
            return [...mappedNotifs, ...existingToKeep].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          });
        }
        // Also refresh appointments for admin every poll cycle
        if (isAdmin) {
          const resApts = await axios.get(`${prefix}/appointments`, pollConfig);
          if (resApts.data?.success) {
            const normalized = resApts.data.data.map(apt => ({ ...apt, id: apt._id }));
            setAppointments(normalized);
            localStorage.setItem('luxe_appointments', JSON.stringify(normalized));
          }
        }
      } catch (e) { console.log('Polling error', e); }
    }, 30000);

    // Cleanup on unmount or user change
    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [user]);

  // --- Action Handlers ---

  // 1. Notifications Actions
  const addLocalNotification = (type, title, description, deepLink) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      type,
      title,
      description,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      deepLink
    };
    setNotifications(prev => [newNotif, ...prev]);
    return newNotif;
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read.');
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success('Notification list cleared.');
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // 2. Wallet Actions
  const addWalletCard = (card) => {
    const newCard = {
      id: `card-${Date.now()}`,
      brand: card.number.startsWith('4') ? 'visa' : card.number.startsWith('5') ? 'mastercard' : 'rupay',
      isDefault: walletCards.length === 0,
      ...card
    };
    setWalletCards(prev => [...prev, newCard]);
    toast.success('Credit card added successfully.');
  };

  const deleteWalletCard = (id) => {
    setWalletCards(prev => {
      const filtered = prev.filter(c => c.id !== id);
      // If we deleted the default, set another card as default if list is not empty
      if (filtered.length > 0 && !filtered.some(c => c.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
    toast.success('Card removed from digital wallet.');
  };

  const setDefaultWalletCard = (id) => {
    setWalletCards(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === id
    })));
    toast.success('Set card as default payment method.');
  };

  const redeemGiftCard = (code) => {
    const cleanCode = code.trim().toUpperCase();

    // Check if already redeemed
    const alreadyRedeemed = giftCardRedemptions.some(r => r.code === cleanCode);
    if (alreadyRedeemed) {
      throw new Error('This gift card has already been redeemed.');
    }

    let amount = 0;
    let description = '';

    if (cleanCode === 'LUXE500') {
      amount = 500;
      description = 'Loyalty Rewards Voucher';
    } else if (cleanCode === 'FESTIVE1000') {
      amount = 1000;
      description = 'Festival Special Reward';
    } else if (cleanCode === 'GROOM2000') {
      amount = 2000;
      description = 'Premium Gift Voucher';
    } else {
      throw new Error('Invalid coupon or gift card code.');
    }

    const redemption = {
      id: `red-${Date.now()}`,
      code: cleanCode,
      amount,
      date: new Date().toISOString().split('T')[0],
      description
    };

    setGiftCardBalance(prev => prev + amount);
    setGiftCardRedemptions(prev => [redemption, ...prev]);

    addLocalNotification(
      'waitlist_open',
      'Gift Card Redeemed',
      `₹${amount} has been added to your digital wallet balance.`,
      '/wallet'
    );

    return amount;
  };

  // 3. Reviews Actions
  const addStylistReview = (review) => {
    const newReview = {
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      clientAvatar: user?.profilePic || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw',
      ...review
    };

    setReviews(prev => [newReview, ...prev]);

    // Update stylist rating in state locally
    setBarbers(prev => prev.map(barb => {
      if (barb.name === review.barberName) {
        // Calculate new rating
        const currentRating = barb.rating || 5.0;
        const currentCount = barb.completedBookings || 100;
        const newRating = ((currentRating * currentCount) + review.rating) / (currentCount + 1);
        return {
          ...barb,
          rating: Number(newRating.toFixed(1)),
          completedBookings: currentCount + 1
        };
      }
      return barb;
    }));

    toast.success('Your review has been published.');
    return newReview;
  };

  const deleteStylistReview = (id) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    toast.success('Your review was deleted.');
  };

  const updateStylistReview = (id, updatedText, updatedRating) => {
    setReviews(prev => prev.map(r => r.id === id ? {
      ...r,
      text: updatedText,
      rating: updatedRating
    } : r));
    toast.success('Your review has been updated.');
  };

  // 4. Waitlist Actions
  const joinWaitlist = (entry) => {
    const position = Math.floor(Math.random() * 4) + 1; // #1 to #5
    const newEntry = {
      id: `wait-${Date.now()}`,
      position,
      createdAt: new Date().toISOString(),
      ...entry
    };

    setWaitlist(prev => [...prev, newEntry]);
    toast.success("You've been added to the waitlist!");

    // Simulate slot release timer in demo mode (30 seconds)
    const timer = setTimeout(() => {
      // Fire waitlist open notification
      const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      });
      const notifyText = `A slot just opened with ${entry.stylistName} on ${formattedDate} (${entry.timeWindowPreference})! Book it now.`;

      const notif = addLocalNotification(
        'waitlist_open',
        'Waitlist Slot Opened!',
        notifyText,
        `/book-appointment?prefillWaitlist=${newEntry.id}`
      );

      toast.info(`Waitlist Slot Opened: Book now for ${entry.stylistName}!`, {
        duration: 8000
      });

      // Auto-update position to 0 (indicating open)
      setWaitlist(prev => prev.map(w => w.id === newEntry.id ? { ...w, position: 0 } : w));
    }, 30000);

    // Save timer ref to clear if user leaves waitlist or component unmounts
    waitlistTimers.current[newEntry.id] = timer;
    return newEntry;
  };

  const leaveWaitlist = (id) => {
    setWaitlist(prev => prev.filter(w => w.id !== id));

    // Clear simulation timer if still active
    if (waitlistTimers.current[id]) {
      clearTimeout(waitlistTimers.current[id]);
      delete waitlistTimers.current[id];
    }
    toast.success("Left the waitlist.");
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(waitlistTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Standard Appointment Actions (Enhanced with fallback & notifications)
  const addAppointment = async (apt) => {
    const tempId = 'apt-' + Date.now();
    const newAptLocal = {
      id: tempId,
      _id: tempId,
      status: 'Pending',
      clientName: user?.name || 'Guest',
      clientEmail: user?.email || '',
      ...apt
    };

    // If booking was from waitlist prefill, remove user from waitlist
    const searchParams = new URLSearchParams(window.location.search);
    const waitlistId = searchParams.get('prefillWaitlist');
    if (waitlistId) {
      leaveWaitlist(waitlistId);
    }

    // Add transaction to wallet history
    const newTx = {
      id: `tx-${Date.now()}`,
      serviceName: apt.serviceName,
      stylistName: apt.barberName,
      date: apt.date,
      amount: apt.price,
      status: 'Paid',
      receiptNumber: `REC-${Date.now().toString().slice(-8)}`,
      paymentMethod: 'Razorpay'
    };
    setWalletTransactions(prev => [newTx, ...prev]);

    const bookingPayload = {
      bookingId: tempId,
      userId: user?.id || '',
      userName: user?.name || 'Guest',
      userAvatar: user?.profilePic || '',
      serviceName: apt.serviceName,
      stylistName: apt.barberName,
      date: apt.date,
      time: apt.time,
      price: apt.price,
      notes: apt.notes
    };

    // --- Save to Backend Database ---
    let savedApt = newAptLocal;
    try {
      const userToken = localStorage.getItem('luxe_user_token');
      if (userToken) {
        const res = await axios.post(
          `${API_URL}/auth/appointments`,
          {
            serviceName: apt.serviceName,
            price: apt.price,
            date: apt.date,
            time: apt.time,
            barberId: apt.barberId || '',
            barberName: apt.barberName,
            notes: apt.notes || ''
          },
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        if (res.data?.success && res.data.data) {
          savedApt = { ...res.data.data, id: res.data.data._id };
        }
      }
    } catch (apiErr) {
      console.warn('Backend save failed, using local fallback:', apiErr);
    }

    // Update local state & localStorage with real or fallback appointment
    setAppointments(prev => [savedApt, ...prev]);
    const stored = localStorage.getItem('luxe_appointments') || '[]';
    const list = JSON.parse(stored);
    localStorage.setItem('luxe_appointments', JSON.stringify([savedApt, ...list]));

    // Emit Customer notification (local)
    const customerNotif = {
      id: `notif-pending-${Date.now()}`,
      type: 'booking_pending',
      recipient: 'customer',
      title: 'Booking Awaiting Confirmation',
      description: `Your booking for ${bookingPayload.serviceName} with ${bookingPayload.stylistName} on ${bookingPayload.date} at ${bookingPayload.time} is awaiting salon confirmation.`,
      timestamp: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      status: 'pending',
      bookingPayload
    };

    setNotifications(prev => [customerNotif, ...prev]);
    toast.success("Booking confirmed! Your appointment has been saved.");
    return savedApt;
  };

  const confirmBooking = async (bookingId) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/appointments/${bookingId}/status`, { status: 'Confirmed' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === bookingId || apt._id === bookingId ? { ...apt, status: 'Confirmed' } : apt))
        );
        toast.success('Booking confirmed successfully.');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error(error.response?.data?.message || 'Error confirming booking.');
    }
  };

  const declineBooking = async (bookingId, reason) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/appointments/${bookingId}/status`, { status: 'Declined', reason }, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === bookingId || apt._id === bookingId ? { ...apt, status: 'Declined' } : apt))
        );
        toast.success('Booking declined successfully.');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error declining booking:', error);
      toast.error(error.response?.data?.message || 'Error declining booking.');
    }
  };

  const rescheduleAppointment = async (id, updatedDetails) => {
    // Add transaction adjustment for refund/rebooking if needed
    try {
      const res = await axios.put(`${API_URL}/auth/appointments/${id}/reschedule`, updatedDetails);
      if (res.data?.success) {
        const updated = { ...res.data.data, id: res.data.data._id };
        setAppointments(prev => prev.map(apt => (apt.id === id || apt._id === id ? updated : apt)));

        addLocalNotification(
          'booking_confirmed',
          'Appointment Rescheduled',
          `Successfully moved appointment to ${updatedDetails.date} at ${updatedDetails.time}.`,
          '/appointments'
        );

        fetchAllData();
        return updated;
      }
    } catch (error) {
      console.error('Error rescheduling appointment via API, falling back to local update:', error);
    }

    // Fallback to local storage update
    const updatedLocal = {
      status: 'Rescheduled',
      ...updatedDetails
    };
    setAppointments(prev => prev.map(apt => {
      if (apt.id === id || apt._id === id) {
        return { ...apt, ...updatedLocal };
      }
      return apt;
    }));

    const stored = localStorage.getItem('luxe_appointments');
    if (stored) {
      const list = JSON.parse(stored);
      localStorage.setItem('luxe_appointments', JSON.stringify(list.map(apt => {
        if (apt.id === id || apt._id === id) {
          return { ...apt, ...updatedLocal };
        }
        return apt;
      })));
    }

    addLocalNotification(
      'booking_confirmed',
      'Appointment Rescheduled',
      `Successfully moved appointment to ${updatedDetails.date} at ${updatedDetails.time}.`,
      '/appointments'
    );

    return updatedLocal;
  };

  const cancelAppointment = async (id) => {
    // Add transaction adjustment
    const targetApt = appointments.find(a => a.id === id || a._id === id);
    if (targetApt) {
      const refundTx = {
        id: `tx-${Date.now()}`,
        serviceName: targetApt.serviceName,
        stylistName: targetApt.barberName,
        date: new Date().toISOString().split('T')[0],
        amount: targetApt.price,
        status: 'Refunded',
        receiptNumber: `REC-${Date.now().toString().slice(-8)}-REF`,
        paymentMethod: 'Refund to Visa (•••• 4242)'
      };
      setWalletTransactions(prev => [refundTx, ...prev]);
    }

    try {
      const res = await axios.delete(`${API_URL}/auth/appointments/${id}`);
      if (res.data?.success) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === id || apt._id === id ? { ...apt, status: 'Cancelled' } : apt))
        );

        addLocalNotification(
          'reminder_24h',
          'Booking Cancelled',
          `Your appointment for ${targetApt?.serviceName} was successfully cancelled.`,
          '/appointments'
        );

        fetchAllData();
        return;
      }
    } catch (error) {
      console.error('Error cancelling appointment via API, falling back to local update:', error);
    }

    // Local update fallback
    setAppointments(prev =>
      prev.map(apt => (apt.id === id || apt._id === id ? { ...apt, status: 'Cancelled' } : apt))
    );
    const stored = localStorage.getItem('luxe_appointments');
    if (stored) {
      const list = JSON.parse(stored);
      localStorage.setItem('luxe_appointments', JSON.stringify(list.map(apt => {
        if (apt.id === id || apt._id === id) {
          return { ...apt, status: 'Cancelled' };
        }
        return apt;
      })));
    }

    addLocalNotification(
      'reminder_24h',
      'Booking Cancelled',
      `Your appointment for ${targetApt?.serviceName} was successfully cancelled.`,
      '/appointments'
    );
  };

  // Simulated method to mark appointment status as Completed for testing review triggers
  const simulateCompleteAppointment = (id) => {
    const targetApt = appointments.find(a => a.id === id || a._id === id);
    if (!targetApt) return;

    setAppointments(prev => prev.map(apt => {
      if (apt.id === id || apt._id === id) {
        return { ...apt, status: 'Completed' };
      }
      return apt;
    }));

    // Trigger review notification request
    setTimeout(() => {
      addLocalNotification(
        'review_request',
        'Review Stylist Shave',
        `Rate your Completed grooming session with ${targetApt.barberName}.`,
        `/reviews?triggerReview=${id}`
      );
      toast.success(`Session completed! A rating request has been generated for ${targetApt.barberName}.`);
    }, 1000);
  };

  const updateAppointmentStatus = async (id, status) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/appointments/${id}/status`, { status }, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === id || apt._id === id ? { ...apt, status } : apt))
        );
        toast.success(`Appointment status updated to ${status}.`);
        fetchAllData();
        return;
      }
    } catch (error) {
      console.error('Error updating appointment status via API, saving locally:', error);
    }
    // Fallback: update local state
    setAppointments(prev =>
      prev.map(apt => (apt.id === id || apt._id === id ? { ...apt, status } : apt))
    );
    const stored = localStorage.getItem('luxe_appointments');
    if (stored) {
      const list = JSON.parse(stored);
      localStorage.setItem('luxe_appointments', JSON.stringify(list.map(apt => {
        if (apt.id === id || apt._id === id) return { ...apt, status };
        return apt;
      })));
    }
    toast.success(`Appointment status updated to ${status}.`);
  };

  const addService = async (service) => {
    const tempId = 'service-' + Date.now();
    const localService = { id: tempId, _id: tempId, rating: 5.0, ...service };
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.post(`${API_URL}/admin/services`, service, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const newService = { ...res.data.data, id: res.data.data._id };
        setServices(prev => [...prev, newService]);
        toast.success('Service added successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      console.error('Error adding service via API, saving locally:', error);
    }
    // Fallback: update local state
    setServices(prev => [...prev, localService]);
    toast.success('Service added (offline mode).');
  };

  const updateService = async (updatedService) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/services/${updatedService.id || updatedService._id}`, updatedService, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const service = { ...res.data.data, id: res.data.data._id };
        setServices(prev =>
          prev.map(ser => (ser.id === service.id ? service : ser))
        );
        toast.success('Service updated successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      console.error('Error updating service via API, saving locally:', error);
    }
    // Fallback: update local state
    setServices(prev => prev.map(ser => (ser.id === updatedService.id || ser._id === updatedService._id ? { ...ser, ...updatedService } : ser)));
    toast.success('Service updated (offline mode).');
  };

  const deleteService = async (id) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.delete(`${API_URL}/admin/services/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        setServices(prev => prev.filter(ser => ser.id !== id && ser._id !== id));
        toast.success('Service deleted successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      console.error('Error deleting service via API, removing locally:', error);
    }
    // Fallback: remove from local state
    setServices(prev => prev.filter(ser => ser.id !== id && ser._id !== id));
    toast.success('Service deleted (offline mode).');
  };

  const addBarber = async (barber) => {
    const tempId = 'barber-' + Date.now();
    const localBarber = {
      id: tempId,
      _id: tempId,
      rating: 5.0,
      revenue: 0,
      completedBookings: 0,
      activeDays: 5,
      skills: [],
      image: barber.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw',
      ...barber
    };
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.post(`${API_URL}/admin/barbers`, barber, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const newBarber = { ...res.data.data, id: res.data.data._id };
        setBarbers(prev => [...prev, newBarber]);
        toast.success(`${barber.name} added to staff successfully.`);
        fetchAllData();
        return;
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        throw error;
      }
      console.error('Error adding barber via API, saving locally:', error);
    }
    // Fallback: update local state so admin sees the new staff immediately
    setBarbers(prev => [...prev, localBarber]);
    toast.success(`${barber.name} added to staff (offline mode).`);
  };

  const updateBarber = async (updatedBarber) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/barbers/${updatedBarber.id || updatedBarber._id}`, updatedBarber, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const barber = { ...res.data.data, id: res.data.data._id };
        setBarbers(prev =>
          prev.map(barb => (barb.id === barber.id ? barber : barb))
        );
        toast.success(`${updatedBarber.name}'s profile updated.`);
        fetchAllData();
        return;
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        throw error;
      }
      console.error('Error updating barber via API, saving locally:', error);
    }
    // Fallback: update local state
    setBarbers(prev => prev.map(barb => (barb.id === updatedBarber.id || barb._id === updatedBarber._id ? { ...barb, ...updatedBarber } : barb)));
    toast.success(`${updatedBarber.name}'s profile updated (offline mode).`);
  };

  const deleteBarber = async (id) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.delete(`${API_URL}/admin/barbers/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.data?.success) {
        setBarbers(prev => prev.filter(barb => barb.id !== id && barb._id !== id));
        toast.success('Barber removed successfully.');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error deleting barber via API, removing locally:', error);
    }
    // Fallback: remove from local state
    setBarbers(prev => prev.filter(barb => barb.id !== id && barb._id !== id));
    toast.success('Barber removed (offline mode).');
  };

  const addProduct = async (product) => {
    const tempId = 'product-' + Date.now();
    const localProduct = { id: tempId, _id: tempId, ...product };
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.post(`${API_URL}/admin/products`, product, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const newProduct = { ...res.data.data, id: res.data.data._id };
        setProducts(prev => [...prev, newProduct]);
        toast.success('Product added successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        throw error;
      }
      console.error('Error adding product via API, saving locally:', error);
    }
    setProducts(prev => [...prev, localProduct]);
    toast.success('Product added (offline mode).');
  };

  const updateProduct = async (updatedProduct) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.put(`${API_URL}/admin/products/${updatedProduct.id || updatedProduct._id}`, updatedProduct, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const product = { ...res.data.data, id: res.data.data._id };
        setProducts(prev =>
          prev.map(p => (p.id === product.id ? product : p))
        );
        toast.success('Product updated successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        throw error;
      }
      console.error('Error updating product via API, saving locally:', error);
    }
    setProducts(prev => prev.map(p => (p.id === updatedProduct.id || p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p)));
    toast.success('Product updated (offline mode).');
  };

  const deleteProduct = async (id) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.delete(`${API_URL}/admin/products/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
        toast.success('Product deleted successfully.');
        fetchAllData();
        return;
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
        throw error;
      }
      console.error('Error deleting product via API, removing locally:', error);
    }
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
    toast.success('Product deleted (offline mode).');
  };


  const addReview = async (review) => {
    try {
      const res = await axios.post(`${API_URL}/auth/reviews`, review);
      if (res.data?.success) {
        const newReview = { ...res.data.data, id: res.data.data._id };
        // Trigger local reviews update too
        addStylistReview(review);
        fetchAllData();
      }
    } catch (error) {
      addStylistReview(review); // Save locally on fail
    }
  };

  const addNotification = async (text) => {
    try {
      const adminToken = localStorage.getItem('luxe_admin_token');
      const res = await axios.post(`${API_URL}/admin/notifications`, { text, recipientRole: 'admin' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data?.success) {
        const newNot = { ...res.data.data, id: res.data.data._id };
        setNotifications(prev => [newNot, ...prev]);
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const createProductOrder = async (orderData) => {
    try {
      const token = localStorage.getItem('luxe_user_token');
      const prefix = getRolePrefix();
      const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const res = await axios.post(`${prefix}/orders`, orderData, authConfig);
      if (res.data?.success) {
        const newOrder = { ...res.data.data, id: res.data.data._id };
        setOrders(prev => [newOrder, ...prev]);

        // Sync local storage
        const stored = localStorage.getItem('luxe_orders') || '[]';
        const list = JSON.parse(stored);
        localStorage.setItem('luxe_orders', JSON.stringify([newOrder, ...list]));

        // Deduct from wallet if applicable
        if (orderData.paymentMethod === 'Digital Wallet') {
          setGiftCardBalance(prev => Math.max(0, prev - orderData.totalAmount));
        }

        addLocalNotification(
          'promo',
          'Order Placed Successfully!',
          `Your order ${newOrder.receiptNumber} for ₹${newOrder.totalAmount} has been placed.`,
          '/orders'
        );

        return newOrder;
      }
    } catch (err) {
      console.error('Error placing order:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        services,
        barbers,
        appointments,
        orders,
        notifications,
        walletCards,
        walletTransactions,
        giftCardBalance,
        giftCardRedemptions,
        reviews,
        waitlist,
        loadingData,

        // Notifications handlers
        addLocalNotification,
        markAllNotificationsRead,
        markNotificationAsRead,
        clearAllNotifications,
        markNotificationRead,

        // Wallet handlers
        addWalletCard,
        deleteWalletCard,
        setDefaultWalletCard,
        redeemGiftCard,

        // Reviews handlers
        addStylistReview,
        deleteStylistReview,
        updateStylistReview,

        // Waitlist handlers
        joinWaitlist,
        leaveWaitlist,

        // Appointments handlers
        addAppointment,
        rescheduleAppointment,
        cancelAppointment,
        simulateCompleteAppointment,
        confirmBooking,
        declineBooking,

        // Admin updates
        updateAppointmentStatus,
        addService,
        updateService,
        deleteService,
        addBarber,
        updateBarber,
        deleteBarber,

        // Product handlers
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        createProductOrder,

        addReview,
        addNotification,
        refreshData: fetchAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
