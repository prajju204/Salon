import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/shared/components/ui/sheet";
import { Button } from "@/shared/components/ui/button";

// Helper for notification icons inside layout
const getNotificationIcon = (type) => {
  switch (type) {
    case 'booking_confirmed':
      return { icon: 'check_circle', color: 'text-primary' };
    case 'reminder_24h':
      return { icon: 'schedule', color: 'text-blue-400' };
    case 'reminder_1h':
      return { icon: 'alarm', color: 'text-amber-500' };
    case 'promo':
      return { icon: 'local_offer', color: 'text-rose-400' };
    case 'review_request':
      return { icon: 'star', color: 'text-primary' };
    case 'waitlist_open':
      return { icon: 'auto_awesome', color: 'text-green-400' };
    default:
      return { icon: 'notifications', color: 'text-on-surface-variant' };
  }
};

const CustomerLayout = ({ children }) => {
  const { user, logout, checkVerificationStatus } = useAuth();
  const {
    notifications,
    markAllNotificationsRead,
    clearAllNotifications,
    markNotificationRead
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!user || user.email_verified) return;
    const interval = setInterval(async () => {
      await checkVerificationStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, checkVerificationStatus]);

  const { resendVerification } = useAuth();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResendVerification = async () => {
    setResending(true);
    setResendMessage('');
    setResendError('');
    try {
      const res = await resendVerification(user?.email);
      if (res.devVerificationOtp) {
        setResendMessage(`[DEV MODE] OTP generated: ${res.devVerificationOtp}. Verification email sent.`);
      } else {
        setResendMessage('Verification email sent. Please check your inbox.');
      }
      setTimeout(() => setResendMessage(''), 10000);
    } catch (err) {
      setResendError(err.message || 'Failed to resend verification.');
      setTimeout(() => setResendError(''), 10000);
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const unreadCount = notifications.filter(n => !n.read && n.recipient !== 'admin').length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Shop', path: '/shop', icon: 'storefront' },
    { name: 'Order History', path: '/orders', icon: 'receipt_long' },
    { name: 'Book Service', path: '/services', icon: 'calendar_today' },
    { name: 'My History', path: '/appointments', icon: 'history' },
    { name: 'Digital Wallet', path: '/wallet', icon: 'account_balance_wallet' },
    { name: 'My Coupons', path: '/coupons', icon: 'local_activity' },
    { name: 'My Rewards', path: '/rewards', icon: 'stars' },
    { name: 'Cancellations', path: '/cancellations', icon: 'cancel' },
    { name: 'Notifications', path: '/notifications', icon: 'notifications' },
    { name: 'Reviews', path: '/reviews', icon: 'star' },
    { name: 'Settings', path: '/profile', icon: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 lg:pb-0 lg:pl-[280px]">
      {/* Desktop Navigation Drawer Sidebar */}
      <aside className="hidden lg:flex flex-col h-full w-[280px] fixed left-0 top-0 bg-surface-container border-r border-white/10 shadow-xl py-8 overflow-y-auto z-40">
        <div className="px-8 mb-12">
          <Link to="/dashboard" className="text-headline-md font-headline-md font-bold text-primary tracking-widest block hover:opacity-85">
            LUXE GROOM
          </Link>
        </div>
        <div className="px-6 mb-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
            <img className="w-full h-full object-cover" src={user?.profilePic} alt={user?.name} />
          </div>
          <div>
            <p className="text-on-surface font-bold text-label-md truncate max-w-[150px]">{user?.name}</p>
            <p className="text-on-surface-variant text-label-sm">{user?.title || 'Client'}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-6 py-4 transition-all duration-200 ${
                  isActive
                    ? 'text-primary font-bold bg-primary/5 border-l-4 border-primary'
                    : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-label-md font-label-md">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-6 mt-auto pt-6 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-label-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-400 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full lg:w-[calc(100%-280px)] lg:left-[280px] z-40 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 bg-surface/80 dark:bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden text-primary cursor-pointer active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-headline-md font-headline-md font-bold tracking-widest text-primary dark:text-primary lg:hidden">LUXE GROOM</span>
          <span className="text-headline-md font-headline-md font-bold tracking-widest text-primary dark:text-primary hidden lg:inline">LUXE GROOM PORTAL</span>
        </div>
        <div className="flex items-center gap-6">

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(true)}
              className="relative cursor-pointer group flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Notifications panel"
            >
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-background animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 hover:border-primary/50 shadow-xl cursor-pointer active:scale-95 transition-all duration-200"
              aria-label="Toggle profile menu"
            >
              <img className="w-full h-full object-cover" src={user?.profilePic} alt={user?.name} />
            </button>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  transition={{ type: "spring", stiffness: 350, damping: 26 }}
                  className="absolute right-0 mt-3 w-48 bg-surface-container-high/95 backdrop-blur-xl rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] p-2.5 z-[100] origin-top-right"
                >
                  <div className="px-2 py-1.5 mb-2 border-b border-white/5">
                    <p className="text-xs font-bold text-on-surface truncate">{user?.name}</p>
                    <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2 py-1.5 flex items-center gap-2.5 text-[11px] text-on-surface hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-150 group"
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">settings</span>
                      <span className="font-medium">Settings</span>
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2 py-1.5 flex items-center gap-2.5 text-[11px] text-on-surface hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-150 group"
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">account_balance_wallet</span>
                      <span className="font-medium">Digital Wallet</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setShowProfileMenu(false)}
                      className="w-full px-2 py-1.5 flex items-center gap-2.5 text-[11px] text-on-surface hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-150 group"
                    >
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">notifications</span>
                      <span className="font-medium">Notifications</span>
                    </Link>
                    <div className="h-px bg-white/5 my-1.5" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full px-2 py-1.5 flex items-center gap-2.5 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-150 group cursor-pointer text-left font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px] text-red-400 group-hover:text-red-300 transition-colors">logout</span>
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sidebar */}
      {showMobileSidebar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" onClick={() => setShowMobileSidebar(false)}>
          <aside className="w-[280px] h-full bg-surface-container border-r border-white/10 flex flex-col py-8" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 mb-10 flex justify-between items-center">
              <div>
                <h1 className="text-headline-md font-headline-md font-bold text-primary tracking-widest">LUXE GROOM</h1>
                <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold block mt-1">Customer Portal</span>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {navItems.map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setShowMobileSidebar(false)}
                  className={({ isActive }) =>
                    `px-6 py-4 flex items-center gap-4 transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'text-primary font-bold bg-primary/5 border-l-4 border-primary'
                        : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface'
                    }`
                  }
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-label-md font-label-md">{item.name}</span>
                </NavLink>
              ))}
            </nav>
            <div className="px-6 mt-auto border-t border-white/10 pt-6">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-label-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-950/20 hover:text-red-400"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="w-full min-h-screen pt-20">
        {user && user.role === 'customer' && !user.email_verified && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 text-amber-200 px-margin-mobile md:px-margin-desktop py-3 flex justify-between items-center text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
              <span>Your email is unverified. Please verify your email to unlock all features (booking appointments, placing orders, reviews). <Link to="/verify-email" className="underline font-bold hover:text-white ml-1">Enter code</Link></span>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 rounded text-amber-200 hover:text-white transition-all cursor-pointer font-bold disabled:opacity-50 whitespace-nowrap ml-4"
            >
              {resending ? 'Sending...' : 'Resend Verification'}
            </button>
          </div>
        )}
        {resendMessage && (
          <div className="bg-green-950/40 border-b border-green-500/30 text-green-200 px-margin-mobile md:px-margin-desktop py-2.5 text-xs text-center font-medium">
            {resendMessage}
          </div>
        )}
        {resendError && (
          <div className="bg-red-950/40 border-b border-red-500/30 text-red-200 px-margin-mobile md:px-margin-desktop py-2.5 text-xs text-center font-medium">
            {resendError}
          </div>
        )}
        {children}
      </div>

      {/* Bottom Navigation Bar (Mobile only) */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-surface-container-high/90 dark:bg-surface-container-high/90 backdrop-blur-lg border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] md:hidden rounded-t-xl">
        <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-4 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
          <span className="material-symbols-outlined">home</span>
          <span className="text-label-sm font-label-sm">Home</span>
        </NavLink>
        <NavLink to="/services" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-4 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="text-label-sm font-label-sm">Book</span>
        </NavLink>
        <NavLink to="/appointments" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-4 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
          <span className="material-symbols-outlined">history</span>
          <span className="text-label-sm font-label-sm">History</span>
        </NavLink>
        <NavLink to="/wallet" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-4 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          <span className="text-label-sm font-label-sm">Wallet</span>
        </NavLink>
      </nav>

      {/* Floating Action Button (Only on Mobile, redirecting to Book) */}
      <button
        onClick={() => navigate('/services')}
        className="fixed bottom-24 right-margin-mobile md:bottom-12 md:right-margin-desktop w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform md:hidden"
      >
        <span className="material-symbols-outlined text-[32px] font-bold">add</span>
      </button>

      {/* Notifications Slide-in Sheet */}
      <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
        <SheetContent side="right">
          <SheetHeader>
            <div className="flex justify-between items-center w-full">
              <SheetTitle>Notifications</SheetTitle>
              <div className="flex gap-2">
                <button
                  onClick={markAllNotificationsRead}
                  disabled={notifications.length === 0}
                  className="text-[9px] uppercase font-bold tracking-wider text-primary hover:underline disabled:opacity-50 cursor-pointer"
                >
                  Mark Read
                </button>
                <span className="text-white/10">|</span>
                <button
                  onClick={clearAllNotifications}
                  disabled={notifications.length === 0}
                  className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
            <SheetDescription>
              Stay updated with your queue status, waitlists and special promotions.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col h-[calc(100%-80px)] justify-between">
            <div className="flex-grow overflow-y-auto pr-1 py-2 space-y-3 custom-scrollbar">
              {notifications.filter(n => n.recipient !== 'admin').length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <span className="material-symbols-outlined text-on-surface-variant/20 text-4xl mb-2 animate-pulse">notifications_off</span>
                  <p className="text-xs text-on-surface-variant">Your inbox is empty.</p>
                </div>
              ) : (
                notifications.filter(n => n.recipient !== 'admin').map((n) => {
                  const iconInfo = getNotificationIcon(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        setShowNotifications(false);
                        if (n.deepLink) navigate(n.deepLink);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer hover:border-primary/20 ${
                        n.read ? 'border-white/5 bg-white/[0.01]' : 'border-primary/20 bg-primary/[0.02]'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <span className={`material-symbols-outlined text-base ${iconInfo.color} font-bold mt-0.5`}>
                          {iconInfo.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold leading-snug truncate ${n.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                            {n.title}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                            {n.description}
                          </p>
                          <span className="text-[8px] text-on-surface-variant/60 block mt-1.5 font-mono uppercase">
                            {n.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-white/5">
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-1 text-xs"
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/notifications');
                }}
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                View All Notifications
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CustomerLayout;
