import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { toast } from 'sonner';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useApp();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const navigate = useNavigate();

  const isStaff = user && user.role !== 'admin';

  // Helper: is a notification for me? Checks both recipient and recipientRole fields
  const isMyNotification = (n) => {
    const role = isStaff ? 'staff' : 'admin';
    const r = n.recipient || n.recipientRole || 'admin';
    return r === role;
  };

  // Filter unread alerts specifically destined for admin/staff role
  const unreadCount = notifications.filter(n => !n.read && isMyNotification(n)).length;

  const handleLogout = async () => {
    try {
      await logout();
      // Ensure all storage is cleared
      localStorage.removeItem('luxe_token');
      localStorage.removeItem('luxe_user');
      localStorage.removeItem('luxe_admin_token');
      localStorage.removeItem('luxe_admin');
      sessionStorage.clear();
      
      // Redirect using replace: true to prevent back button from accessing protected route
      navigate('/login', { replace: true });
      toast.success('You have been logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('luxe_admin_token');
      localStorage.removeItem('luxe_admin');
      navigate('/login', { replace: true });
    }
  };

  const navItems = isStaff 
    ? [
        { name: 'Staff Dashboard', path: '/staff-dashboard', icon: 'dashboard' },
        { name: 'Attendance', path: '/staff-attendance', icon: 'check_circle' }
      ]
    : [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { name: 'Appointments', path: '/appointments', icon: 'event_note' },
        { name: 'Notifications', path: '/notifications', icon: 'notifications' },
        { name: 'Staff Management', path: '/staff', icon: 'group' },
        { name: 'Delivery Boys', path: '/delivery-boys', icon: 'local_shipping' },
        { name: 'Staff Leaves', path: '/leaves', icon: 'date_range' },
        { name: 'Staff Payments', path: '/payouts', icon: 'payments' },
        { name: 'Delivery Payments', path: '/delivery-payouts', icon: 'local_shipping' },
        { name: 'Attendance', path: '/admin-attendance', icon: 'rule' },
        { name: 'Services', path: '/services', icon: 'content_cut' },
        { name: 'Products', path: '/products', icon: 'shopping_bag' },
        { name: 'Product Orders', path: '/orders', icon: 'receipt_long' },
        { name: 'Billing & Invoices', path: '/billing', icon: 'receipt' },
        { name: 'Revenue Reports', path: '/reports', icon: 'payments' },
        { name: 'Coupons', path: '/coupons', icon: 'local_activity' },
        { name: 'Memberships', path: '/memberships', icon: 'workspace_premium' },
        { name: 'Loyalty Settings', path: '/loyalty', icon: 'stars' },
        { name: 'Cancellations', path: '/cancellations', icon: 'cancel' },
        { name: 'Refunds', path: '/refunds', icon: 'currency_rupee' },
        { name: 'Settings', path: '/settings', icon: 'settings' }
      ];

  return (
    <div className="min-h-screen bg-background text-on-background pb-24 lg:pb-0 lg:pl-[280px]">
      {/* Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex flex-col h-full w-[280px] fixed left-0 top-0 bg-surface-container border-r border-white/10 shadow-xl py-8 z-50">
        <div className="px-6 mb-10">
          <Link to={isStaff ? "/staff-dashboard" : "/dashboard"} className="text-headline-md font-headline-md font-bold text-primary tracking-widest block hover:opacity-80">
            LUXE GROOM
          </Link>
          <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold block mt-1">{isStaff ? "Staff Portal" : "Admin Portal"}</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-6 py-4 flex items-center gap-3 transition-all ${
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
        <div className="px-6 mt-auto border-t border-white/10 pt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0">
              <img className="w-full h-full object-cover" src={user?.profilePic || user?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw'} alt={user?.name} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-on-surface truncate max-w-[110px]">{user?.name}</p>
              <p className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate max-w-[110px]">{isStaff ? (user?.role || 'Staff') : (user?.title || 'Admin')}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center cursor-pointer flex-shrink-0"
            title="Log Out"
          >
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      </aside>

      {/* Top App Bar */}
      <header className="fixed top-0 w-full lg:w-[calc(100%-280px)] lg:left-[280px] z-40 bg-surface/80 backdrop-blur-xl border-b border-white/10 h-20 flex justify-between items-center px-margin-mobile md:px-margin-desktop shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden text-primary cursor-pointer active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-headline-md font-headline-md font-bold tracking-tight text-primary">{isStaff ? "Staff Panel" : "Admin Panel"}</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Notifications Link bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
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
            
            {showNotifDropdown && (
              <div className="absolute top-12 right-0 w-80 bg-surface-container-high border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-4 border-b border-white/5 bg-surface-container-highest flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-on-surface-variant hover:text-white cursor-pointer flex items-center justify-center p-1 rounded-lg hover:bg-white/5 transition-colors"
                      title="Back"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    </button>
                    <h3 className="text-sm font-headline text-on-surface">Notifications</h3>
                  </div>
                  {unreadCount > 0 && <span className="text-[10px] text-primary font-bold">{unreadCount} New</span>}
                </div>
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {notifications.filter(n => isMyNotification(n)).length === 0 ? (
                    <div className="p-6 text-center text-xs text-on-surface-variant">No notifications yet.</div>
                  ) : (
                    notifications.filter(n => isMyNotification(n)).map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markNotificationAsRead(n.id);
                          if (n.deepLink) navigate(n.deepLink);
                          setShowNotifDropdown(false);
                        }}
                        className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-xs font-bold ${!n.read ? 'text-primary' : 'text-on-surface'}`}>{n.title}</h4>
                          <span className="text-[10px] text-on-surface-variant/70">{n.timestamp}</span>
                        </div>
                        {n.bookingDetails ? (
                          <div className="text-[11px] text-on-surface-variant space-y-0.5 mt-2 bg-black/20 p-2 rounded">
                            <p><span className="text-white/50">Customer:</span> <span className="text-on-surface">{n.bookingDetails.clientName || 'Unknown'}</span></p>
                            <p><span className="text-white/50">Service:</span> {n.bookingDetails.serviceName}</p>
                            <p><span className="text-white/50">Barber:</span> {n.bookingDetails.barberName}</p>
                            <p><span className="text-white/50">Time:</span> {n.bookingDetails.date} at {n.bookingDetails.time}</p>
                            <p><span className="text-white/50">Status:</span> <span className="text-primary">{n.bookingDetails.status || 'Pending'}</span></p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-1">{n.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 border-t border-white/5 bg-surface-container text-center">
                  <button 
                    onClick={() => { setShowNotifDropdown(false); navigate(isStaff ? '/staff-dashboard' : '/notifications'); }}
                    className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 overflow-hidden">
              <img className="w-full h-full object-cover" src={user?.profilePic || user?.image} alt={user?.name} />
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-full hover:bg-red-950/30 hover:text-red-400 border border-transparent hover:border-red-500/20 text-on-surface-variant transition-all cursor-pointer"
              title="Log Out"
            >
              <span className="material-symbols-outlined text-[20px] block">logout</span>
            </button>
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
                <span className="text-[10px] text-primary/70 uppercase tracking-widest font-semibold block mt-1">{isStaff ? "Staff Portal" : "Admin Portal"}</span>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="text-on-surface-variant hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
              {navItems.map(item => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  onClick={() => setShowMobileSidebar(false)}
                  className={({ isActive }) =>
                    `px-6 py-4 flex items-center gap-3 transition-all ${
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
            <div className="px-6 mt-auto border-t border-white/10 pt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 flex-shrink-0">
                  <img className="w-full h-full object-cover" src={user?.profilePic || user?.image} alt={user?.name} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate max-w-[110px]">{user?.name}</p>
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider truncate max-w-[110px]">{isStaff ? (user?.role || 'Staff') : (user?.title || 'Admin')}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMobileSidebar(false);
                  setShowLogoutModal(true);
                }}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                title="Log Out"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="w-full min-h-screen">
        {children}
      </div>

      {/* Bottom Navigation Bar (Mobile only) */}
      <footer className="lg:hidden fixed bottom-0 w-full z-40 bg-surface-container-high/90 backdrop-blur-lg border-t border-white/5 flex justify-around items-center px-4 py-3 rounded-t-xl shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        {isStaff ? (
          <>
            <NavLink to="/staff-dashboard" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-[10px] font-medium">Dashboard</span>
            </NavLink>
            <NavLink to="/staff-attendance" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">check_circle</span>
              <span className="text-[10px] font-medium">Attendance</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">dashboard</span>
              <span className="text-[10px] font-medium">Home</span>
            </NavLink>
            <NavLink to="/notifications" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">notifications</span>
              <span className="text-[10px] font-medium">Alerts</span>
            </NavLink>
            <NavLink to="/reports" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">payments</span>
              <span className="text-[10px] font-medium">Reports</span>
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => `flex flex-col items-center justify-center active:scale-90 duration-200 px-3 py-1 ${isActive ? 'text-primary font-bold bg-primary/10 rounded-xl' : 'text-on-secondary-fixed-variant'}`}>
              <span className="material-symbols-outlined">settings</span>
              <span className="text-[10px] font-medium">Settings</span>
            </NavLink>
          </>
        )}
      </footer>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="max-w-[400px] border border-white/10 bg-surface-container shadow-2xl rounded-xl p-6 sm:p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-headline-sm font-headline text-primary">
              <span className="material-symbols-outlined text-[24px]">logout</span>
              Logout Confirmation
            </DialogTitle>
            <DialogDescription className="text-on-surface-variant text-body-md font-body leading-relaxed">
              Are you sure you want to log out of the {isStaff ? 'Staff Portal' : 'Admin Panel'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={() => setShowLogoutModal(false)}
              className="px-4 py-2.5 rounded-lg border border-white/10 text-on-surface hover:bg-white/5 transition-colors font-semibold text-label-sm cursor-pointer w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowLogoutModal(false);
                handleLogout();
              }}
              className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors font-semibold text-label-sm cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLayout;
