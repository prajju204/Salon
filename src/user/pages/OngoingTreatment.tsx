import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import { useApp } from '@/shared/context/AppContext';
import { formatCurrency } from '@/shared/utils/format';
import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { API_URL } from '@/shared/utils/api';

type Medicine = { name: string; dose?: string; frequency?: string };

type Prescription = {
  medicines: Medicine[];
  instructions: string;
  dosageDetails: string;
  followUpDate: string | null;
  issuedBy: string;
  issuedAt: string;
};

type PaymentInstallment = {
  _id?: string;
  amount: number;
  paymentMode?: string;
  referenceNumber?: string;
  paidOn: string;
  remarks?: string;
  recordedBy?: string;
};

type TreatmentPayment = {
  agreedTotalCost?: number | null;
  paymentStatus: 'Pending' | 'Partial' | 'Settled';
  paymentPlanNotes?: string;
  payments?: PaymentInstallment[];
  totalPaid?: number;
  balanceDue?: number | null;
  recordedBy?: string;
  recordedAt?: string;
  amountReceived?: number;
  paymentMode?: string;
  remarks?: string;
};

type Treatment = {
  _id: string;
  id?: string;
  serviceName: string;
  barberName?: string;
  date: string;
  time?: string;
  status: string;
  price: number;
  finalAmount?: number;
  treatmentNotes?: string;
  diagnosis?: string;
  nextSessionDate?: string;
  sessionNumber?: number;
  totalSessions?: number;
  treatmentUpdatedAt?: string;
  treatmentUpdatedBy?: string;
  prescription?: Prescription;
  treatmentPayment?: TreatmentPayment;
};

const StatusChip = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Completed:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    Confirmed:   'bg-blue-500/15 text-blue-400 border-blue-500/25',
    Pending:     'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
    Cancelled:   'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status] || 'bg-white/5 text-on-surface-variant border-white/10'}`}>
      {status}
    </span>
  );
};

const PaymentStatusChip = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    Settled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    Partial: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    Pending: 'bg-red-500/15 text-red-400 border-red-500/25',
  };
  return (
    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${map[status] || 'bg-white/5 text-on-surface-variant border-white/10'}`}>
      {status}
    </span>
  );
};

const OngoingTreatment: React.FC = () => {
  const { user } = useAuth();
  const { appointments } = useApp();
  const navigate = useNavigate();

  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Razorpay payment state
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [selectedPayTreatment, setSelectedPayTreatment] = useState<Treatment | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payType, setPayType] = useState<'full' | 'custom'>('full');
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [razorpayStep, setRazorpayStep] = useState<'methods' | 'details' | 'processing' | 'success'>('methods');
  const [generatedTxnId, setGeneratedTxnId] = useState<string>('');

  const handleOpenRazorpay = (t: Treatment, balanceDue: number) => {
    setSelectedPayTreatment(t);
    setPayAmount(balanceDue);
    setCustomAmountStr(String(balanceDue));
    setPayType('full');
    setRazorpayMethod('upi');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setRazorpayStep('methods');
    setRazorpayOpen(true);
  };

  const handleExecutePayment = async () => {
    if (!selectedPayTreatment) return;
    const finalAmount = payType === 'full' ? payAmount : Number(customAmountStr);
    if (!finalAmount || finalAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setRazorpayStep('processing');
    const txnId = `TXN-RP-${Math.floor(100000000 + Math.random() * 900000000)}`;
    setGeneratedTxnId(txnId);

    try {
      // Simulate real gateway handshake
      await new Promise(r => setTimeout(r, 1600));

      const res = await axios.post(
        `${API_URL}/auth/my-treatments/${selectedPayTreatment._id || selectedPayTreatment.id}/pay-online`,
        {
          amount: finalAmount,
          paymentMode: razorpayMethod === 'upi' ? 'Online (Razorpay UPI)' : 'Online (Razorpay Card)',
          referenceNumber: txnId,
          remarks: razorpayMethod === 'upi'
            ? `Paid online via UPI (${upiId || 'Instant UPI'})`
            : `Paid online via Card (${cardNumber ? 'ending in ' + cardNumber.slice(-4) : 'Card'})`
        },
        { headers: getAuthHeader() }
      );

      if (res.data.success) {
        setRazorpayStep('success');
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch (_) {}
        toast.success(`Payment of ${formatCurrency(finalAmount)} completed successfully!`);
        await fetchTreatments();
        setTimeout(() => {
          setRazorpayOpen(false);
        }, 1600);
      } else {
        toast.error(res.data.message || 'Payment processing failed');
        setRazorpayStep('details');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error processing online payment');
      setRazorpayStep('details');
    }
  };

  useEffect(() => { fetchTreatments(); }, []);

  const getAuthHeader = () => {
    const token =
      localStorage.getItem('luxe_user_token') ||
      localStorage.getItem('luxe_token') ||
      localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/auth/my-treatments`, { headers: getAuthHeader() });
      if (res.data.success) {
        setTreatments(res.data.data);
        setLoading(false);
        return;
      }
    } catch (_) { /* fallback below */ }

    // Offline/context fallback
    const clinicalKeywords = /transplant|therapy|clinical|surgery|treatment|laser|prp|scalp/i;
    const ctxTreatments = (appointments as any[]).filter(
      (apt) =>
        apt.clientEmail?.toLowerCase() === user?.email?.toLowerCase() &&
        (apt.isDoctor || clinicalKeywords.test(apt.serviceName || '') || clinicalKeywords.test(apt.serviceCategory || ''))
    );
    setTreatments(ctxTreatments);
    setLoading(false);
  };

  const filtered = treatments.filter((t) => {
    if (activeFilter === 'active') return t.status !== 'Completed' && t.status !== 'Cancelled';
    if (activeFilter === 'completed') return t.status === 'Completed';
    return true;
  });

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const fmt = (d?: string | null) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="pt-24 pb-32 px-4 md:px-8 max-w-[1600px] mx-auto font-body min-h-screen">
      {/* Header */}
      <section className="mb-10">
        <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">medical_services</span>
          Clinical Treatment Center
        </p>
        <h2 className="font-headline text-3xl md:text-5xl text-on-surface leading-tight">Ongoing Treatments</h2>
        <p className="text-on-surface-variant text-xs md:text-sm mt-2 max-w-xl">
          Track your clinical treatment progress, prescriptions, doctor notes, and payment details — all in one place.
        </p>
      </section>

      {/* Stats */}
      {!loading && treatments.length > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: treatments.length, icon: 'biotech', color: 'text-primary' },
            { label: 'Active', value: treatments.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length, icon: 'pending_actions', color: 'text-amber-400' },
            { label: 'Completed', value: treatments.filter(t => t.status === 'Completed').length, icon: 'task_alt', color: 'text-emerald-400' },
            { label: 'With Rx', value: treatments.filter(t => t.prescription?.issuedAt).length, icon: 'medication', color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="glass-panel p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`material-symbols-outlined text-[18px] ${s.color}`}>{s.icon}</span>
                <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">{s.label}</span>
              </div>
              <p className={`text-2xl font-headline font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </section>
      )}

      {/* Filter tabs */}
      <section className="flex gap-2 mb-8 border-b border-white/5 pb-5">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeFilter === f ? 'bg-primary/10 text-primary border border-primary/20' : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active / Ongoing' : 'Completed'}
          </button>
        ))}
      </section>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <span className="material-symbols-outlined text-5xl text-primary/30 animate-spin">progress_activity</span>
          <p className="text-on-surface-variant text-sm">Fetching treatment records...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass-panel rounded-2xl p-16 text-center max-w-lg mx-auto border border-white/5 my-8">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10">
            <span className="material-symbols-outlined text-4xl text-primary/40">medical_services</span>
          </div>
          <h3 className="font-headline text-2xl text-on-surface mb-3">No Treatments Found</h3>
          <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
            {activeFilter !== 'all' ? `No ${activeFilter} treatments. Try viewing all.` : "You don't have any clinical treatments yet."}
          </p>
          <Button onClick={() => navigate('/clinical-services')} className="flex items-center gap-2 mx-auto">
            <span className="material-symbols-outlined text-[18px]">diamond</span>
            View Clinical Services
          </Button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <section className="space-y-6">
          {filtered.map(t => {
            const id = t._id || t.id || '';
            const isExpanded = expandedId === id;
            const hasPrescription = !!t.prescription?.issuedAt;
            const hasNotes = !!t.treatmentNotes;
            const hasPayment = !!t.treatmentPayment;
            const progress = t.sessionNumber && t.totalSessions
              ? Math.round((t.sessionNumber / t.totalSessions) * 100) : null;

            return (
              <div key={id} className="glass-panel rounded-2xl border border-white/5 hover:border-primary/15 transition-all duration-300 overflow-hidden">
                {/* Card header */}
                <button className="w-full text-left p-6 cursor-pointer group" onClick={() => toggleExpand(id)}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="material-symbols-outlined text-primary text-[20px]">biotech</span>
                        <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors">{t.serviceName}</h3>
                        <StatusChip status={t.status} />
                        {hasPrescription && (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[11px]">medication</span> Rx
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">person_pin</span>
                          {t.barberName || 'Doctor'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">calendar_month</span>
                          {fmt(t.date)} {t.time && `at ${t.time}`}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                          {t.treatmentPayment?.agreedTotalCost ? (
                            <span>
                              {formatCurrency(t.treatmentPayment.agreedTotalCost)}{' '}
                              <span className="text-[10px] text-emerald-400 font-semibold">(Plan Cost)</span>
                            </span>
                          ) : (
                            formatCurrency(t.finalAmount || t.price)
                          )}
                        </span>
                        {t.nextSessionDate && (
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="material-symbols-outlined text-[14px]">event_upcoming</span>
                            Next: {fmt(t.nextSessionDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="flex gap-1.5" title="Notes · Prescription · Payment">
                        <span className={`w-2 h-2 rounded-full ${hasNotes ? 'bg-amber-400' : 'bg-white/10'}`} />
                        <span className={`w-2 h-2 rounded-full ${hasPrescription ? 'bg-blue-400' : 'bg-white/10'}`} />
                        <span className={`w-2 h-2 rounded-full ${hasPayment ? 'bg-emerald-400' : 'bg-white/10'}`} />
                      </div>
                      <span className={`material-symbols-outlined text-on-surface-variant/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>
                  </div>
                  {progress !== null && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[9px] text-on-surface-variant uppercase font-bold mb-1.5">
                        <span>Session {t.sessionNumber} of {t.totalSessions}</span>
                        <span>{progress}% complete</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-amber-300 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}
                </button>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-white/[0.01]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">

                      {/* Column 1: Doctor Notes */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-400 text-[18px]">edit_note</span>
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Doctor's Notes</h4>
                        </div>
                        {t.diagnosis && (
                          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                            <p className="text-[9px] text-amber-400/80 uppercase font-bold tracking-widest mb-1">Diagnosis</p>
                            <p className="text-sm text-on-surface leading-relaxed">{t.diagnosis}</p>
                          </div>
                        )}
                        {t.treatmentNotes ? (
                          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                            <p className="text-[9px] text-on-surface-variant/70 uppercase font-bold tracking-widest mb-2">Clinical Notes</p>
                            <p className="text-xs text-on-surface-variant leading-relaxed">{t.treatmentNotes}</p>
                            {t.treatmentUpdatedAt && (
                              <p className="text-[9px] text-on-surface-variant/40 mt-2 font-mono">
                                Updated {fmt(t.treatmentUpdatedAt)} by {t.treatmentUpdatedBy || 'Doctor'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant/20">description</span>
                            <p className="text-[10px] text-on-surface-variant/50">No notes yet from your doctor.</p>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Prescription */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-blue-400 text-[18px]">medication</span>
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Prescription</h4>
                        </div>
                        {hasPrescription && t.prescription ? (
                          <>
                            {t.prescription.medicines.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-[9px] text-on-surface-variant/70 uppercase font-bold tracking-widest">Medicines</p>
                                {t.prescription.medicines.map((m, i) => (
                                  <div key={i} className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg p-2.5">
                                    <span className="material-symbols-outlined text-blue-400 text-[15px] mt-0.5">pill</span>
                                    <div>
                                      <p className="text-xs font-bold text-on-surface">{m.name}</p>
                                      {(m.dose || m.frequency) && (
                                        <p className="text-[10px] text-on-surface-variant mt-0.5">{[m.dose, m.frequency].filter(Boolean).join(' · ')}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            {t.prescription.instructions && (
                              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                <p className="text-[9px] text-on-surface-variant/70 uppercase font-bold tracking-widest mb-1">Instructions</p>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{t.prescription.instructions}</p>
                              </div>
                            )}
                            {t.prescription.followUpDate && (
                              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5">
                                <span className="material-symbols-outlined text-emerald-400 text-[15px]">event_upcoming</span>
                                <div>
                                  <p className="text-[9px] text-emerald-400/80 uppercase font-bold tracking-widest">Follow-up Date</p>
                                  <p className="text-xs text-on-surface font-bold">{fmt(t.prescription.followUpDate)}</p>
                                </div>
                              </div>
                            )}
                            <p className="text-[9px] text-on-surface-variant/40 font-mono">
                              Issued by {t.prescription.issuedBy} on {fmt(t.prescription.issuedAt)}
                            </p>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                            <span className="material-symbols-outlined text-2xl text-on-surface-variant/20">medication_liquid</span>
                            <p className="text-[10px] text-on-surface-variant/50">No prescription issued yet.</p>
                          </div>
                        )}
                      </div>

                      {/* Column 3: Payment */}
                      {(() => {
                        const payObj = t.treatmentPayment;
                        const agreedCost = payObj?.agreedTotalCost || t.finalAmount || t.price || 0;
                        const totalPaid = payObj?.totalPaid ?? payObj?.amountReceived ?? 0;
                        const balanceDue = payObj?.balanceDue ?? Math.max(0, agreedCost - totalPaid);
                        const status = payObj?.paymentStatus || (totalPaid >= agreedCost && agreedCost > 0 ? 'Settled' : totalPaid > 0 ? 'Partial' : 'Pending');
                        const percentPaid = agreedCost > 0 ? Math.min(100, Math.round((totalPaid / agreedCost) * 100)) : 0;
                        const installments = payObj?.payments && payObj.payments.length > 0
                          ? payObj.payments
                          : (payObj?.amountReceived ? [{
                              amount: payObj.amountReceived,
                              paymentMode: payObj.paymentMode || 'Cash',
                              paidOn: payObj.recordedAt || '',
                              remarks: payObj.remarks || '',
                              recordedBy: payObj.recordedBy || 'Staff'
                            }] : []);

                        return (
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400 text-[18px]">account_balance_wallet</span>
                                <h4 className="text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">Payment Status</h4>
                              </div>
                              <PaymentStatusChip status={status} />
                            </div>

                            {/* Agreed Treatment Cost Card */}
                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-1">
                              <div className="flex justify-between items-baseline">
                                <p className="text-[9px] text-on-surface-variant/70 uppercase font-bold tracking-widest">
                                  {payObj?.agreedTotalCost ? 'Agreed Treatment Plan' : 'Standard Service Amount'}
                                </p>
                                {payObj?.agreedTotalCost && (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                                    Doctor Quoted
                                  </span>
                                )}
                              </div>
                              <p className="text-2xl font-headline font-bold text-primary">{formatCurrency(agreedCost)}</p>
                              {payObj?.agreedTotalCost && (t.finalAmount || t.price) !== payObj.agreedTotalCost && (
                                <p className="text-[10px] text-on-surface-variant/60">
                                  Base catalogue price: {formatCurrency(t.finalAmount || t.price)}
                                </p>
                              )}
                            </div>

                            {/* Payment Plan Notes (if doctor noted plan terms) */}
                            {payObj?.paymentPlanNotes && (
                              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-2.5">
                                <p className="text-[9px] text-amber-400/80 uppercase font-bold tracking-widest mb-0.5">Payment Terms</p>
                                <p className="text-xs text-on-surface-variant leading-relaxed">{payObj.paymentPlanNotes}</p>
                              </div>
                            )}

                            {/* Paid vs Due Summary with Bar */}
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-2.5">
                                  <span className="text-[9px] text-emerald-400/80 uppercase font-bold tracking-wider block mb-0.5">Total Paid</span>
                                  <span className="text-base font-bold text-emerald-400">{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-2.5">
                                  <span className="text-[9px] text-amber-400/80 uppercase font-bold tracking-wider block mb-0.5">Balance Due</span>
                                  <span className="text-base font-bold text-amber-400">{formatCurrency(balanceDue)}</span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-on-surface-variant font-bold">
                                  <span>Paid Progress</span>
                                  <span>{percentPaid}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                    style={{ width: `${percentPaid}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Online Razorpay Action */}
                            {balanceDue > 0 ? (
                              <Button
                                onClick={() => handleOpenRazorpay(t, balanceDue)}
                                className="w-full text-xs font-bold gap-2 bg-gradient-to-r from-[#1f73e8] to-[#155fc4] hover:from-[#155fc4] hover:to-[#0d47a1] text-white shadow-lg shadow-blue-500/20 py-2.5 rounded-xl border border-blue-400/30 transition-all hover:scale-[1.01] cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">credit_card</span>
                                Pay via Razorpay ({formatCurrency(balanceDue)} Due)
                              </Button>
                            ) : (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                                <span className="material-symbols-outlined text-[16px]">verified</span>
                                All treatment dues settled!
                              </div>
                            )}

                            {/* Installments History */}
                            <div className="space-y-2 pt-1 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-widest">
                                  Payment Records ({installments.length})
                                </span>
                              </div>

                              {installments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-4 text-center gap-1.5 bg-white/[0.01] rounded-xl border border-white/5">
                                  <span className="material-symbols-outlined text-xl text-on-surface-variant/30">receipt_long</span>
                                  <p className="text-[10px] text-on-surface-variant/60">No cash or digital payments recorded yet.</p>
                                  <p className="text-[9px] text-on-surface-variant/40">Payments recorded by clinic staff will appear here.</p>
                                </div>
                              ) : (
                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                  {installments.map((inst, idx) => (
                                    <div key={inst._id || idx} className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-xs">
                                      <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="material-symbols-outlined text-emerald-400 text-[14px]">
                                            {inst.paymentMode?.toLowerCase().includes('cash') ? 'payments' :
                                             inst.paymentMode?.toLowerCase().includes('card') ? 'credit_card' : 'account_balance'}
                                          </span>
                                          <span className="font-bold text-emerald-400">+{formatCurrency(inst.amount)}</span>
                                        </div>
                                        <span className="text-[9px] bg-white/5 text-on-surface px-1.5 py-0.5 rounded font-mono">
                                          {inst.paymentMode || 'Cash'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-[10px] text-on-surface-variant/60">
                                        <span>{fmt(inst.paidOn)}</span>
                                        {inst.referenceNumber && (
                                          <span className="font-mono text-primary/80">Ref: #{inst.referenceNumber}</span>
                                        )}
                                      </div>
                                      {inst.remarks && (
                                        <p className="text-[10px] text-on-surface-variant/80 italic mt-1 bg-white/[0.01] p-1 rounded">
                                          "{inst.remarks}"
                                        </p>
                                      )}
                                      {inst.recordedBy && (
                                        <p className="text-[8px] text-on-surface-variant/40 mt-1 font-mono">
                                          Received by {inst.recordedBy}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Button variant="outline" size="sm" className="w-full text-xs mt-2" onClick={() => navigate('/wallet')}>
                              <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                              View Salon Wallet
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {!loading && (
        <div className="mt-10 text-center">
          <Button variant="outline" onClick={() => navigate('/clinical-services')} className="gap-2">
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Book Another Clinical Service
          </Button>
        </div>
      )}

      {/* ── RAZORPAY PAYMENT GATEWAY DIALOG ── */}
      <Dialog open={razorpayOpen} onOpenChange={setRazorpayOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-[#0d1525] text-white rounded-2xl border border-white/15 shadow-2xl">
          {/* Header */}
          <div className="bg-[#090e1a] p-4 flex justify-between items-center border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-[#1f73e8] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-1 shadow-sm">
                <span className="material-symbols-outlined text-[12px]">payments</span>
                Razorpay
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-300 block leading-tight">LUXE CLINICAL PAY</span>
                <span className="text-[9px] text-slate-500 font-mono truncate max-w-[150px] block">
                  {selectedPayTreatment?.serviceName || 'Clinical Treatment'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold block">Amount to Pay</span>
              <span className="text-sm font-extrabold text-[#f2ca50]">
                {formatCurrency(payType === 'full' ? payAmount : Number(customAmountStr) || 0)}
              </span>
            </div>
          </div>

          <div className="p-5 min-h-[250px] flex flex-col justify-between">
            {/* Step: Methods */}
            {razorpayStep === 'methods' && (
              <div className="space-y-4">
                {/* Amount type toggle */}
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5 space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                    Choose Payment Option
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setPayType('full'); setCustomAmountStr(String(payAmount)); }}
                      className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                        payType === 'full'
                          ? 'bg-[#1f73e8]/20 border-[#1f73e8] text-white'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase block text-slate-400">Full Balance</span>
                      <span className="text-xs font-extrabold text-emerald-400">{formatCurrency(payAmount)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayType('custom')}
                      className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                        payType === 'custom'
                          ? 'bg-[#1f73e8]/20 border-[#1f73e8] text-white'
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase block text-slate-400">Custom Installment</span>
                      <span className="text-xs font-extrabold text-amber-400">Enter Amount</span>
                    </button>
                  </div>

                  {payType === 'custom' && (
                    <div className="pt-2">
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          min={1}
                          max={payAmount}
                          value={customAmountStr}
                          onChange={(e) => setCustomAmountStr(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full bg-[#090e1a] border border-white/10 rounded-lg pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8]"
                        />
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        Max balance due: {formatCurrency(payAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Gateway Methods */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 block">
                    Select Gateway Method
                  </span>
                  <button
                    onClick={() => {
                      setRazorpayMethod('upi');
                      setRazorpayStep('details');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#1f73e8]/60 hover:bg-white/[0.08] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1f73e8] text-[22px]">qr_code_2</span>
                      <div>
                        <span className="text-xs font-bold block text-white">UPI / Google Pay / PhonePe / Paytm</span>
                        <span className="text-[9px] text-slate-400">Instant approval via any UPI app</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>

                  <button
                    onClick={() => {
                      setRazorpayMethod('card');
                      setRazorpayStep('details');
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#1f73e8]/60 hover:bg-white/[0.08] transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#1f73e8] text-[22px]">credit_card</span>
                      <div>
                        <span className="text-xs font-bold block text-white">Credit & Debit Cards</span>
                        <span className="text-[9px] text-slate-400">Visa, MasterCard, RuPay, Maestro</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step: Details */}
            {razorpayStep === 'details' && (
              <div className="space-y-4">
                <button
                  onClick={() => setRazorpayStep('methods')}
                  className="text-[10px] text-[#1f73e8] uppercase font-extrabold tracking-wider flex items-center gap-1 hover:opacity-85 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span> Change Payment Method
                </button>

                {razorpayMethod === 'upi' ? (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                      Enter UPI ID / VPA
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-[#090e1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600 font-mono"
                    />

                    {/* Quick UPI Handle suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['@okhdfcbank', '@okaxis', '@ybl', '@paytm'].map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            const prefix = upiId.includes('@') ? upiId.split('@')[0] : upiId || 'patient';
                            setUpiId(prefix + h);
                          }}
                          className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300 hover:bg-white/10 cursor-pointer font-mono"
                        >
                          {h}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={!upiId.includes('@')}
                      onClick={handleExecutePayment}
                      className="w-full py-2.5 bg-[#1f73e8] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:bg-[#155fc4] transition-all cursor-pointer shadow-md mt-2"
                    >
                      Verify & Pay {formatCurrency(payType === 'full' ? payAmount : Number(customAmountStr) || 0)}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                      Enter Card Details
                    </span>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="Card Number (e.g. 4111 2222 3333 4444)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-[#090e1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-[#090e1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600 font-mono"
                      />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="bg-[#090e1a] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#1f73e8] placeholder:text-slate-600 font-mono"
                      />
                    </div>
                    <button
                      disabled={cardNumber.length < 12 || cardExpiry.length < 4 || cardCvv.length < 3}
                      onClick={handleExecutePayment}
                      className="w-full py-2.5 bg-[#1f73e8] disabled:opacity-40 text-white rounded-xl text-xs font-bold hover:bg-[#155fc4] transition-all cursor-pointer shadow-md mt-2"
                    >
                      Pay {formatCurrency(payType === 'full' ? payAmount : Number(customAmountStr) || 0)}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step: Processing */}
            {razorpayStep === 'processing' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <span className="animate-spin material-symbols-outlined text-4xl text-[#1f73e8]">progress_activity</span>
                <span className="text-xs font-bold text-white">Connecting with Razorpay Secure Gateway...</span>
                <span className="text-[10px] text-slate-400">Please do not refresh or close this modal</span>
              </div>
            )}

            {/* Step: Success */}
            {razorpayStep === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <span className="material-symbols-outlined text-5xl text-emerald-400 animate-bounce">check_circle</span>
                <span className="text-sm font-extrabold text-white">Payment Received!</span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {generatedTxnId}
                </span>
                <span className="text-[9px] text-emerald-400/90 font-semibold">
                  Treatment ledger updated on doctor's dashboard.
                </span>
              </div>
            )}

            {/* Razorpay Trust Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center gap-1.5 text-[8px] text-slate-400 font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[11px] text-emerald-400">lock</span>
              Secured by Razorpay · 256-Bit SSL Encryption
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default OngoingTreatment;
