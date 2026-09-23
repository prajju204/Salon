import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { LuxeNotification } from "@/shared/types/notification";

export const getNotificationIcon = (type: LuxeNotification['type']) => {
  switch (type) {
    case 'booking_confirmed':
      return { icon: 'check_circle', color: 'text-primary' }; // gold
    case 'booking_declined':
      return { icon: 'cancel', color: 'text-red-400' }; // red
    case 'reminder_24h':
      return { icon: 'schedule', color: 'text-blue-400' }; // blue
    case 'reminder_1h':
      return { icon: 'alarm', color: 'text-amber-500' }; // amber
    case 'promo':
      return { icon: 'local_offer', color: 'text-rose-400' }; // rose
    case 'review_request':
      return { icon: 'star', color: 'text-primary' }; // gold
    case 'waitlist_open':
      return { icon: 'auto_awesome', color: 'text-green-400' }; // emerald/success
    default:
      return { icon: 'notifications', color: 'text-on-surface-variant' };
  }
};

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    markAllNotificationsRead,
    clearAllNotifications,
    deleteNotification,
    markNotificationRead
  } = useApp();

  const navigate = useNavigate();

  // Tab State: 'all' | 'unread' | 'services' | 'products'
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'services' | 'products'>('all');

  const filteredNotifications = notifications.filter((n: LuxeNotification) => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'services') return !n.type.includes('order') && !n.type.includes('product') && n.type !== 'promo';
    if (filterTab === 'products') return n.type.includes('order') || n.type.includes('product') || n.type === 'promo';
    return true; // all
  });

  const handleNotificationTap = (n: LuxeNotification) => {
    markNotificationRead(n.id);
    if (n.deepLink) {
      navigate(n.deepLink);
    }
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Header */}
      <section className="mb-unit-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold font-mono">Alerts</p>
          <h2 className="font-headline text-3xl md:text-5xl text-on-surface">Notifications Center</h2>
          <p className="text-on-surface-variant font-body text-xs md:text-sm mt-1">
            Keep track of booking confirmations, reminders, and waitlist releases.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            disabled={notifications.length === 0}
            className="flex-grow md:flex-grow-0"
          >
            Mark All Read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="flex-grow md:flex-grow-0"
          >
            Clear All
          </Button>
        </div>
      </section>

      {/* Tabs / Filter Row */}
      <section className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-white/5 pb-6">
        <div className="bg-surface-container p-1 rounded-xl w-full sm:w-fit flex border border-white/5">
          <button
            onClick={() => setFilterTab('all')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'all'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'unread'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Unread ({notifications.filter((n: LuxeNotification) => !n.read).length})
          </button>
          <button
            onClick={() => setFilterTab('services')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'services'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Services ({notifications.filter((n: LuxeNotification) => !n.type.includes('order') && !n.type.includes('product') && n.type !== 'promo').length})
          </button>
          <button
            onClick={() => setFilterTab('products')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'products'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Products ({notifications.filter((n: LuxeNotification) => n.type.includes('order') || n.type.includes('product') || n.type === 'promo').length})
          </button>
        </div>
      </section>

      {/* List content */}
      <section className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto border border-white/5 mt-8">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">
              notifications_off
            </span>
            <h3 className="font-headline text-2xl text-on-surface mb-2">No Notifications</h3>
            <p className="text-on-surface-variant text-xs mb-4">
              Your inbox is clean! We will alert you when stylists release timeslots or booking updates occur.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n: LuxeNotification) => {
              const iconDetail = getNotificationIcon(n.type);
              
              return (
                <Card
                  key={n.id}
                  onClick={() => handleNotificationTap(n)}
                  className={`border transition-all duration-200 cursor-pointer hover:border-primary/25 ${
                    n.read ? 'border-white/5 bg-white/[0.01]' : 'border-primary/20 bg-primary/[0.02]'
                  }`}
                >
                  <CardContent className="p-5 flex items-center justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      {/* Icon container */}
                      <div className={`w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/5 flex-shrink-0`}>
                        <span className={`material-symbols-outlined ${iconDetail.color} text-[20px] font-bold`}>
                          {iconDetail.icon}
                        </span>
                      </div>
                      
                      {/* Content details */}
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className={`text-xs font-bold leading-tight ${n.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                          )}
                        </div>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                          {n.description}
                        </p>
                        <span className="text-[9px] text-on-surface-variant/60 block mt-2 font-mono uppercase">
                          {n.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="text-on-surface-variant/40 hover:text-red-400 transition-colors p-1 flex-shrink-0 cursor-pointer focus:outline-none"
                        title="Delete notification"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                      <span className="material-symbols-outlined text-on-surface-variant/40 text-[18px] flex-shrink-0">
                        chevron_right
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default NotificationsPage;
