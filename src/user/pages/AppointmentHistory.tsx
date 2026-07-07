import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/components/ui/dialog";
import { toast } from 'sonner';
import { Appointment, Barber } from "@/shared/types/booking";

const AppointmentHistory: React.FC = () => {
  const { user } = useAuth();
  const { appointments, barbers, cancelAppointment, addReview, waitlist, leaveWaitlist, simulateCompleteAppointment } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab State: 'upcoming' or 'past' or 'waitlist'
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'waitlist'>('upcoming');

  // Load initial tab from redirect state
  React.useEffect(() => {
    if (location.state?.initialTab) {
      setActiveTab(location.state.initialTab as any);
      // clear state
      navigate('/appointments', { state: {}, replace: true });
    }
  }, [location.state, navigate]);

  // Filters & Sorting State
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'DateDesc' | 'DateAsc' | 'PriceDesc'>('DateDesc');

  // Cancel Modal Dialog State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Review Modal Dialog State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBarberName, setSelectedBarberName] = useState<string>('');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Filter user's specific appointments
  const userAppointments = (appointments as Appointment[]).filter(
    (apt) => apt.clientEmail === user?.email
  );

  // Split into Upcoming vs Past
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingAppointments = userAppointments.filter((apt) => {
    try {
      const aptDate = new Date(apt.date);
      // Confirmed, In Progress, Rescheduled, Pending are upcoming
      return (
        (apt.status === 'Confirmed' || apt.status === 'In Progress' || apt.status === 'Rescheduled' || apt.status === 'Pending') &&
        aptDate >= now
      );
    } catch {
      return true;
    }
  });

  const pastAppointments = userAppointments.filter((apt) => {
    try {
      const aptDate = new Date(apt.date);
      // Completed, Cancelled, and Declined, or any appointment in the past
      return (
        apt.status === 'Completed' ||
        apt.status === 'Cancelled' ||
        apt.status === 'Declined' ||
        aptDate < now
      );
    } catch {
      return false;
    }
  });

  const activeAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

  // Filter & Sort Logic
  const filteredAppointments = activeAppointments.filter((apt) => {
    if (statusFilter === 'All') return true;
    return apt.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T00:00:00`).getTime();
    const dateB = new Date(`${b.date}T00:00:00`).getTime();
    
    if (sortBy === 'DateDesc') return dateB - dateA;
    if (sortBy === 'DateAsc') return dateA - dateB;
    if (sortBy === 'PriceDesc') return b.price - a.price;
    return 0;
  });

  // Action Handlers
  const handleCancelClick = (aptId: string) => {
    setAppointmentToCancel(aptId);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!appointmentToCancel) return;
    setIsCancelling(true);
    try {
      await cancelAppointment(appointmentToCancel);
      toast.success('Grooming session cancelled successfully.');
    } catch (err) {
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
      setCancelModalOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleRescheduleClick = (apt: Appointment) => {
    // Navigate to wizard in reschedule mode, passing appointment ID in state
    navigate('/book-appointment', {
      state: {
        rescheduleAppointmentId: apt.id || apt._id,
        serviceId: '',
        barberId: apt.barberId
      }
    });
  };

  const handleRebookClick = (apt: Appointment) => {
    // Find service and barber IDs
    const bbr = barbers.find((b: Barber) => b.name === apt.barberName);
    navigate('/book-appointment', {
      state: {
        serviceId: '', // wizard will search for name or we can let user pick
        barberId: bbr?.id || bbr?._id || ''
      }
    });
  };

  const handleLeaveReviewClick = (barberName: string) => {
    setSelectedBarberName(barberName);
    setReviewRating(5);
    setReviewText('');
    setReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedBarberName || !reviewText.trim()) {
      toast.error('Please fill in the review details.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addReview({
        clientName: user?.name || 'James Mercer',
        barberName: selectedBarberName,
        rating: reviewRating,
        text: reviewText,
        date: new Date().toISOString().split('T')[0]
      });
      toast.success(`Review for ${selectedBarberName} submitted successfully!`);
      setReviewModalOpen(false);
    } catch (err) {
      toast.error('Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Badge variants helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return <Badge variant="gold">Confirmed</Badge>;
      case 'Completed':
        return <Badge variant="success">Completed</Badge>;
      case 'Cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'Rescheduled':
        return <Badge variant="info">Rescheduled</Badge>;
      case 'In Progress':
        return <Badge variant="warning" className="animate-pulse">In Progress</Badge>;
      case 'Pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'Declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Header Info */}
      <section className="mb-unit-lg flex justify-between items-end flex-wrap gap-4">
        <div>
          <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold">Appointments</p>
          <h2 className="font-headline text-3xl md:text-5xl text-on-surface">Your Booking History</h2>
          <p className="text-on-surface-variant font-body text-xs md:text-sm mt-1 max-w-xl">
            Reschedule, cancel, or leave reviews for your luxury scheduling history.
          </p>
        </div>
      </section>

      {/* Tabs list with filter options */}
      <section className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-white/5 pb-6">
        <div className="bg-surface-container p-1 rounded-xl w-fit flex border border-white/5">
          <button
            onClick={() => {
              setActiveTab('upcoming');
              setStatusFilter('All');
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(242,202,80,0.05)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => {
              setActiveTab('past');
              setStatusFilter('All');
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'past'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(242,202,80,0.05)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Past History
          </button>
          <button
            onClick={() => {
              setActiveTab('waitlist');
              setStatusFilter('All');
            }}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'waitlist'
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(242,202,80,0.05)]'
                : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Waitlist ({waitlist.length})
          </button>
        </div>

        {/* Filter options */}
        <div className="flex gap-3 items-center w-full md:w-auto">
          {/* Status Filter */}
          <div className="relative flex-grow md:flex-grow-0 md:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs text-on-surface-variant hover:text-on-surface focus:outline-none focus:border-primary/50 font-bold uppercase tracking-wider cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {activeTab === 'upcoming' ? (
                <>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="In Progress">In Progress</option>
                </>
              ) : (
                <>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Sort Selector */}
          <div className="relative flex-grow md:flex-grow-0 md:w-44">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs text-on-surface-variant hover:text-on-surface focus:outline-none focus:border-primary/50 font-bold uppercase tracking-wider cursor-pointer"
            >
              <option value="DateDesc">Newest First</option>
              <option value="DateAsc">Oldest First</option>
              <option value="PriceDesc">Highest Price</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </section>

      {/* Grid of Appointment Cards */}
      {activeTab === 'waitlist' ? (
        waitlist.length === 0 ? (
          <section className="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto my-12 border border-white/5">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4 animate-pulse">
              hourglass_empty
            </span>
            <h3 className="font-headline text-2xl text-on-surface mb-2">Waitlist Empty</h3>
            <p className="text-on-surface-variant text-xs mb-6">
              You are not currently waiting for any appointments. Join waitlists directly on fully booked time slots.
            </p>
            <Button
              onClick={() => navigate('/services')}
              className="flex items-center gap-2 mx-auto"
            >
              Browse Services <span className="material-symbols-outlined">explore</span>
            </Button>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {waitlist.map((w: any) => (
              <Card key={w.id} className="group border border-white/5 hover:border-primary/20 transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors duration-200">
                        {w.serviceName}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold mt-0.5 tracking-wider">
                        Stylist: <span className="text-primary">{w.stylistName}</span>
                      </p>
                    </div>
                    <Badge variant={w.position === 0 ? 'success' : 'warning'}>
                      {w.position === 0 ? 'Slot Available!' : `Queue Position #${w.position}`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-white/5">
                    <div className="flex items-center gap-1.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                      <span className="font-semibold">
                        {new Date(w.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant justify-end">
                      <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                      <span className="font-semibold">{w.timeWindowPreference} Preference</span>
                    </div>
                  </div>

                  {w.position === 0 && (
                    <div className="p-2.5 bg-green-500/5 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                      A slot opened! Tap "Book Now" below to complete your scheduling immediately.
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-left">
                      <span className="text-[9px] uppercase tracking-wider text-on-surface-variant block font-semibold">
                        Alert Preferences
                      </span>
                      <span className="text-[10px] font-bold text-on-surface">
                        {w.notificationPreferences.inApp ? 'In-App' : ''}
                        {w.notificationPreferences.email ? ', Email' : ''}
                        {w.notificationPreferences.sms ? ', SMS' : ''}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {w.position === 0 && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/book-appointment?prefillWaitlist=${w.id}`)}
                          className="flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          Book Now
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => leaveWaitlist(w.id)}
                        className="flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[14px]">logout</span>
                        Leave
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        )
      ) : sortedAppointments.length === 0 ? (
        <section className="glass-panel rounded-2xl p-12 text-center max-w-md mx-auto my-12 border border-white/5">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">
            calendar_today
          </span>
          <h3 className="font-headline text-2xl text-on-surface mb-2">No Appointments</h3>
          <p className="text-on-surface-variant text-xs mb-6">
            You don't have any appointments listed under this filter. Schedule a new luxury grooming today.
          </p>
          <Button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 mx-auto"
          >
            Browse Catalog <span className="material-symbols-outlined">explore</span>
          </Button>
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {sortedAppointments.map((apt) => (
            <Card key={apt.id || apt._id} className="group border border-white/5 hover:border-primary/20 transition-all duration-300">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-headline font-bold text-lg text-on-surface group-hover:text-primary transition-colors duration-200">
                      {apt.serviceName}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold mt-0.5 tracking-wider">
                      Stylist: <span className="text-primary">{apt.barberName}</span>
                    </p>
                  </div>
                  {getStatusBadge(apt.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-white/5">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                    <span className="font-semibold">
                      {new Date(`${apt.date}T00:00:00`).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant justify-end">
                    <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
                    <span className="font-semibold">{apt.time}</span>
                  </div>
                </div>

                {apt.notes && (
                  <div className="bg-white/[0.01] p-3 rounded-lg border border-white/5 text-[11px] text-on-surface-variant italic">
                    " {apt.notes} "
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="text-left">
                    <span className="text-[9px] uppercase tracking-wider text-on-surface-variant block font-semibold">
                      Amount Paid
                    </span>
                    <span className="text-base font-headline font-bold text-primary">
                      {formatCurrency(apt.price)}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {/* Upcoming Actions */}
                    {activeTab === 'upcoming' && apt.status !== 'Cancelled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRescheduleClick(apt)}
                          className="flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                          Reschedule
                        </Button>
                        {apt.status === 'Confirmed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => simulateCompleteAppointment(apt.id || apt._id || '')}
                            className="flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">done_all</span>
                            Simulate Done
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelClick(apt.id || apt._id || '')}
                          className="flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          Cancel
                        </Button>
                      </>
                    )}

                    {/* Past Actions */}
                    {activeTab === 'past' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRebookClick(apt)}
                          className="flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[14px]">autorenew</span>
                          Rebook
                        </Button>
                        {apt.status === 'Completed' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleLeaveReviewClick(apt.barberName)}
                            className="flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">star</span>
                            Rate Stylist
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* CONFIRM CANCELLATION DIALOG MODAL */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this grooming session? This action will cancel your reservation with the stylist. We hope to see you again soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelling}
              className="flex items-center gap-2"
            >
              {isCancelling ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
                  Cancelling...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Yes, Cancel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LEAVE REVIEW DIALOG MODAL */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              Share your feedback for <span className="text-primary font-bold">{selectedBarberName}</span>. Your ratings help maintain our premium grooming standards.
            </DialogDescription>
          </DialogHeader>

          {/* Rating stars */}
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className="text-primary hover:scale-110 transition-transform cursor-pointer focus:outline-none"
              >
                <span className={`material-symbols-outlined text-3xl ${reviewRating >= star ? 'fill-current' : ''}`}>
                  star
                </span>
              </button>
            ))}
          </div>

          {/* Text Feedback */}
          <div className="space-y-2">
            <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
              Review Details
            </label>
            <textarea
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe your grooming experience..."
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
              required
            />
          </div>

          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReviewSubmit}
              disabled={isSubmittingReview || !reviewText.trim()}
              className="flex items-center gap-2"
            >
              {isSubmittingReview ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-[16px]">progress_activity</span>
                  Submitting...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">rate_review</span>
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default AppointmentHistory;
