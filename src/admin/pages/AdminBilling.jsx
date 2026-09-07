import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { API_BASE } from "@/shared/utils/api";

const API = `${API_BASE}/api/admin`;

const authHeader = () => {
  const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const AdminBilling = () => {
  const navigate = useNavigate();
  const { appointments, services, barbers } = useApp();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create Manual Bill Form State
  const [clientName, setClientName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedBarber, setSelectedBarber] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isSubmittingBill, setIsSubmittingBill] = useState(false);
  const [refundingId, setRefundingId] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/payments`, { headers: authHeader() });
      if (res.data?.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleRefund = async (paymentId) => {
    if (!window.confirm('Are you sure you want to refund this payment?')) return;
    setRefundingId(paymentId);
    try {
      const res = await axios.put(`${API}/payments/${paymentId}/refund`, {}, { headers: authHeader() });
      if (res.data?.success) {
        toast.success('Payment successfully refunded.');
        setPayments(prev => 
          prev.map(p => p._id === paymentId ? { ...p, status: 'Refunded' } : p)
        );
        if (selectedPayment && selectedPayment._id === paymentId) {
          setSelectedPayment(prev => ({ ...prev, status: 'Refunded' }));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to refund payment.');
    } finally {
      setRefundingId(null);
    }
  };

  const handleCreateManualBill = async (e) => {
    e.preventDefault();
    if (!clientName || !billAmount || !paymentMethod) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setIsSubmittingBill(true);
    const serviceObj = services.find(s => s._id === selectedService || s.id === selectedService);
    const serviceName = serviceObj ? serviceObj.name : 'Walk-in service';

    try {
      const res = await axios.post(`${API}/payments`, {
        clientName,
        amount: parseFloat(billAmount),
        method: paymentMethod,
        serviceName
      }, { headers: authHeader() });
      
      if (res.data?.success) {
        toast.success('Manual bill generated successfully!');
        setIsCreateModalOpen(false);
        // Clear form
        setClientName('');
        setSelectedService('');
        setSelectedBarber('');
        setBillAmount('');
        setPaymentMethod('Cash');
        // Refresh list
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create manual bill.');
    } finally {
      setIsSubmittingBill(false);
    }
  };

  // Find related appointment info for display
  const getAppointmentDetails = (appointmentId) => {
    if (!appointmentId) return null;
    const apt = appointments.find(a => a._id === appointmentId || a.id === appointmentId);
    if (!apt) return null;
    
    return {
      serviceName: apt.serviceName || apt.service?.name || 'Grooming service',
      barberName: apt.barberName || apt.barber?.name || 'Barber Stylist',
      date: apt.date,
      time: apt.time
    };
  };

  // Service change updates manual bill amount automatically
  const handleServiceChange = (serviceId) => {
    setSelectedService(serviceId);
    const serviceObj = services.find(s => s._id === serviceId || s.id === serviceId);
    if (serviceObj) {
      setBillAmount(serviceObj.price.toString());
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-printable-area')?.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - LUXE GROOM</title>
            <style>
              body {
                background-color: #ffffff;
                color: #000000;
                font-family: 'Inter', sans-serif;
                padding: 40px;
                margin: 0;
              }
              .text-primary { color: #d4af37 !important; }
              .text-on-surface-variant { color: #555555; }
              .border-b { border-bottom: 1px solid #eeeeee; }
              .border-t { border-top: 1px solid #eeeeee; }
              .border-dashed { border-bottom: 1px dashed #cccccc; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .text-right { text-align: right; }
              .pb-6 { padding-bottom: 24px; }
              .pt-4 { padding-top: 16px; }
              .mt-1 { margin-top: 4px; }
              .mt-2 { margin-top: 8px; }
              .space-y-4 > * + * { margin-top: 16px; }
              .bg-white\\/\\[0\\.01\\] { background-color: #fafafa; }
              .p-5 { padding: 20px; }
              .rounded-2xl { border-radius: 16px; border: 1px solid #eeeeee; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .text-sm { font-size: 14px; }
              .text-xs { font-size: 12px; }
              .font-bold { font-weight: bold; }
              .font-semibold { font-weight: 600; }
              .font-mono { font-family: monospace; }
              .bg-white\\/5 { background: #f0f0f0; border-radius: 8px; padding: 12px; border: 1px solid #e0e0e0; }
              .text-emerald-400 { color: #10b981 !important; }
              .text-red-400 { color: #ef4444 !important; }
              .text-amber-400 { color: #f59e0b !important; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-printable-area');
    if (!element) return;

    setIsGeneratingPDF(true);
    toast.info('Generating PDF invoice...');

    try {
      const opt = {
        margin:       10,
        filename:     `Invoice-${selectedPayment?._id?.substring(0, 8).toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#121414' },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
      toast.success('Invoice PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF Generation Error:', err);
      toast.error('Failed to generate PDF invoice.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Filter and Search logic
  const filteredPayments = payments.filter(p => {
    const matchesStatus = statusFilter === 'All' ? true : p.status === statusFilter;
    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.appointmentId && p.appointmentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          p._id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Analytics Cards calculations
  const totalBillings = payments.reduce((sum, p) => p.status !== 'Refunded' ? sum + p.amount : sum, 0);
  const collectedPayments = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const refundedPayments = payments.filter(p => p.status === 'Refunded').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 md:p-8 lg:p-12 pt-24 md:pt-28 lg:pt-32 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-white/20 transition-all cursor-pointer active:scale-95"
            title="Back to Dashboard"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-3xl font-headline font-bold text-on-surface tracking-tight">Billing & Invoices</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage service bookings, advance payments, and manual client bills.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-on-primary font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-primary/20 transition-all text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Create Bill
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Billings */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Total Billings</p>
            <h3 className="text-2xl font-bold text-on-surface mt-1">{formatCurrency(totalBillings)}</h3>
          </div>
        </div>

        {/* Collected */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Collected</p>
            <h3 className="text-2xl font-bold text-on-surface mt-1">{formatCurrency(collectedPayments)}</h3>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <span className="material-symbols-outlined text-2xl">hourglass_empty</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Pending / Advance</p>
            <h3 className="text-2xl font-bold text-on-surface mt-1">{formatCurrency(pendingPayments)}</h3>
          </div>
        </div>

        {/* Refunded */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined text-2xl">settings_backup_restore</span>
          </div>
          <div>
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Refunded</p>
            <h3 className="text-2xl font-bold text-on-surface mt-1">{formatCurrency(refundedPayments)}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          {['All', 'Paid', 'Pending', 'Refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-on-primary shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-lg">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all"
            placeholder="Search by client name..."
          />
        </div>
      </div>

      {/* Main Billing Table */}
      <div className="glass-panel border border-white/5 bg-white/[0.01] rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Invoice / ID</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Client Name</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Service / Appointment</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Amount</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Method</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Status</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant">Date</th>
                <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-on-surface-variant">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      <p>Loading billing data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-on-surface-variant">
                    No transactions or billing records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const details = getAppointmentDetails(p.appointmentId);
                  const isManual = p.appointmentId && p.appointmentId.startsWith('manual-');
                  
                  return (
                    <tr key={p._id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs text-primary font-semibold">
                        {p._id.substring(p._id.length - 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">
                        {p.clientName}
                      </td>
                      <td className="px-6 py-4">
                        {isManual ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface">Walk-in Service</span>
                            <span className="text-xs text-amber-400/80 font-medium">Direct billing</span>
                          </div>
                        ) : details ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-on-surface">{details.serviceName}</span>
                            <span className="text-xs text-on-surface-variant">with {details.barberName}</span>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic text-xs">No appointment link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded-md text-on-surface-variant font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                          p.status === 'Paid' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : p.status === 'Refunded'
                            ? 'bg-red-500/10 text-red-400 border-red-500/25'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setSelectedPayment(p); setIsInvoiceModalOpen(true); }}
                            className="p-2 rounded-lg bg-white/5 border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                            title="View Invoice"
                          >
                            <span className="material-symbols-outlined text-lg">receipt</span>
                          </button>
                          {p.status === 'Paid' && (
                            <button
                              onClick={() => handleRefund(p._id)}
                              disabled={refundingId === p._id}
                              className="p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-40"
                              title="Process Refund"
                            >
                              {refundingId === p._id ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <span className="material-symbols-outlined text-lg">settings_backup_restore</span>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {isInvoiceModalOpen && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="glass-panel bg-surface-container-high border border-white/10 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <span className="font-headline font-bold text-lg text-on-surface">Invoice Details</span>
              </div>
              <button 
                onClick={() => setIsInvoiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {/* Printable Area */}
              <div id="invoice-printable-area" className="p-8 text-on-surface space-y-8 font-body">
              {/* Receipt Header */}
              <div className="text-center pb-6 border-b border-dashed border-white/10">
                <h2 className="text-2xl font-headline font-bold tracking-widest text-primary">LUXE GROOM</h2>
                <p className="text-xs text-on-surface-variant uppercase mt-1 tracking-wider">Premium Men's Styling & Grooming</p>
                <p className="text-[10px] text-on-surface-variant mt-2 font-mono">123 Luxury Blvd, Indiranagar, Bangalore | +91 98765 43210</p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">Client Details</p>
                  <p className="font-bold text-on-surface mt-1 text-sm">{selectedPayment.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="text-on-surface-variant font-medium uppercase tracking-wider text-[10px]">Invoice Meta</p>
                  <p className="font-semibold text-on-surface mt-1">INV-{selectedPayment._id.substring(0, 10).toUpperCase()}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Item Details */}
              <div className="space-y-4 bg-white/[0.01] border border-white/5 p-5 rounded-2xl">
                <p className="text-[10px] text-on-surface-variant uppercase font-medium tracking-wider border-b border-white/5 pb-2">Line Items</p>
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold text-on-surface">
                      {selectedPayment.appointmentId && selectedPayment.appointmentId.startsWith('manual-') 
                        ? 'Walk-in Service Package' 
                        : getAppointmentDetails(selectedPayment.appointmentId)?.serviceName || 'Luxe Grooming Package'
                      }
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {!selectedPayment.appointmentId?.startsWith('manual-') && getAppointmentDetails(selectedPayment.appointmentId)
                        ? `Date: ${new Date(getAppointmentDetails(selectedPayment.appointmentId).date).toLocaleDateString()} | Stylist: ${getAppointmentDetails(selectedPayment.appointmentId).barberName}`
                        : 'Styling & Grooming Services'
                      }
                    </p>
                  </div>
                  <p className="font-bold text-on-surface">{formatCurrency(selectedPayment.amount)}</p>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="space-y-2 text-xs border-t border-dashed border-white/10 pt-4">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedPayment.amount / 1.18)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Integrated GST (18%)</span>
                  <span>{formatCurrency(selectedPayment.amount - (selectedPayment.amount / 1.18))}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant border-b border-white/5 pb-2">
                  <span>CGST (9%) / SGST (9%)</span>
                  <span>{formatCurrency((selectedPayment.amount - (selectedPayment.amount / 1.18)) / 2)} / {formatCurrency((selectedPayment.amount - (selectedPayment.amount / 1.18)) / 2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2">
                  <span className="text-on-surface">Total Amount Paid</span>
                  <span className="text-primary text-base">{formatCurrency(selectedPayment.amount)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-4 text-[10px] bg-white/5 p-4 rounded-xl border border-white/15">
                <div>
                  <span className="text-on-surface-variant uppercase font-semibold">Payment Status</span>
                  <span className={`block font-bold mt-0.5 uppercase ${
                    selectedPayment.status === 'Paid' ? 'text-emerald-400' : selectedPayment.status === 'Refunded' ? 'text-red-400' : 'text-amber-400'
                  }`}>{selectedPayment.status}</span>
                </div>
                <div className="text-right">
                  <span className="text-on-surface-variant uppercase font-semibold">Method</span>
                  <span className="block font-bold text-on-surface mt-0.5">{selectedPayment.method}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-white/5 flex gap-3 bg-white/[0.01] flex-shrink-0">
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="flex-1 bg-primary hover:bg-primary/95 text-on-primary font-bold py-2.5 rounded-xl cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">download</span>
                    Download PDF
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 bg-white/5 hover:bg-white/10 text-on-surface border border-white/10 font-bold py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-lg">print</span>
                Print Bill
              </button>
              {selectedPayment.status === 'Paid' && (
                <button
                  onClick={() => handleRefund(selectedPayment._id)}
                  disabled={refundingId === selectedPayment._id}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">settings_backup_restore</span>
                  Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Manual Bill Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="glass-panel bg-surface-container-high border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">add_shopping_cart</span>
                <span className="font-headline font-bold text-lg text-on-surface">Generate Manual Bill</span>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateManualBill} className="p-6 space-y-6 text-sm font-body">
              {/* Client Name */}
              <div className="space-y-2">
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Client Name</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all text-sm"
                  placeholder="Enter walk-in client name"
                />
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Select Service</label>
                <select
                  value={selectedService}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm cursor-pointer"
                >
                  <option value="">-- Choose walk-in service (Optional) --</option>
                  {services.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name} (₹{s.price})</option>
                  ))}
                </select>
              </div>

              {/* Barber Selection */}
              <div className="space-y-2">
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Assign Stylist</label>
                <select
                  value={selectedBarber}
                  onChange={(e) => setSelectedBarber(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-on-surface focus:outline-none focus:border-primary/50 transition-all text-sm cursor-pointer"
                >
                  <option value="">-- Assign stylist (Optional) --</option>
                  {barbers.map(b => (
                    <option key={b._id || b.id} value={b._id || b.id}>{b.name} ({b.role})</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Bill Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-xl py-3 px-4 text-on-surface placeholder-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold ml-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash', 'UPI', 'Card'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        paymentMethod === method
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-white/10 text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingBill}
                  className="w-full bg-primary hover:bg-primary/95 text-on-primary font-bold py-3.5 rounded-xl cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSubmittingBill ? (
                    <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Generate Invoice & Pay
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBilling;
