import React, { useState } from 'react';
import { useApp } from "@/shared/context/AppContext";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { formatCurrency } from "@/shared/utils/format";
import { toast } from 'sonner';
import { LuxeNotification } from "@/shared/types/notification";

const AdminNotificationsPage: React.FC = () => {
  const {
    notifications,
    confirmBooking,
    declineBooking,
    markNotificationRead,
    clearAllNotifications,
    markAllNotificationsRead
  } = useApp();

  // Tab: 'all' | 'unread' | 'requests'
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'requests'>('all');

  // Dialog State: View Details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<LuxeNotification | null>(null);

  // Dialog State: Decline reason
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState<string>('');
  const [declineReason, setDeclineReason] = useState<string>('');

  const adminNotifications = notifications.filter((n: LuxeNotification) => n.recipient === 'admin');

  const filteredNotifications = adminNotifications.filter((n: LuxeNotification) => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'requests') return n.type === 'booking_request';
    return true; // all
  });

  const handleCardClick = (n: LuxeNotification) => {
    markNotificationRead(n.id);
    if (n.type === 'booking_request') {
      setSelectedNotif(n);
      setDetailsOpen(true);
    }
  };

  const handleConfirmClick = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    confirmBooking(bookingId);
    setDetailsOpen(false);
  };

  const handleDeclineClick = (e: React.MouseEvent, bookingId: string) => {
    e.stopPropagation();
    setDeclineBookingId(bookingId);
    setDeclineReason('');
    setDeclineOpen(true);
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    declineBooking(declineBookingId, declineReason);
    setDeclineOpen(false);
    setDetailsOpen(false);
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Header */}
      <section className="mb-unit-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold font-mono">Salon Operations</p>
          <h2 className="font-headline text-3xl md:text-5xl text-on-surface">Admin Notifications</h2>
          <p className="text-on-surface-variant font-body text-xs md:text-sm mt-1">
            Review live client bookings, manage reservations, and track stylist queues.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
            disabled={adminNotifications.length === 0}
            className="flex-grow md:flex-grow-0"
          >
            Mark All Read
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearAllNotifications}
            disabled={adminNotifications.length === 0}
            className="flex-grow md:flex-grow-0"
          >
            Clear All
          </Button>
        </div>
      </section>

      {/* Tabs Filter */}
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
            All ({adminNotifications.length})
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'unread'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Unread ({adminNotifications.filter(n => !n.read).length})
          </button>
          <button
            onClick={() => setFilterTab('requests')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              filterTab === 'requests'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Booking Requests ({adminNotifications.filter(n => n.type === 'booking_request').length})
          </button>
        </div>
      </section>

      {/* List */}
      <section className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="glass-panel rounded-2xl p-16 text-center max-w-md mx-auto border border-white/5 mt-8">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3">
              notifications_none
            </span>
            <h3 className="font-headline text-2xl text-on-surface mb-2">No Alerts</h3>
            <p className="text-on-surface-variant text-xs">
              There are no admin notifications in this category. You are fully up to date!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n: LuxeNotification) => {
              const isBookingRequest = n.type === 'booking_request';
              const isActioned = n.status === 'actioned';
              const payload = n.bookingPayload;

              return (
                <Card
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  className={`border transition-all duration-200 cursor-pointer hover:border-primary/20 ${
                    n.read ? 'border-white/5 bg-white/[0.01]' : 'border-primary/25 bg-primary/[0.01]'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center border border-white/5 flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-[20px] font-bold">
                          calendar_add_on
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-xs font-bold leading-tight ${n.read ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                            {n.title}
                          </h4>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                          )}
                          {isBookingRequest && (
                            <Badge variant={isActioned ? 'secondary' : 'warning'} className="text-[8px] py-0 px-2 uppercase tracking-wide">
                              {isActioned ? 'Processed' : 'Action Required'}
                            </Badge>
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

                    {/* Action buttons (only for pending requests) */}
                    {isBookingRequest && !isActioned && payload && (
                      <div className="flex items-center gap-2 self-end md:self-auto z-10">
                        <Button
                          size="sm"
                          onClick={(e) => handleConfirmClick(e, payload.bookingId)}
                          className="h-8 px-3.5 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleDeclineClick(e, payload.bookingId)}
                          className="h-8 px-3.5 text-[10px] font-bold uppercase tracking-wider"
                        >
                          Decline
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* --- BOOKING DETAIL DIALOG MODAL --- */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        {selectedNotif && selectedNotif.bookingPayload && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_add_on</span>
                Booking Request Details
              </DialogTitle>
              <DialogDescription>
                Review and action the scheduling request sent by customer {selectedNotif.bookingPayload.userName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 text-xs divide-y divide-white/5">
              {/* Client Profile Summary */}
              <div className="flex items-center gap-3 pb-3">
                <img
                  src={selectedNotif.bookingPayload.userAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'}
                  alt={selectedNotif.bookingPayload.userName}
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">{selectedNotif.bookingPayload.userName}</h4>
                  <span className="text-[10px] text-on-surface-variant block mt-0.5">Customer Client</span>
                </div>
              </div>

              {/* Service details */}
              <div className="py-3 space-y-2">
                <div className="flex justify-between font-bold text-sm">
                  <span>{selectedNotif.bookingPayload.serviceName}</span>
                  <span className="text-primary">{formatCurrency(selectedNotif.bookingPayload.price)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant text-[11px] font-semibold">
                  <span>Date: {new Date(selectedNotif.bookingPayload.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span>Time Slot: {selectedNotif.bookingPayload.time}</span>
                </div>
                <div className="text-on-surface-variant text-[11px]">
                  Assigned Barber Specialist: <strong className="text-white">{selectedNotif.bookingPayload.stylistName}</strong>
                </div>
              </div>

              {/* Notes */}
              {selectedNotif.bookingPayload.notes && (
                <div className="py-3">
                  <span className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">Customer notes</span>
                  <p className="text-[11px] italic bg-white/[0.01] border border-white/5 rounded-lg p-2.5 text-on-surface-variant leading-relaxed">
                    "{selectedNotif.bookingPayload.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Actions Footer inside dialog */}
            <DialogFooter className="pt-4 border-t border-white/5 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                Close Window
              </Button>
              {selectedNotif.status !== 'actioned' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={(e) => handleDeclineClick(e, selectedNotif.bookingPayload!.bookingId)}
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={(e) => handleConfirmClick(e, selectedNotif.bookingPayload!.bookingId)}
                  >
                    Confirm Booking
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* --- DECLINE WITH REASON DIALOG MODAL --- */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Decline Booking Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to decline this reservation? Provide a brief explanation for the customer client.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeclineSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold">
                Decline Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="E.G. Stylist specialist is currently unavailable due to scheduling conflicts."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
              />
            </div>

            <DialogFooter className="pt-2 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setDeclineOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" type="submit">
                Decline Booking
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AdminNotificationsPage;
