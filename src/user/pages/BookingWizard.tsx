import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Calendar } from "@/shared/components/ui/calendar";
import { Service, Barber } from "@/shared/types/booking";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";

const BookingWizard: React.FC = () => {
  const { user } = useAuth();
  const { services, barbers, addAppointment, rescheduleAppointment, appointments, joinWaitlist, waitlist } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  // Route state parameters
  const preSelectedServiceId = location.state?.serviceId;
  const preSelectedBarberId = location.state?.barberId;
  const rescheduleAppointmentId = location.state?.rescheduleAppointmentId;

  // Wizard Steps: 1 - Service, 2 - Barber, 3 - Date/Time, 4 - Confirm, 5 - Success
  const [step, setStep] = useState(1);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return sessionStorage.getItem('luxe_wizard_category') || null;
  });
  
  useEffect(() => {
    if (selectedCategory) {
      sessionStorage.setItem('luxe_wizard_category', selectedCategory);
    } else {
      sessionStorage.removeItem('luxe_wizard_category');
    }
  }, [selectedCategory]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [isAnyBarber, setIsAnyBarber] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [bookingId, setBookingId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coupon & Loyalty state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);       // available balance
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyRedemption, setLoyaltyRedemption] = useState<any>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);

  // Waitlist dialog state
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistPeriod, setWaitlistPeriod] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night' | 'Any'>('Any');
  const [waitlistSlot, setWaitlistSlot] = useState('');
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifySMS, setNotifySMS] = useState(false);

  // Custom time state
  const [customTime, setCustomTime] = useState('');
  const [customTimeError, setCustomTimeError] = useState('');

  // Razorpay states
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [razorpayStep, setRazorpayStep] = useState<'methods' | 'details' | 'processing' | 'success'>('methods');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // ─── Coupon helpers ───────────────────────────────────────────────────────
  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLoyaltyBalance = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/loyalty', { headers: getAuthHeader() });
      if (res.data.success) setLoyaltyPoints(res.data.data?.points || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (step === 4) fetchLoyaltyBalance(); }, [step, fetchLoyaltyBalance]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedService) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/coupons/validate', {
        code: couponCode.trim(),
        bookingAmount: selectedService.price,
        serviceId: selectedService.id || selectedService._id
      }, { headers: getAuthHeader() });
      if (res.data.success) {
        setAppliedCoupon(res.data.data);
        setLoyaltyRedemption(null); // Can't combine with points
        setPointsToRedeem(0);
      } else {
        setCouponError(res.data.message || 'Invalid coupon');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); };

  const handleRedeemPoints = async () => {
    if (pointsToRedeem <= 0 || !selectedService) return;
    setLoyaltyLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/loyalty/redeem', {
        points: pointsToRedeem,
        bookingAmount: selectedService.price
      }, { headers: getAuthHeader() });
      if (res.data.success) {
        setLoyaltyRedemption(res.data.data);
        setAppliedCoupon(null); // Can't combine
        setCouponCode('');
        setCouponError('');
      }
    } catch (err: any) {
      console.error('Loyalty redemption error:', err.message);
    } finally {
      setLoyaltyLoading(false);
    }
  };

  const handleRemovePoints = () => { setLoyaltyRedemption(null); setPointsToRedeem(0); };

  // Computed final amount
  const basePrice = selectedService?.price || 0;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const loyaltyDiscount = loyaltyRedemption?.discountAmount || 0;
  const finalAmount = Math.max(0, basePrice - couponDiscount - loyaltyDiscount);

  // ─── Waitlist ──────────────────────────────────────────────────────────────
  const handleJoinWaitlistClick = (slot: string, period: string) => {
    setWaitlistSlot(slot);
    const mappedPeriod = period === 'Morning' || period === 'Afternoon' || period === 'Evening' || period === 'Night' ? period : 'Any';
    setWaitlistPeriod(mappedPeriod);
    setNotifyInApp(true);
    setNotifyEmail(false);
    setNotifySMS(false);
    setWaitlistOpen(true);
  };

  const handleApplyCustomTime = () => {
    const trimmed = customTime.trim();
    if (!trimmed) return;
    
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM|am|pm)$/i;
    if (!timeRegex.test(trimmed)) {
      setCustomTimeError('Format: HH:MM AM/PM (e.g. 08:30 AM)');
      return;
    }

    const match = trimmed.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM|am|pm)$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();

      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const totalMinutes = hours * 60 + minutes;
      const startMinutes = 8 * 60; // 08:00 AM
      const endMinutes = 22 * 60; // 10:00 PM

      if (totalMinutes < startMinutes || totalMinutes > endMinutes) {
        setCustomTimeError('Salon hours: 08:00 AM to 10:00 PM');
        return;
      }
      
      const hh = match[1].padStart(2, '0');
      const mm = match[2];
      const formatted = `${hh}:${mm} ${ampm}`;
      
      setSelectedTimeSlot(formatted);
      setCustomTimeError('');
      setCustomTime('');
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate) return;

    joinWaitlist({
      serviceName: selectedService.name,
      stylistId: selectedBarber?.id || selectedBarber?._id || 'any',
      stylistName: selectedBarber?.name || 'Any Available Stylist',
      date: selectedDate.toISOString().split('T')[0],
      timeWindowPreference: waitlistPeriod,
      notificationPreferences: {
        inApp: notifyInApp,
        email: notifyEmail,
        sms: notifySMS
      }
    });

    setWaitlistOpen(false);
    navigate('/appointments', { state: { initialTab: 'waitlist' } });
  };

  // Time slots grouping
  const timeSlots = {
    Morning: ['08:00 AM', '09:15 AM', '10:30 AM', '11:45 AM'],
    Afternoon: ['01:00 PM', '02:15 PM', '03:00 PM', '03:30 PM'],
    Evening: ['04:45 PM', '06:00 PM', '07:00 PM', '07:15 PM'],
    Night: ['08:30 PM', '09:45 PM']
  };

  const waitlistSlots = ['11:45 AM', '03:30 PM', '07:15 PM', '09:45 PM'];

  const isPeriodBusy = (period: 'Morning' | 'Afternoon' | 'Evening' | 'Night'): boolean => {
    const regularSlots = timeSlots[period].filter(s => !waitlistSlots.includes(s));
    return regularSlots.every(s => bookedSlots.includes(s));
  };

  // Prefill hook
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Check if we have rebookService query parameter
    const rebookService = searchParams.get('rebookService') || location.state?.rebookService;
    const rebookBarber = searchParams.get('rebookBarber') || location.state?.rebookBarber;
    if (rebookService && services.length > 0) {
      const svc = services.find((s: Service) => s.name === rebookService);
      if (svc) setSelectedService(svc);
      
      if (rebookBarber && barbers.length > 0) {
        const bbr = barbers.find((b: Barber) => b.name === rebookBarber);
        if (bbr) {
          setSelectedBarber(bbr);
          setIsAnyBarber(false);
        }
      }
      setStep(3); // Jump to date/time selection
      return;
    }

    // Check if we have prefillWaitlist query parameter
    const waitlistId = searchParams.get('prefillWaitlist');
    if (waitlistId && waitlist.length > 0 && services.length > 0 && barbers.length > 0) {
      const entry = waitlist.find((w: any) => w.id === waitlistId);
      if (entry) {
        const svc = services.find((s: Service) => s.name === entry.serviceName);
        const bbr = barbers.find((b: Barber) => b.id === entry.stylistId || b._id === entry.stylistId);
        if (svc) setSelectedService(svc);
        if (bbr) {
          setSelectedBarber(bbr);
          setIsAnyBarber(false);
        } else {
          setIsAnyBarber(true);
        }
        setSelectedDate(new Date(entry.date));
        
        let slotsInPeriod: string[] = [];
        if (entry.timeWindowPreference === 'Morning') slotsInPeriod = timeSlots.Morning;
        else if (entry.timeWindowPreference === 'Afternoon') slotsInPeriod = timeSlots.Afternoon;
        else if (entry.timeWindowPreference === 'Evening') slotsInPeriod = timeSlots.Evening;
        else if (entry.timeWindowPreference === 'Night') slotsInPeriod = timeSlots.Night;
        else slotsInPeriod = [...timeSlots.Morning, ...timeSlots.Afternoon, ...timeSlots.Evening, ...timeSlots.Night];
        
        // Find first slot that is not booked
        const booked = getBookedSlots();
        const availableSlot = slotsInPeriod.find(s => !booked.includes(s)) || slotsInPeriod[0];
        
        setSelectedTimeSlot(availableSlot);
        setStep(4);
        return;
      }
    }

    // Check if we are in rescheduling mode
    if (rescheduleAppointmentId) {
      setIsRescheduling(true);
      const existing = appointments.find((a: any) => a.id === rescheduleAppointmentId || a._id === rescheduleAppointmentId);
      if (existing) {
        // Find corresponding service & barber
        const svc = services.find((s: Service) => s.name === existing.serviceName);
        const bbr = barbers.find((b: Barber) => b.id === existing.barberId || b._id === existing.barberId);
        
        if (svc) setSelectedService(svc);
        if (bbr) setSelectedBarber(bbr);
        setNotes(existing.notes || '');
        
        // Go straight to Date & Time selection (Step 3)
        setStep(3);
        return;
      }
    }

    // Standard pre-selects from navigation state
    if (preSelectedServiceId) {
      const found = services.find((s: Service) => s.id === preSelectedServiceId || s._id === preSelectedServiceId);
      if (found) {
        setSelectedService(found);
        setSelectedCategory(found.category);
      }
    }
    if (preSelectedBarberId) {
      const found = barbers.find((b: Barber) => b.id === preSelectedBarberId || b._id === preSelectedBarberId);
      if (found) setSelectedBarber(found);
    }
  }, [preSelectedServiceId, preSelectedBarberId, rescheduleAppointmentId, services, barbers, appointments, waitlist, location.search]);

  // Real-time slot availability simulation
  const getBookedSlots = (): string[] => {
    if (!selectedDate || (!selectedBarber && !isAnyBarber)) return [];
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    const barberIdStr = isAnyBarber ? 'any' : (selectedBarber?.id || selectedBarber?._id || 'none');
    
    // Deterministic hash based on date and barber to simulate booked slots
    const hash = dateStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + 
                 barberIdStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    
    const allSlots = [...timeSlots.Morning, ...timeSlots.Afternoon, ...timeSlots.Evening, ...timeSlots.Night];
    const booked: string[] = [];
    
    const idx1 = hash % allSlots.length;
    const idx2 = (hash * 7) % allSlots.length;
    
    booked.push(allSlots[idx1]);
    if (idx1 !== idx2) booked.push(allSlots[idx2]);
    
    return booked;
  };

  const bookedSlots = getBookedSlots();

  // Wizard navigation handlers
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Form final submission
  const handleConfirmBooking = () => {
    if (!selectedService || (!selectedBarber && !isAnyBarber) || !selectedDate || !selectedTimeSlot) return;
    setRazorpayOpen(true);
    setRazorpayStep('methods');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
  };

  const executeBookingSubmission = async () => {
    setIsSubmitting(true);
    const dateStr = selectedDate!.toISOString().split('T')[0];
    
    // Determine barber to assign if "Any Available" is selected
    let barberToBook = selectedBarber;
    if (isAnyBarber) {
      // Pick first barber or a random one
      barberToBook = barbers[0] || null;
    }

    if (!barberToBook) {
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        serviceName: selectedService!.name,
        price: selectedService!.price,
        date: dateStr,
        time: selectedTimeSlot,
        barberId: barberToBook.id || barberToBook._id || '',
        barberName: barberToBook.name,
        notes: notes,
        // Module 15 fields
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        loyaltyPointsRedeemed: loyaltyRedemption?.pointsToRedeem || 0,
        loyaltyDiscountAmount: loyaltyDiscount,
        finalAmount,
        // Payment fields
        paymentStatus: 'Paid',
        paymentMethod: 'Razorpay'
      };

      let response;
      if (isRescheduling && rescheduleAppointmentId) {
        response = await rescheduleAppointment(rescheduleAppointmentId, payload);
      } else {
        response = await addAppointment(payload);
      }

      // Generate a nice random Booking ID
      const generatedId = `LG-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingId(generatedId);

      // Trigger Confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f2ca50', '#d4af37', '#ffffff', '#000000']
      });

      // Jump to Success Step
      setStep(5);
    } catch (err) {
      console.error('Booking failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Motion variants for slide/fade transitions between wizard steps
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const [[stepDir, direction], setStepDir] = useState([1, 1]); // [step, direction]

  const changeStep = (newStep: number) => {
    const dir = newStep > step ? 1 : -1;
    setStepDir([newStep, dir]);
    setStep(newStep);
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto font-body min-h-screen">
      {/* Wizard Header */}
      <div className="mb-8 text-center">
        <h2 className="font-headline text-3xl md:text-4xl text-on-surface mb-2">
          {isRescheduling ? 'Reschedule Appointment' : 'Book an Appointment'}
        </h2>
        <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-widest">
          {isRescheduling ? 'Update your grooming schedule' : 'Luxe Groom Scheduling Experience'}
        </p>
      </div>

      {/* Progress / Stepper Indicator */}
      {step < 5 && (
        <div className="flex items-center justify-between max-w-lg mx-auto mb-10 relative px-4">
          <div className="absolute top-1/2 left-4 right-4 h-[1px] bg-white/10 -z-10"></div>
          <div
            className="absolute top-1/2 left-4 h-[2px] step-line -z-10 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 90}%` }}
          ></div>

          {[
            { label: 'Service', num: 1 },
            { label: 'Stylist', num: 2 },
            { label: 'Date/Time', num: 3 },
            { label: 'Confirm', num: 4 }
          ].map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <button
                key={s.num}
                onClick={() => {
                  // Rescheduling lock: cannot change service/barber easily if restricted, but let's allow moving back
                  if (s.num < step) changeStep(s.num);
                }}
                disabled={s.num >= step}
                className="flex flex-col items-center gap-1.5 focus:outline-none disabled:pointer-events-none cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                    isCompleted
                      ? 'bg-primary border-primary text-on-primary shadow-[0_0_15px_rgba(242,202,80,0.3)]'
                      : isActive
                      ? 'bg-surface-container border-primary text-primary font-extrabold shadow-[0_0_15px_rgba(242,202,80,0.2)]'
                      : 'bg-surface-container border-white/10 text-on-surface-variant'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-[9px] uppercase tracking-wider font-bold ${
                    isActive || isCompleted ? 'text-primary' : 'text-on-surface-variant/60'
                  }`}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Slide Transition Wrapper */}
      <div className="relative overflow-hidden w-full min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {/* STEP 1: SERVICE SELECTION */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-headline text-on-surface text-center mb-4">Choose a Service</h3>
                
                {/* Selected Service Summary Card */}
                {selectedService ? (
                  <Card className="border border-primary/30 bg-primary/5 p-4 flex gap-4 items-center">
                    <img
                      src={selectedService.image}
                      alt={selectedService.name}
                      className="w-16 h-16 object-cover rounded-lg border border-primary/20"
                    />
                    <div className="flex-grow">
                      <Badge variant="gold" className="mb-1">{selectedService.category}</Badge>
                      <h4 className="font-headline font-bold text-on-surface text-base">{selectedService.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">schedule</span> {selectedService.duration} min
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-headline font-bold text-primary block">
                        {formatCurrency(selectedService.price)}
                      </span>
                    </div>
                  </Card>
                ) : (
                  <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                    <p className="text-xs text-on-surface-variant">No service selected. Click below to pick from catalog.</p>
                  </div>
                )}

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {!selectedCategory ? (
                    <>
                      {Array.from(new Set((services as Service[]).filter(s => s.status !== 'Inactive').map(s => s.category))).map(cat => (
                        <div
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className="p-4 rounded-xl border border-white/5 bg-surface-container cursor-pointer transition-all duration-200 hover:border-primary/40 hover:-translate-y-1 group flex items-center justify-between"
                        >
                          <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{cat}</h4>
                          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                        </div>
                      ))}
                      {(services as Service[]).filter(s => s.status !== 'Inactive').length === 0 && (
                        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                          <p className="text-xs text-on-surface-variant">No services currently available.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => setSelectedCategory(null)} 
                        className="text-[10px] text-primary uppercase font-bold tracking-widest flex items-center gap-1 mb-2 hover:opacity-80 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span> Back to Categories
                      </button>
                      {(services as Service[]).filter(svc => svc.status !== 'Inactive' && svc.category === selectedCategory).map((svc: Service) => {
                        const isSel = selectedService?.id === svc.id || selectedService?._id === svc._id;
                        return (
                          <div
                            key={svc.id || svc._id}
                            onClick={() => setSelectedService(svc)}
                            className={`p-3.5 rounded-xl border flex justify-between items-center cursor-pointer transition-all duration-200 hover:border-primary/40 ${
                              isSel ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface-container'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary text-[20px]">
                                {svc.icon || 'content_cut'}
                              </span>
                              <div>
                                <h5 className="font-semibold text-xs text-on-surface">{svc.name}</h5>
                                <span className="text-[10px] text-on-surface-variant-high text-primary/70">{svc.duration} min</span>
                              </div>
                            </div>
                            <span className="font-headline font-bold text-primary text-xs">{formatCurrency(svc.price)}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5">
                  <Button
                    onClick={nextStep}
                    disabled={!selectedService}
                    className="flex items-center gap-2"
                  >
                    Select Stylist <span className="material-symbols-outlined">arrow_forward</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: STYLIST SELECTION */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-headline text-on-surface text-center mb-4">Select Your Groomer</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Any Available Option */}
                  <div
                    onClick={() => {
                      setSelectedBarber(null);
                      setIsAnyBarber(true);
                    }}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:border-primary/45 ${
                      isAnyBarber ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <span className="material-symbols-outlined text-primary text-2xl">group</span>
                      </div>
                      <div>
                        <h4 className="font-headline text-sm text-on-surface font-bold group-hover:text-primary transition-colors">Any Available Stylist</h4>
                        <p className="text-[10px] text-on-surface-variant">Instant availability, matched automatically.</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isAnyBarber ? 'border-primary bg-primary' : 'border-white/20'
                      }`}>
                        {isAnyBarber && <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>}
                      </div>
                    </div>
                  </div>

                  {/* Individual Barbers */}
                  {barbers.map((bbr: Barber) => {
                    const isSel = !isAnyBarber && (selectedBarber?.id === bbr.id || selectedBarber?._id === bbr._id);
                    return (
                      <div
                        key={bbr.id || bbr._id}
                        onClick={() => {
                          setSelectedBarber(bbr);
                          setIsAnyBarber(false);
                        }}
                        className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:border-primary/45 ${
                          isSel ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface-container'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={bbr.image}
                            alt={bbr.name}
                            className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="min-w-0">
                            <h4 className="font-headline text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                              {bbr.name}
                            </h4>
                            <p className="text-[9px] text-on-surface-variant truncate">{bbr.role}</p>
                            
                            <div className="flex items-center text-primary mt-1 gap-1">
                              <span className="material-symbols-outlined text-[12px] fill-current">star</span>
                              <span className="text-[10px] font-bold">{bbr.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Specialty Tags */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {bbr.skills.slice(0, 2).map((skill: string, sIdx: number) => (
                            <Badge key={sIdx} variant="secondary" className="px-1.5 py-0 text-[8px]">
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSel ? 'border-primary bg-primary' : 'border-white/20'
                          }`}>
                            {isSel && <span className="material-symbols-outlined text-[10px] text-on-primary font-bold">check</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!selectedBarber && !isAnyBarber}
                    className="flex items-center gap-2"
                  >
                    Select Time <span className="material-symbols-outlined">arrow_forward</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: DATE & TIME PICKER */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-headline text-on-surface text-center mb-4">Choose Date & Time</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {/* Calendar Widget */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-on-surface-variant mb-2">Select Date</h4>
                    <Calendar
                      selected={selectedDate}
                      onSelect={(date: Date | undefined) => {
                        setSelectedDate(date);
                        setSelectedTimeSlot(''); // clear selected slot on date change
                      }}
                      disabledDates={(date: Date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const oneWeekLater = new Date(today);
                        oneWeekLater.setDate(today.getDate() + 7);
                        return date < today || date >= oneWeekLater;
                      }}
                    />
                  </div>

                  {/* Time Slots Widget */}
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Select Time</h4>
                    
                    {!selectedDate ? (
                      <div className="h-48 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-center p-4 bg-white/[0.01]">
                        <p className="text-xs text-on-surface-variant">
                          Please select a date on the calendar to view available time slots.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(timeSlots).map(([period, slots]) => {
                          const isBusy = isPeriodBusy(period as 'Morning' | 'Afternoon' | 'Evening' | 'Night');
                          const visibleSlots = slots.filter((slot) => {
                            if (waitlistSlots.includes(slot)) {
                              return isBusy;
                            }
                            return true;
                          });

                          if (visibleSlots.length === 0) return null;

                          return (
                            <div key={period} className="space-y-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70">
                                {period}
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                {visibleSlots.map((slot) => {
                                  const isFullyBooked = waitlistSlots.includes(slot);
                                  const isBooked = bookedSlots.includes(slot) && !isFullyBooked;
                                  const isSel = selectedTimeSlot === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={isBooked}
                                      onClick={() => {
                                        if (isFullyBooked) {
                                          handleJoinWaitlistClick(slot, period);
                                        } else {
                                          setSelectedTimeSlot(slot);
                                        }
                                      }}
                                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                                        isBooked
                                          ? 'border-transparent bg-white/5 text-on-surface-variant/20 line-through cursor-not-allowed'
                                          : isFullyBooked
                                          ? 'border-amber-500/30 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50'
                                          : isSel
                                          ? 'bg-primary border-primary text-on-primary shadow-[0_0_15px_rgba(242,202,80,0.25)] font-extrabold'
                                          : 'bg-surface-container border-white/5 text-on-surface hover:border-primary/40'
                                      }`}
                                    >
                                      <span>{slot}</span>
                                      {isFullyBooked && (
                                        <span className="material-symbols-outlined text-[10px] animate-pulse">hourglass_empty</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Custom Time Selector */}
                        <div className="pt-4 border-t border-white/10 space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70 block">
                            Suggest Custom Time
                          </span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. 08:30 AM or 09:15 PM"
                              value={customTime}
                              onChange={(e) => {
                                setCustomTime(e.target.value);
                                setCustomTimeError('');
                              }}
                              className="flex-grow bg-surface-container border border-white/5 rounded-lg px-2.5 py-1.5 text-[10px] text-on-surface focus:outline-none focus:border-primary/50 placeholder:text-on-surface-variant/30"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCustomTime}
                              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-lg text-[10px] font-bold hover:bg-primary/20 cursor-pointer transition-all"
                            >
                              Apply
                            </button>
                          </div>
                          {customTimeError && <p className="text-[9px] text-red-400 font-semibold">{customTimeError}</p>}
                          {selectedTimeSlot && 
                            ![...timeSlots.Morning, ...timeSlots.Afternoon, ...timeSlots.Evening, ...timeSlots.Night].includes(selectedTimeSlot) && (
                              <p className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                Custom slot set: {selectedTimeSlot}
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button variant="outline" onClick={prevStep} disabled={isRescheduling}>
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="flex items-center gap-2"
                  >
                    Review Booking <span className="material-symbols-outlined">arrow_forward</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && selectedService && (
              <div className="space-y-6">
                <h3 className="text-lg font-headline text-on-surface text-center mb-4">Confirm Your Details</h3>
                
                <Card className="border border-white/10 p-6 space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-white/5">
                    <div>
                      <h4 className="font-headline font-bold text-lg text-on-surface">{selectedService.name}</h4>
                      <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">schedule</span> {selectedService.duration} min
                      </p>
                    </div>
                    <span className="text-xl font-headline font-bold text-primary">
                      {formatCurrency(selectedService.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold block">
                        Assigned Stylist
                      </span>
                      <span className="text-on-surface font-semibold mt-0.5 block">
                        {isAnyBarber ? 'Any Available Stylist' : selectedBarber?.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold block">
                        Date & Time
                      </span>
                      <span className="text-on-surface font-semibold mt-0.5 block">
                        {selectedDate?.toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })} at {selectedTimeSlot}
                      </span>
                    </div>
                  </div>

                  {/* Notes Textarea */}
                  <div className="pt-2">
                    <label className="block text-on-surface-variant uppercase tracking-wider text-[9px] font-bold mb-1.5">
                      Grooming Notes / Requests
                    </label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any specific instructions (e.g. skin sensitivity, request cold towel shave prep, etc.)"
                      className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
                    />
                  </div>

                  {/* ── COUPON CODE ─────────────────────────────────────── */}
                  <div className="pt-3 border-t border-white/5">
                    <label className="block text-on-surface-variant uppercase tracking-wider text-[9px] font-bold mb-2">
                      Coupon Code
                    </label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5">
                        <div>
                          <code className="text-emerald-400 font-bold tracking-wider text-sm">{appliedCoupon.code}</code>
                          <p className="text-xs text-emerald-400/80 mt-0.5">−₹{appliedCoupon.discountAmount.toFixed(2)} discount applied</p>
                        </div>
                        <button type="button" onClick={handleRemoveCoupon} className="text-emerald-400/70 hover:text-emerald-400 cursor-pointer">
                          <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          value={couponCode}
                          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                          placeholder="Enter coupon code"
                          disabled={!!loyaltyRedemption}
                          className="flex-1 bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 uppercase font-mono placeholder:normal-case placeholder:text-on-surface-variant/30 disabled:opacity-40"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim() || !!loyaltyRedemption}
                          className="px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-xl text-xs font-bold hover:bg-primary/20 disabled:opacity-40 cursor-pointer transition-all"
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-red-400 mt-1">{couponError}</p>}
                  </div>

                  {/* ── LOYALTY POINTS ──────────────────────────────────── */}
                  {loyaltyPoints > 0 && (
                    <div className="border-t border-white/5 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowLoyalty(v => !v)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-on-surface-variant block">Loyalty Points</span>
                          <span className="text-xs text-amber-400 font-semibold">{loyaltyPoints} pts available</span>
                        </div>
                        <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${showLoyalty ? 'rotate-180' : ''}`}>expand_more</span>
                      </button>

                      {showLoyalty && (
                        <div className="mt-3">
                          {loyaltyRedemption ? (
                            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5">
                              <div>
                                <p className="text-xs text-amber-400 font-bold">{loyaltyRedemption.pointsToRedeem} pts redeemed</p>
                                <p className="text-xs text-amber-400/80">−₹{loyaltyRedemption.discountAmount.toFixed(2)} discount</p>
                              </div>
                              <button type="button" onClick={handleRemovePoints} className="text-amber-400/70 hover:text-amber-400 cursor-pointer">
                                <span className="material-symbols-outlined text-xl">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min={0}
                                  max={Math.min(loyaltyPoints, 5000)}
                                  step={50}
                                  value={pointsToRedeem}
                                  disabled={!!appliedCoupon}
                                  onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                                  className="flex-1 accent-primary"
                                />
                                <span className="text-xs font-bold text-amber-400 w-16 text-right">{pointsToRedeem} pts</span>
                              </div>
                              {pointsToRedeem > 0 && (
                                <p className="text-xs text-on-surface-variant">≈ ₹{(pointsToRedeem * 0.5).toFixed(2)} discount</p>
                              )}
                              <button
                                type="button"
                                onClick={handleRedeemPoints}
                                disabled={pointsToRedeem === 0 || loyaltyLoading || !!appliedCoupon}
                                className="w-full py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/20 disabled:opacity-40 cursor-pointer"
                              >
                                {loyaltyLoading ? 'Applying…' : 'Apply Points'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TOTALS ──────────────────────────────────────────── */}
                  <div className="pt-4 border-t border-white/5 space-y-1.5">
                    <div className="flex justify-between text-xs text-on-surface-variant">
                      <span>Service Price</span>
                      <span>{formatCurrency(basePrice)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400">
                        <span>Coupon ({appliedCoupon?.code})</span>
                        <span>−{formatCurrency(couponDiscount)}</span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-xs text-amber-400">
                        <span>Loyalty Points ({loyaltyRedemption?.pointsToRedeem} pts)</span>
                        <span>−{formatCurrency(loyaltyDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-white/10">
                      <span className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Final Total</span>
                      <span className="text-2xl font-headline font-extrabold text-primary">
                        {formatCurrency(finalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-amber-400 font-semibold pt-1">
                      <span>15% Advance (Pay via Razorpay)</span>
                      <span>{formatCurrency(finalAmount * 0.15)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-on-surface-variant/80 pt-1">
                      <span>Remaining Balance (Pay at Salon)</span>
                      <span>{formatCurrency(finalAmount * 0.85)}</span>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-between pt-4 border-t border-white/5">
                  <Button variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        {isRescheduling ? 'Confirm Rescheduling' : 'Confirm & Book'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: SUCCESS SCREEN */}
            {step === 5 && selectedService && (
              <div className="space-y-6 text-center py-8">
                {/* Success Animation */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_40px_rgba(242,202,80,0.15)]">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                      className="material-symbols-outlined text-[48px] text-primary font-extrabold"
                    >
                      check_circle
                    </motion.span>
                  </div>
                </div>

                <h3 className="font-headline text-2xl text-on-surface mb-2">
                  {isRescheduling ? 'Reschedule Request Sent' : 'Booking Request Sent'}
                </h3>
                <p className="text-on-surface-variant text-xs max-w-sm mx-auto leading-relaxed">
                  Your luxury grooming request has been successfully submitted and is currently <strong className="text-primary font-bold">Awaiting Salon Confirmation</strong>. You will be notified here as soon as the salon administrator reviews your request.
                </p>

                <Card className="border border-white/5 p-4 max-w-xs mx-auto bg-white/[0.01] my-6">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-1">
                    Booking Reference
                  </span>
                  <span className="text-lg font-headline font-extrabold text-primary tracking-widest block uppercase">
                    {bookingId}
                  </span>
                  <div className="border-t border-white/5 mt-3 pt-3 flex justify-between text-[11px] text-on-surface-variant">
                    <span>{selectedDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>{selectedTimeSlot}</span>
                    <span>{isAnyBarber ? 'Any Stylist' : selectedBarber?.name.split(' ')[0]}</span>
                  </div>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-xs mx-auto pt-4">
                  <Button
                    onClick={() => navigate('/appointments')}
                    className="w-full"
                  >
                    View Appointments
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedBarber(null);
                      setIsAnyBarber(false);
                      setSelectedDate(undefined);
                      setSelectedTimeSlot('');
                      setNotes('');
                      setIsRescheduling(false);
                      changeStep(1);
                    }}
                    className="w-full"
                  >
                    Book Another
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* JOIN WAITLIST DIALOG */}
      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 animate-spin">hourglass_empty</span>
              Join Stylist Waitlist
            </DialogTitle>
            <DialogDescription>
              The time slot <strong className="text-primary">{waitlistSlot}</strong> is currently fully booked. Join the waitlist to receive instant notifications if a cancellation occurs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWaitlistSubmit} className="space-y-4 mt-2">
            <div className="bg-white/[0.01] border border-white/5 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Grooming Service</span>
                <span className="text-on-surface font-semibold">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Stylist Specialist</span>
                <span className="text-on-surface font-semibold">
                  {isAnyBarber ? 'Any Available Stylist' : selectedBarber?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px]">Target Date</span>
                <span className="text-on-surface font-semibold">
                  {selectedDate?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Time Window Preference */}
            <div className="space-y-1.5">
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold">
                Backup Time Window Preference
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(['Morning', 'Afternoon', 'Evening', 'Night', 'Any'] as const).map((windowPref) => {
                  const isSel = waitlistPeriod === windowPref;
                  return (
                    <button
                      key={windowPref}
                      type="button"
                      onClick={() => setWaitlistPeriod(windowPref)}
                      className={`py-2 px-1 text-[9px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-primary border-primary text-on-primary shadow-sm font-extrabold'
                          : 'bg-surface-container border-white/5 text-on-surface hover:border-primary/30'
                      }`}
                    >
                      {windowPref}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Preference Checkboxes */}
            <div className="space-y-2">
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold">
                Get Alerted Via
              </label>
              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyInApp}
                    onChange={(e) => setNotifyInApp(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded bg-surface-container border-white/10"
                  />
                  <span>In-App Alert</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded bg-surface-container border-white/10"
                  />
                  <span>Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifySMS}
                    onChange={(e) => setNotifySMS(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded bg-surface-container border-white/10"
                  />
                  <span>SMS</span>
                </label>
              </div>
            </div>

            {/* Position indicator */}
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center text-xs text-amber-400 font-semibold uppercase tracking-wider">
              <span>Position Estimate: You'll be <strong className="text-white font-extrabold">#3</strong> in line</span>
            </div>

            <DialogFooter className="pt-2 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setWaitlistOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Join Waitlist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RAZORPAY CHECKOUT DIALOG */}
      <Dialog open={razorpayOpen} onOpenChange={setRazorpayOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden bg-[#1a2332] text-white rounded-2xl border-none">
          {/* Razorpay Brand Header */}
          <div className="bg-[#0f172a] p-4 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="bg-[#1f73e8] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white">
                Razorpay
              </div>
              <span className="text-[10px] font-bold text-slate-400">LUXE GROOM PORTAL</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">15% Advance Payment</span>
              <span className="text-sm font-extrabold text-[#f2ca50]">₹{(finalAmount * 0.15).toFixed(2)}</span>
            </div>
          </div>

          <div className="p-5 min-h-[220px] flex flex-col justify-between">
            {razorpayStep === 'methods' && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Select Payment Method</span>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setPaymentMethod('upi');
                      setRazorpayStep('details');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#1f73e8]/50 hover:bg-white/[0.08] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1f73e8]">qr_code_2</span>
                      <div>
                        <span className="text-xs font-bold block text-white">UPI / GPay / Paytm</span>
                        <span className="text-[9px] text-slate-400">Instant transfer using UPI apps</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>

                  <button
                    onClick={() => {
                      setPaymentMethod('card');
                      setRazorpayStep('details');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#1f73e8]/50 hover:bg-white/[0.08] transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1f73e8]">credit_card</span>
                      <div>
                        <span className="text-xs font-bold block text-white">Card Payment</span>
                        <span className="text-[9px] text-slate-400">Visa, MasterCard, RuPay, Maestro</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

            {razorpayStep === 'details' && (
              <div className="space-y-4">
                <button
                  onClick={() => setRazorpayStep('methods')}
                  className="text-[9px] text-[#1f73e8] uppercase font-extrabold tracking-wider flex items-center gap-1 hover:opacity-85"
                >
                  <span className="material-symbols-outlined text-[12px]">arrow_back</span> Change Method
                </button>

                {paymentMethod === 'upi' ? (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Enter UPI ID</span>
                    <input
                      type="text"
                      placeholder="e.g. user@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600"
                    />
                    <button
                      disabled={!upiId.includes('@')}
                      onClick={() => {
                        setRazorpayStep('processing');
                        setTimeout(() => {
                          setRazorpayStep('success');
                          setTimeout(() => {
                            setRazorpayOpen(false);
                            executeBookingSubmission();
                          }, 1500);
                        }, 2000);
                      }}
                      className="w-full py-2.5 bg-[#1f73e8] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:bg-[#155fc4] transition-all"
                    >
                      Verify & Pay ₹{(finalAmount * 0.15).toFixed(2)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Enter Card Details</span>
                    <input
                      type="text"
                      placeholder="Card Number (e.g. 4111 2222 3333 4444)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="bg-[#0f172a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600"
                      />
                    </div>
                    <button
                      disabled={cardNumber.length < 12 || cardExpiry.length < 4 || cardCvv.length < 3}
                      onClick={() => {
                        setRazorpayStep('processing');
                        setTimeout(() => {
                          setRazorpayStep('success');
                          setTimeout(() => {
                            setRazorpayOpen(false);
                            executeBookingSubmission();
                          }, 1500);
                        }, 2000);
                      }}
                      className="w-full py-2.5 bg-[#1f73e8] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:bg-[#155fc4] transition-all"
                    >
                      Pay ₹{(finalAmount * 0.15).toFixed(2)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {razorpayStep === 'processing' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <span className="animate-spin material-symbols-outlined text-4xl text-[#1f73e8]">progress_activity</span>
                <span className="text-xs font-bold text-white">Securing payment connection...</span>
                <span className="text-[10px] text-slate-400">Do not refresh or press back</span>
              </div>
            )}

            {razorpayStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <span className="material-symbols-outlined text-5xl text-emerald-400 animate-bounce">check_circle</span>
                <span className="text-sm font-extrabold text-white">Payment Successful!</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">Razorpay Transaction: TXN-{Math.floor(Math.random() * 900000000)}</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[8px] text-slate-500 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[10px] text-emerald-500">lock</span> Secured by Razorpay
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default BookingWizard;
