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
import { toast } from 'sonner';
import { getApiBase } from '@/shared/utils/api';

const API_BASE = getApiBase();

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
  const [selectedGenderTab, setSelectedGenderTab] = useState<'ALL' | 'Male' | 'Female'>(() => {
    if (user?.gender === 'Female') return 'Female';
    if (user?.gender === 'Male') return 'Male';
    return 'ALL';
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return location.state?.category || sessionStorage.getItem('luxe_wizard_category') || null;
  });
  
  useEffect(() => {
    if (selectedCategory) {
      sessionStorage.setItem('luxe_wizard_category', selectedCategory);
    } else {
      sessionStorage.removeItem('luxe_wizard_category');
    }
  }, [selectedCategory]);

  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
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

  // Leaves state
  const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);

  useEffect(() => {
    const fetchApprovedLeaves = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/leaves/approved`);
        if (res.data.success) {
          setApprovedLeaves(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch approved leaves:', err);
      }
    };
    fetchApprovedLeaves();
  }, []);

  // Razorpay states
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [razorpayStep, setRazorpayStep] = useState<'methods' | 'details' | 'processing' | 'success'>('methods');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Book for friend / opposite gender states
  const [bookForFriend, setBookForFriend] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendAge, setFriendAge] = useState('');

  // --- SETTINGS STATE & PARSING HELPERS ---
  const [salonSettings, setSalonSettings] = useState<any>({
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    slotInterval: 30,
    maxBookingsPerSlot: 1,
    holidays: [],
    breakStart: '01:00 PM',
    breakEnd: '02:00 PM'
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/settings`);
      if (res.data.success) {
        setSalonSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(0?[1-9]|1[0-2]):([0-5][0-9])\s*(AM|PM|am|pm)$/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const formatMinutesToTime = (totalMinutes: number): string => {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const getBookedSlotsForDate = useCallback((): string[] => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    const barberIdStr = isAnyBarber ? 'any' : (selectedBarber?.id || selectedBarber?._id);
    const blockedSlots: string[] = [];

    appointments
      .filter((apt: any) =>
        apt.date === dateStr &&
        ['Pending', 'Confirmed', 'In Progress', 'Rescheduled'].includes(apt.status) &&
        (barberIdStr === 'any' || apt.barberId === barberIdStr || !apt.barberId) // If barber isn't selected or matching
      )
      .forEach((apt: any) => {
        let duration = salonSettings.slotInterval || 30; // default
        if (apt.serviceName) {
           const sNames = apt.serviceName.split(' + ');
           duration = sNames.reduce((sum: number, name: string) => {
             const s = services.find((srv: Service) => srv.name === name);
             return sum + (s?.duration || 0);
           }, 0) || (salonSettings.slotInterval || 30);
        }
        const startMin = parseTimeToMinutes(apt.time);
        const slotsCount = Math.ceil(duration / (salonSettings.slotInterval || 30));
        
        for (let i = 0; i < slotsCount; i++) {
           blockedSlots.push(formatMinutesToTime(startMin + i * (salonSettings.slotInterval || 30)));
        }
      });
      
    return [...new Set(blockedSlots)];
  }, [selectedDate, appointments, isAnyBarber, selectedBarber, services, salonSettings]);

  const isTimeSlotAvailable = useCallback((timeStr: string, totalDurationMinutes: number, bookedSlots: string[], allSlots: string[]): boolean => {
    const startMin = parseTimeToMinutes(timeStr);
    const slotsNeeded = Math.ceil(totalDurationMinutes / (salonSettings.slotInterval || 30));
    
    for (let i = 0; i < slotsNeeded; i++) {
      const slotTime = formatMinutesToTime(startMin + i * (salonSettings.slotInterval || 30));
      if (!allSlots.includes(slotTime) || bookedSlots.includes(slotTime)) {
        return false;
      }
    }
    return true;
  }, [salonSettings]);

  const generateSlots = useCallback(() => {
    if (!selectedDate) return { Morning: [], Afternoon: [], Evening: [] };
    const dateStr = selectedDate.toISOString().split('T')[0];
    if (salonSettings.holidays && salonSettings.holidays.includes(dateStr)) {
      return { Morning: [], Afternoon: [], Evening: [] };
    }

    const startMin = parseTimeToMinutes(salonSettings.openingTime || '09:00 AM');
    const endMin = parseTimeToMinutes(salonSettings.closingTime || '09:00 PM');
    const breakStartMin = parseTimeToMinutes(salonSettings.breakStart || '01:00 PM');
    const breakEndMin = parseTimeToMinutes(salonSettings.breakEnd || '02:00 PM');
    const interval = salonSettings.slotInterval || 30;

    const morning: string[] = [];
    const afternoon: string[] = [];
    const evening: string[] = [];

    for (let min = startMin; min < endMin; min += interval) {
      if (min >= breakStartMin && min < breakEndMin) continue;
      const timeStr = formatMinutesToTime(min);
      if (min < 12 * 60) {
        morning.push(timeStr);
      } else if (min < 16 * 60) {
        afternoon.push(timeStr);
      } else {
        evening.push(timeStr);
      }
    }
    return { Morning: morning, Afternoon: afternoon, Evening: evening };
  }, [selectedDate, salonSettings]);

  const getAllGeneratedSlots = useCallback(() => {
    const slots = generateSlots();
    return [...slots.Morning, ...slots.Afternoon, ...slots.Evening];
  }, [generateSlots]);

  const handleQuickEarliest = () => {
    const booked = getBookedSlotsForDate();
    const allSlots = getAllGeneratedSlots();
    const earliest = allSlots.find(s => !booked.includes(s));
    if (earliest) {
      setSelectedTimeSlot(earliest);
      toast.success(`Selected earliest available time: ${earliest}`);
    } else {
      toast.error('No slots available for this date.');
    }
  };

  const handleQuickRecommended = () => {
    const booked = getBookedSlotsForDate();
    const allSlots = getAllGeneratedSlots();
    const recs = ['10:00 AM', '10:30 AM', '05:00 PM', '05:30 PM'];
    const chosen = recs.find(s => allSlots.includes(s) && !booked.includes(s)) ||
                   allSlots.find(s => !booked.includes(s));
    if (chosen) {
      setSelectedTimeSlot(chosen);
      toast.success(`Selected recommended time: ${chosen}`);
    } else {
      toast.error('No slots available for this date.');
    }
  };

  const handleQuickSameAsLast = () => {
    const booked = getBookedSlotsForDate();
    const allSlots = getAllGeneratedSlots();
    const lastApt = [...appointments]
      .filter((apt: any) => apt.clientEmail === user?.email && apt.status !== 'Cancelled' && apt.status !== 'Declined')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    if (lastApt && lastApt.time) {
      const lastTime = lastApt.time;
      if (allSlots.includes(lastTime) && !booked.includes(lastTime)) {
        setSelectedTimeSlot(lastTime);
        toast.success(`Selected same time as last visit: ${lastTime}`);
      } else {
        toast.error(`Last visit slot (${lastTime}) is not available today.`);
      }
    } else {
      toast.error('No previous scheduling history found.');
    }
  };

  const handleQuickNextAvailable = () => {
    const booked = getBookedSlotsForDate();
    const allSlots = getAllGeneratedSlots();
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = selectedDate && selectedDate.toISOString().split('T')[0] === todayStr;
    
    if (isToday) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const nextSlot = allSlots.find(s => {
        const slotMin = parseTimeToMinutes(s);
        return slotMin > currentMin && !booked.includes(s);
      });
      if (nextSlot) {
        setSelectedTimeSlot(nextSlot);
        toast.success(`Selected next available today: ${nextSlot}`);
      } else {
        toast.error('No subsequent available slots for today.');
      }
    } else {
      const earliest = allSlots.find(s => !booked.includes(s));
      if (earliest) {
        setSelectedTimeSlot(earliest);
        toast.success(`Selected earliest slot: ${earliest}`);
      } else {
        toast.error('No slots available for this date.');
      }
    }
  };

  const [conflictError, setConflictError] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);

  const calculateSuggestedSlots = (selectedSlot: string, booked: string[], allSlots: string[]) => {
    const selectedMin = parseTimeToMinutes(selectedSlot);
    const available = allSlots.filter(s => !booked.includes(s) && s !== selectedSlot);
    const sorted = available.sort((a, b) => {
      const distA = Math.abs(parseTimeToMinutes(a) - selectedMin);
      const distB = Math.abs(parseTimeToMinutes(b) - selectedMin);
      return distA - distB;
    });
    return sorted.slice(0, 3);
  };

  // ─── Coupon helpers ───────────────────────────────────────────────────────
  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_user_token') || localStorage.getItem('luxe_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLoyaltyBalance = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/loyalty`, { headers: getAuthHeader() });
      if (res.data.success) setLoyaltyPoints(res.data.data?.points || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { if (step === 4) fetchLoyaltyBalance(); }, [step, fetchLoyaltyBalance]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || selectedServices.length === 0) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const bPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const res = await axios.post(`${API_BASE}/api/auth/coupons/validate`, {
        code: couponCode.trim(),
        bookingAmount: bPrice,
        serviceId: selectedServices.map(s => s.id || s._id).join(',')
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
    if (pointsToRedeem <= 0 || selectedServices.length === 0) return;
    setLoyaltyLoading(true);
    try {
      const bPrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const res = await axios.post(`${API_BASE}/api/auth/loyalty/redeem`, {
        points: pointsToRedeem,
        bookingAmount: bPrice
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
  const basePrice = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration || 0), 0);
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
    if (selectedServices.length === 0 || !selectedDate) return;

    const serviceNamesStr = selectedServices.map(s => s.name).join(' + ');
    joinWaitlist({
      serviceName: serviceNamesStr,
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
      if (svc) setSelectedServices([svc]);
      
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
        if (svc) setSelectedServices([svc]);
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
        const booked = getBookedSlotsForDate();
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
        
        if (svc) setSelectedServices([svc]);
        if (bbr) setSelectedBarber(bbr);
        setNotes(existing.notes || '');
        
        // Go straight to Date & Time selection (Step 3)
        setStep(3);
        return;
      }
    }

    if (preSelectedServiceId) {
      const found = services.find((s: Service) => s.id === preSelectedServiceId || s._id === preSelectedServiceId);
      if (found) {
        setSelectedServices([found]);
        setSelectedCategory(found.category);
      }
    }
    if (preSelectedBarberId) {
      const found = barbers.find((b: Barber) => b.id === preSelectedBarberId || b._id === preSelectedBarberId);
      if (found) setSelectedBarber(found);
    }
  }, [preSelectedServiceId, preSelectedBarberId, rescheduleAppointmentId, services, barbers, appointments, waitlist, location.search]);

  const bookedSlots = getBookedSlotsForDate();

  // Wizard navigation handlers
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Form final submission
  const handleConfirmBooking = () => {
    if (selectedServices.length === 0 || (!selectedBarber && !isAnyBarber) || !selectedDate || !selectedTimeSlot) return;
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
    
    // Determine barber/doctor to assign if "Any Available" is selected
    let barberToBook = selectedBarber;
    if (isAnyBarber) {
      const isHairTransplant = selectedServices.some(s => s.name?.toLowerCase().includes('transplant'));
      const isPremium = selectedServices.some(s => s.category === 'Premium Services');
      let availableBarbers = barbers;
      
      if (selectedGenderTab === 'Female') {
        availableBarbers = barbers.filter((b: any) => b.gender === 'Female');
      } else if (selectedGenderTab === 'Male') {
        availableBarbers = barbers.filter((b: any) => b.gender !== 'Female');
      }
      
      if (isHairTransplant || isPremium) {
        const doctors = availableBarbers.filter((b: any) => b.isDoctor || b.role?.toLowerCase().includes('trichologist') || b.role?.toLowerCase().includes('doctor') || b.role?.toLowerCase().includes('surgeon') || b.role?.toLowerCase().includes('dermatologist') || b.name?.startsWith('Dr.'));
        barberToBook = doctors[0] || availableBarbers[0] || barbers[0] || null;
      } else {
        // Pick first regular barber
        barberToBook = availableBarbers[0] || barbers[0] || null;
      }
    }

    if (!barberToBook) {
      setIsSubmitting(false);
      return;
    }

    try {
      const serviceNamesStr = selectedServices.map(s => s.name).join(' + ');
      const payload = {
        serviceName: serviceNamesStr,
        price: basePrice,
        date: dateStr,
        time: selectedTimeSlot,
        barberId: barberToBook.id || barberToBook._id || '',
        barberName: barberToBook.name,
        notes: (bookForFriend || (user?.gender && selectedServices.some(s => s.gender && user.gender !== s.gender && s.gender !== 'Both'))) && friendName 
               ? `Booking for: ${friendName} (Age: ${friendAge || 'N/A'}). ${notes}` 
               : notes,
        // Module 15 fields
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        loyaltyPointsRedeemed: loyaltyRedemption?.pointsToRedeem || 0,
        loyaltyDiscountAmount: loyaltyDiscount,
        finalAmount,
        advancePaid: Math.round(finalAmount * 0.50),
        remainingBalance: Math.round(finalAmount * 0.50),
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
    } catch (err: any) {
      console.error('Booking failed:', err);
      const isConflict = err.response?.status === 409 || err.message?.includes('409') || err.response?.data?.message === 'slot_taken' || err.response?.data?.message === 'booking full';
      if (isConflict) {
        setConflictError(true);
        const booked = getBookedSlotsForDate();
        if (!booked.includes(selectedTimeSlot)) {
          booked.push(selectedTimeSlot);
        }
        const suggestions = calculateSuggestedSlots(selectedTimeSlot, booked, getAllGeneratedSlots());
        setSuggestedSlots(suggestions);
        toast.error('⚠️ Sorry! This slot was just booked by another customer. Please choose a different time.');
        setStep(3); // Redirect back to Date & Time selection step
      } else {
        toast.error(err.response?.data?.message || 'Grooming reservation failed.');
      }
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
    <main className={`pt-24 pb-32 px-margin-mobile md:px-margin-desktop ${step === 1 ? 'max-w-5xl' : 'max-w-2xl'} mx-auto font-body min-h-screen transition-all duration-300`}>
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
            { 
              label: (selectedServices.some(s => s.name?.toLowerCase().includes('transplant') || s.category === 'Premium Services'))
                ? 'Doctor'
                : 'Stylist', 
              num: 2 
            },
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
            {/* STEP 1: SERVICE SELECTION (BENTO GRID) */}
            {step === 1 && (
              <div className="space-y-6 relative">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-headline font-bold text-on-surface mb-1">Choose a Service</h3>
                  <p className="text-xs text-on-surface-variant">Explore our premium services below. Hover any service for details.</p>
                </div>
                
                {/* Selected Service Summary Card */}
                {selectedServices.length > 0 && (
                  <Card className="border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col gap-3 mb-4 shadow-lg backdrop-blur-md rounded-2xl">
                    {selectedServices.map(svc => (
                      <div key={svc.id || svc._id} className="flex gap-4 items-center">
                        <img
                          src={svc.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500'}
                          alt={svc.name}
                          className="w-14 h-14 object-cover object-top rounded-xl border border-primary/30 shadow-md flex-shrink-0"
                        />
                        <div className="flex-grow">
                          <Badge variant="gold" className="mb-1 text-[10px]">{svc.category}</Badge>
                          <h4 className="font-headline font-bold text-on-surface text-base">{svc.name}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> {svc.duration} min
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-headline font-bold text-primary block">
                            {formatCurrency(svc.price)}
                          </span>
                          <span className="text-[9px] text-primary/70 font-bold uppercase tracking-wider">Selected</span>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}

                {/* Male / Female Gender Category Filter Pills */}
                <div className="flex justify-center items-center gap-2 mb-3">
                  {[
                    { id: 'ALL', label: 'All Services ⚧' },
                    { id: 'Male', label: 'Men\'s Services ♂' },
                    { id: 'Female', label: 'Women\'s Services ♀' }
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGenderTab(g.id as any)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer ${
                        selectedGenderTab === g.id
                          ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20 scale-105'
                          : 'bg-surface-container border-white/10 text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Category Filter Pills */}
                <div className="mb-4">
                  {selectedCategory === 'Premium Services' ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 font-label-md text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-md">
                        <span className="material-symbols-outlined text-[15px]">diamond</span> Premium Clinical Treatments Only
                      </span>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-xs text-on-surface-variant hover:text-white underline cursor-pointer ml-2"
                      >
                        Show All Categories
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start md:justify-center">
                      {['ALL', ...Array.from(new Set((services as Service[])
                        .filter(s => s.status !== 'Inactive' && s.category !== 'Premium Services')
                        .filter(s => {
                          if (selectedGenderTab === 'Male') {
                            return s.category !== 'Hair Style' && s.category !== "Women's Styles" && s.gender !== 'Female';
                          }
                          if (selectedGenderTab === 'Female') {
                            return s.category !== 'Beard Trim' && s.category !== 'Beard' && s.category !== 'Haircut' && s.category !== 'Haircuts' && s.gender !== 'Male';
                          }
                          return true;
                        })
                        .map(s => s.category)))].map(cat => {
                        const isActive = (selectedCategory === cat) || (!selectedCategory && cat === 'ALL');
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat === 'ALL' ? null : cat)}
                            className={`px-5 py-2 rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-primary text-on-primary shadow-lg shadow-primary/25 scale-105'
                                : 'bg-surface-container border border-white/5 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* BENTO GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1 p-1 custom-scrollbar">
                  {((services as Service[]).filter(svc => {
                    const isActive = svc.status !== 'Inactive';
                    // If browsing general services, remove premium services
                    if (selectedCategory !== 'Premium Services' && svc.category === 'Premium Services') {
                      return false;
                    }
                    const matchesCategory = !selectedCategory || selectedCategory === 'ALL' || svc.category === selectedCategory;

                    // Strict Male / Female Service Isolation
                    if (selectedGenderTab === 'Male') {
                      // For male users: show ONLY Haircut, Beard Trim, Facial, Packages.
                      // Prevent any women's services/styles from appearing!
                      const isWomens = svc.gender === 'Female' || svc.category === 'Hair Style' || svc.category === "Women's Styles";
                      if (isWomens) return false;
                      if (svc.category === 'Packages' && svc.gender !== 'Male') return false;
                      const allowedMaleCategories = ['Haircut', 'Haircuts', 'Beard Trim', 'Beard', 'Facial', 'Facials', 'Packages', 'Premium Services'];
                      if (svc.category && !allowedMaleCategories.includes(svc.category)) return false;
                    } else if (selectedGenderTab === 'Female') {
                      // For female users: show only Women's Styles / Female / Unisex services. Prevent men's only services (Beard Trim, Beard, etc.)
                      const isMensOnly = svc.gender === 'Male' || svc.category === 'Beard Trim' || svc.category === 'Beard' || svc.category === 'Haircut' || svc.category === 'Haircuts';
                      if (isMensOnly) return false;
                      if (svc.category === 'Packages' && svc.gender !== 'Female') return false;
                    }

                    return isActive && matchesCategory;
                  })).map((svc: Service, index: number) => {
                    const isSel = selectedServices.some(s => s.id === svc.id || s._id === svc._id);
                    const isPremiumService = svc.category === 'Premium Services';
                    return (
                      <motion.div
                        key={svc.id || svc._id}
                        whileHover={{ scale: 1.02, y: -3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedServices(prev => {
                            const exactExists = prev.some(s => s.id === svc.id || s._id === svc._id);
                            if (exactExists) {
                              return prev.filter(s => s.id !== svc.id && s._id !== svc._id);
                            } else {
                              const categoryExists = prev.find(s => s.category === svc.category);
                              if (categoryExists) {
                                toast.info(`Switched ${categoryExists.category} to ${svc.name}`);
                                return prev.map(s => s.category === svc.category ? svc : s);
                              } else {
                                return [...prev, svc];
                              }
                            }
                          });
                          setSelectedBarber(null);
                          setIsAnyBarber(true);
                        }}
                        className={`group relative rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md flex flex-col justify-between col-span-1 ${
                          isSel
                            ? 'border-primary bg-primary/10 shadow-[0_0_25px_rgba(242,202,80,0.25)] ring-2 ring-primary/40'
                            : isPremiumService
                            ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-surface-container/80 to-surface-container hover:border-amber-400 hover:shadow-xl'
                            : 'border-white/10 bg-surface-container/70 hover:border-primary/50 hover:bg-surface-container-high/90 hover:shadow-xl'
                        }`}
                      >
                        {/* Image Preview / Banner Header */}
                        <div className="relative h-48 w-full overflow-hidden bg-surface-container-highest">
                          <img
                            src={svc.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500'}
                            alt={svc.name}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/40"></div>
                          
                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center">
                            {isPremiumService ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest bg-gradient-to-r from-amber-500 to-yellow-300 text-black shadow-md flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">diamond</span> VIP PREMIUM
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-widest bg-black/60 backdrop-blur-md text-primary border border-white/10">
                                {svc.category}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/20 backdrop-blur-md text-primary border border-primary/30 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">schedule</span>
                              {svc.duration}m
                            </span>
                          </div>

                          {/* Selected Indicator Checkmark */}
                          {isSel && (
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg animate-bounce">
                                <span className="material-symbols-outlined text-2xl font-bold">check</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bento Card Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h4 className="font-headline font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                                {svc.name}
                              </h4>
                            </div>
                            {svc.description && (
                              <p className="text-[11px] text-on-surface-variant/80 line-clamp-2 mb-3 leading-snug">
                                {svc.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                            <span className="font-headline font-extrabold text-primary text-sm">
                              {formatCurrency(svc.price)}
                            </span>
                            <button
                              type="button"
                              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
                                isSel
                                  ? 'bg-primary text-on-primary shadow-md'
                                  : 'bg-white/5 text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary'
                              }`}
                            >
                              {isSel ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>


                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xs text-on-surface-variant">
                    {selectedServices.length > 0 ? `${selectedServices.length} service(s) selected` : 'Please select a service to proceed'}
                  </span>
                  <Button
                    onClick={nextStep}
                    disabled={selectedServices.length === 0}
                    className="flex items-center gap-2"
                  >
                    {selectedServices.some(s => s.name?.toLowerCase().includes('transplant') || s.category === 'Premium Services')
                      ? 'Select Doctor'
                      : 'Select Stylist'} <span className="material-symbols-outlined">arrow_forward</span>
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: STYLIST / DOCTOR SELECTION */}
            {step === 2 && (() => {
              const isHairTransplant = selectedServices.some(s => s.name?.toLowerCase().includes('transplant'));
              const isPremiumBooking = selectedServices.some(s => s.category === 'Premium Services') || isHairTransplant;
              const doctorList = barbers.filter((b: any) => b.isDoctor || b.role?.toLowerCase().includes('trichologist') || b.role?.toLowerCase().includes('doctor') || b.role?.toLowerCase().includes('surgeon') || b.role?.toLowerCase().includes('dermatologist') || b.name?.startsWith('Dr.'));
              const regularList = barbers.filter((b: any) => !(b.isDoctor || b.role?.toLowerCase().includes('trichologist') || b.role?.toLowerCase().includes('doctor') || b.role?.toLowerCase().includes('surgeon') || b.role?.toLowerCase().includes('dermatologist') || b.name?.startsWith('Dr.')));
              
              const isFemaleBooking = selectedGenderTab === 'Female';
              const isMaleBooking = selectedGenderTab === 'Male';
              
              let baseList = isPremiumBooking ? doctorList : regularList;
              
              if (isFemaleBooking) {
                baseList = baseList.filter((b: any) => b.gender === 'Female');
              } else if (isMaleBooking) {
                baseList = baseList.filter((b: any) => b.gender !== 'Female');
              }
              
              const displayedSpecialists = baseList;

              return (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-headline text-on-surface font-bold">
                    {isHairTransplant
                      ? 'Book Your Hair Transplant Surgeon / Doctor'
                      : isPremiumBooking 
                      ? 'Book a Specialist Doctor for Treatment' 
                      : 'Select Your Groomer'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {isHairTransplant
                      ? 'Hair Transplant procedures require certified surgical medical practitioners. Only board-certified doctors are qualified.'
                      : isPremiumBooking 
                      ? 'Our board-certified surgeons and trichologists lead your medical scalp & premium therapy procedures.' 
                      : 'Choose an expert stylist or let us match you with the first available chair.'}
                  </p>
                </div>

                {isPremiumBooking && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 flex items-center gap-3.5 shadow-lg">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">medical_services</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">Clinical Doctor Appointment Included</h4>
                      <p className="text-[11px] text-on-surface-variant/90 mt-0.5">
                        Your premium treatment includes a full clinical consultation, diagnostic examination, and procedural execution by certified medical practitioners.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Any Available Option */}
                  <div
                    onClick={() => {
                      setSelectedBarber(null);
                      setIsAnyBarber(true);
                      setSelectedDate(undefined);
                      setSelectedTimeSlot('');
                    }}
                    className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:border-primary/45 ${
                      isAnyBarber ? 'border-primary bg-primary/5' : 'border-white/5 bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <span className="material-symbols-outlined text-primary text-2xl">
                          {isPremiumBooking ? 'medical_services' : 'group'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-headline text-sm text-on-surface font-bold group-hover:text-primary transition-colors">
                          {isHairTransplant 
                            ? 'Next Available Hair Transplant Surgeon'
                            : isPremiumBooking 
                            ? 'Next Available Doctor / Specialist' 
                            : 'Any Available Stylist'}
                        </h4>
                        <p className="text-[10px] text-on-surface-variant">
                          {isHairTransplant 
                            ? 'Instant assignment to an on-duty hair transplant surgeon.' 
                            : 'Instant availability, matched automatically.'}
                        </p>
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

                  {/* Individual Barbers & Doctors */}
                  {displayedSpecialists.map((bbr: any) => {
                    const isSel = !isAnyBarber && (selectedBarber?.id === bbr.id || selectedBarber?._id === bbr._id);
                    const isDoc = bbr.isDoctor || bbr.role?.toLowerCase().includes('trichologist') || bbr.role?.toLowerCase().includes('doctor') || bbr.role?.toLowerCase().includes('surgeon') || bbr.role?.toLowerCase().includes('dermatologist') || bbr.name?.startsWith('Dr.');
                    return (
                      <div
                        key={bbr.id || bbr._id}
                        onClick={() => {
                          setSelectedBarber(bbr);
                          setIsAnyBarber(false);
                          setSelectedDate(undefined);
                          setSelectedTimeSlot('');
                        }}
                        className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-200 group hover:border-primary/45 ${
                          isSel 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30' 
                            : isDoc
                            ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 via-surface-container to-surface-container'
                            : 'border-white/5 bg-surface-container'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={bbr.image}
                            alt={bbr.name}
                            className={`w-12 h-12 rounded-full object-cover border group-hover:scale-105 transition-transform duration-300 ${
                              isDoc ? 'border-amber-400/50' : 'border-white/10'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-headline text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                                {bbr.name}
                              </h4>
                              {isDoc && (
                                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black tracking-wider uppercase flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-[10px]">medical_services</span> Doctor
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-on-surface-variant truncate">{bbr.role}</p>
                            {bbr.specialization && (
                              <p className="text-[9px] text-amber-400/90 truncate font-semibold mt-0.5">{bbr.specialization}</p>
                            )}
                            
                            <div className="flex items-center text-primary mt-1 gap-1">
                              <span className="material-symbols-outlined text-[12px] [font-variation-settings:'FILL'_1] text-amber-400">star</span>
                              <span className="text-[10px] font-bold">{bbr.rating ? bbr.rating.toFixed(1) : '5.0'}</span>
                              {bbr.experienceYears && (
                                <span className="text-[9px] text-on-surface-variant/70 ml-1 font-semibold">({bbr.experienceYears}+ yrs exp)</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Specialty Tags */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(bbr.skills || []).slice(0, 3).map((skill: string, sIdx: number) => (
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
              );
            })()}

            {/* STEP 3: DATE & TIME PICKER (REDESIGNED SLOT SELECTION SYSTEM) */}
            {step === 3 && (() => {
              const bookedSlots = getBookedSlotsForDate();
              const generatedSlots = generateSlots();
              const allGeneratedSlots = [
                ...generatedSlots.Morning,
                ...generatedSlots.Afternoon,
                ...generatedSlots.Evening
              ];
              const remainingAvailableCount = allGeneratedSlots.filter(s => !bookedSlots.includes(s)).length;
              const barberLeaves = selectedBarber ? approvedLeaves.filter((l: any) => {
                const barberIdStr = selectedBarber.id || selectedBarber._id;
                return l.barberId === barberIdStr || (l.barberId && l.barberId._id === barberIdStr) || l.barberId === barberIdStr;
              }) : [];

              return (
                <div className="space-y-6">
                  <h3 className="text-lg font-headline text-on-surface text-center mb-4">Choose Booking Date & Time</h3>
                  
                  {barberLeaves.length > 0 && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4 text-center">
                      <p className="text-xs text-red-400 font-semibold flex items-center justify-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">info</span>
                        <span>
                          On these days the stylist is not available: {barberLeaves.map((l: any) => {
                            const start = new Date(l.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                            const end = new Date(l.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
                            return start === end ? start : `${start} to ${end}`;
                          }).join(', ')}
                        </span>
                      </p>
                    </div>
                  )}
                  
                  {conflictError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                      <p className="text-xs text-red-400 font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        ⚠️ Sorry! This slot was just booked by another customer. Please choose a different time.
                      </p>
                      {suggestedSlots.length > 0 && (
                        <div className="space-y-1.5 pt-1 border-t border-white/5">
                          <span className="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant block">Suggested Nearest Available Slots:</span>
                          <div className="flex gap-2 flex-wrap">
                            {suggestedSlots.map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setSelectedTimeSlot(slot);
                                  setConflictError(false);
                                  toast.success(`Selected slot: ${slot}`);
                                }}
                                className="py-1.5 px-3 text-[10px] font-bold rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all cursor-pointer"
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Calendar Widget */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Select Date</h4>
                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">date_range</span> 1-Week Booking Window
                        </span>
                      </div>
                      <Calendar
                        selected={selectedDate}
                        onSelect={(date: Date | undefined) => {
                          setSelectedDate(date);
                          setSelectedTimeSlot(''); // clear selected slot on date change
                          setConflictError(false);
                        }}
                        disabledDates={(date: Date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const minBookingDate = new Date(today);
                          minBookingDate.setDate(today.getDate() + 2); // Block today (+0) and tomorrow (+1), open from today+2 onwards

                          const oneWeekLater = new Date(today);
                          oneWeekLater.setDate(today.getDate() + 7);
                          return date < minBookingDate || date >= oneWeekLater;
                        }}
                        leaveDates={(date: Date) => {
                          if (selectedBarber) {
                            const barberIdStr = selectedBarber.id || selectedBarber._id;
                            return approvedLeaves.some((l: any) => {
                              const matchBarber = (l.barberId === barberIdStr || (l.barberId && l.barberId._id === barberIdStr) || l.barberId === barberIdStr);
                              if (!matchBarber) return false;

                              const start = new Date(l.startDate);
                              start.setHours(0, 0, 0, 0);
                              const end = new Date(l.endDate);
                              end.setHours(23, 59, 59, 999);

                              return date >= start && date <= end;
                            });
                          }
                          return false;
                        }}
                        onLeaveClick={() => {
                          toast.error('not available');
                        }}
                      />
                    </div>

                    {/* Time Slots Widget */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs uppercase font-bold tracking-wider text-on-surface-variant">Select Time Slot</h4>
                        {selectedDate && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            {remainingAvailableCount} available slots
                          </span>
                        )}
                      </div>

                      {!selectedDate ? (
                        <div className="h-48 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-center p-4 bg-white/[0.01]">
                          <p className="text-xs text-on-surface-variant">
                            Please select a date on the calendar.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Quick Booking Options */}
                          <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-on-surface-variant block mb-1">⚡ Quick Book</span>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={handleQuickEarliest}
                                className="py-2 px-1 text-[9px] font-bold rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                🔥 Earliest Available
                              </button>
                              <button
                                type="button"
                                onClick={handleQuickRecommended}
                                className="py-2 px-1 text-[9px] font-bold rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                ⭐ Recommended Time
                              </button>
                              <button
                                type="button"
                                onClick={handleQuickSameAsLast}
                                className="py-2 px-1 text-[9px] font-bold rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                🕘 Same Time
                              </button>
                              <button
                                type="button"
                                onClick={handleQuickNextAvailable}
                                className="py-2 px-1 text-[9px] font-bold rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                ⚡ Next Today
                              </button>
                            </div>
                          </div>

                          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {Object.entries(generatedSlots).map(([period, slots]) => {
                              if (slots.length === 0) return null;
                              return (
                                <div key={period} className="space-y-1.5">
                                  <span className="text-[9px] uppercase font-black tracking-widest text-primary/80">
                                    {period === 'Morning' ? '🌅 Morning' : period === 'Afternoon' ? '🌞 Afternoon' : '🌇 Evening'}
                                  </span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {slots.map((slot) => {
                                      const allGenSlots = [...generatedSlots.Morning, ...generatedSlots.Afternoon, ...generatedSlots.Evening];
                                      const isBooked = !isTimeSlotAvailable(slot, totalDuration, bookedSlots, allGenSlots);
                                      const isSel = selectedTimeSlot === slot;
                                      return (
                                        <button
                                          key={slot}
                                          type="button"
                                          disabled={isBooked}
                                          onClick={() => setSelectedTimeSlot(slot)}
                                          className={`py-2 px-1 text-[10px] font-extrabold rounded-lg border text-center transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer ${
                                            isBooked
                                              ? 'border-transparent bg-white/5 text-on-surface-variant/20 line-through cursor-not-allowed'
                                              : isSel
                                              ? 'bg-primary border-primary text-on-primary shadow-[0_0_15px_rgba(242,202,80,0.25)] font-black scale-105'
                                              : 'bg-surface-container border-green-500/20 text-green-400 hover:border-primary/40 hover:bg-green-500/5'
                                          }`}
                                        >
                                          <span>{slot}</span>
                                          {isBooked && (
                                            <span className="text-[7px] uppercase font-bold tracking-widest text-on-surface-variant/40 block ml-0.5">Booked</span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
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
              );
            })()}

            {/* STEP 4: REVIEW & CONFIRM */}
            {step === 4 && selectedServices.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-headline text-on-surface text-center mb-4">Confirm Your Details</h3>
                
                <Card className="border border-white/10 p-6 space-y-4">
                  <div className="flex flex-col gap-3 pb-4 border-b border-white/5">
                    {selectedServices.map(s => (
                      <div key={s.id || s._id} className="flex justify-between items-start">
                        <div>
                          <h4 className="font-headline font-bold text-sm text-on-surface">{s.name}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span> {s.duration} min
                          </p>
                        </div>
                        <span className="text-sm font-headline font-bold text-primary">
                          {formatCurrency(s.price || 0)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-start pt-2 border-t border-white/5 mt-2">
                      <span className="font-bold text-sm text-on-surface">Total Duration</span>
                      <span className="font-bold text-sm text-on-surface">{totalDuration} min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                    <div>
                      <span className="text-on-surface-variant uppercase tracking-wider text-[9px] font-bold block">
                        {(selectedServices.some(s => s.name?.toLowerCase().includes('transplant') || s.category === 'Premium Services'))
                          ? 'Assigned Doctor / Surgeon'
                          : 'Assigned Stylist'}
                      </span>
                      <span className="text-on-surface font-semibold mt-0.5 block flex items-center gap-1">
                        {(selectedServices.some(s => s.name?.toLowerCase().includes('transplant') || s.category === 'Premium Services')) && (
                          <span className="material-symbols-outlined text-xs text-amber-400">medical_services</span>
                        )}
                        {isAnyBarber 
                          ? (selectedServices.some(s => s.name?.toLowerCase().includes('transplant')) ? 'Next Available Hair Transplant Surgeon' : (selectedServices.some(s => s.category === 'Premium Services') ? 'Next Available Doctor' : 'Any Available Stylist'))
                          : selectedBarber?.name}
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

                  {/* Book for a friend / Opposite Gender Booking */}
                  <div className="pt-2">
                    {(() => {
                      const isOppositeGender = user?.gender && selectedServices.some(s => s.gender && user.gender !== s.gender && s.gender !== 'Both');
                      const showForm = isOppositeGender || bookForFriend;
                      
                      return (
                        <>
                          {isOppositeGender ? (
                            <div className="mb-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-[10px] flex items-center gap-2">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                              You are booking a service designated for the opposite gender. Please provide their details.
                            </div>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                              <input
                                type="checkbox"
                                checked={bookForFriend}
                                onChange={(e) => setBookForFriend(e.target.checked)}
                                className="accent-primary"
                              />
                              <span className="text-xs text-on-surface font-semibold">Booking for a friend?</span>
                            </label>
                          )}

                          {showForm && (
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="block text-on-surface-variant uppercase tracking-wider text-[9px] font-bold mb-1.5">
                                  {isOppositeGender ? "Person's Name" : "Friend's Name"}
                                </label>
                                <input
                                  type="text"
                                  value={friendName}
                                  onChange={(e) => setFriendName(e.target.value)}
                                  placeholder="Name"
                                  className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-on-surface-variant uppercase tracking-wider text-[9px] font-bold mb-1.5">
                                  Age
                                </label>
                                <input
                                  type="number"
                                  value={friendAge}
                                  onChange={(e) => setFriendAge(e.target.value)}
                                  placeholder="Age"
                                  min="1"
                                  max="120"
                                  className="w-full bg-surface-container border border-white/5 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
                                  required
                                />
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                      <span>50% Advance (Pay via Razorpay)</span>
                      <span>{formatCurrency(finalAmount * 0.50)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-on-surface-variant/80 pt-1">
                      <span>Remaining Balance (Pay at Salon)</span>
                      <span>{formatCurrency(finalAmount * 0.50)}</span>
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
            {step === 5 && selectedServices.length > 0 && (
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
                  Your appointment has been reserved successfully.
                </h3>
                <p className="text-on-surface-variant text-xs max-w-sm mx-auto leading-relaxed">
                  Your luxury grooming request has been successfully submitted and is currently awaiting salon confirmation.
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
                      setSelectedServices([]);
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
                <span className="text-on-surface font-semibold">{selectedServices.map(s => s.name).join(' + ')}</span>
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
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">50% Advance Payment</span>
              <span className="text-sm font-extrabold text-[#f2ca50]">₹{(finalAmount * 0.50).toFixed(2)}</span>
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
                      Verify & Pay ₹{(finalAmount * 0.50).toFixed(2)}
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
                      Pay ₹{(finalAmount * 0.50).toFixed(2)}
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
