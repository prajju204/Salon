import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useApp } from '@/shared/context/AppContext';
import axios from 'axios';
import { formatCurrency } from '@/shared/utils/format';
import { toast } from 'sonner';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const StaffDashboard = () => {
  const { user } = useAuth();
  const { appointments, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState('appointments');
  
  // Leaves
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loadingLeave, setLoadingLeave] = useState(false);
  
  // Salary
  const [salaryData, setSalaryData] = useState({ salary: 0, revenue: 0, paidAmount: 0, payouts: [] });
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  useEffect(() => {
    refreshData();
    fetchLeaves();
    fetchSalary();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/leave`, { headers: getAuthHeader() });
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    }
  };

  const fetchSalary = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/salary`, { headers: getAuthHeader() });
      if (res.data.success) {
        setSalaryData(res.data.data);
        setUpiId(res.data.data.upiId || '');
        setBankAccountNumber(res.data.data.bankAccountNumber || '');
      }
    } catch (err) {
      console.error('Failed to fetch salary:', err);
    }
  };

  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    setIsSavingPayment(true);
    try {
      const res = await axios.put(`${API_URL}/staff/payment-details`, { upiId, bankAccountNumber }, { headers: getAuthHeader() });
      if (res.data.success) {
        toast.success('Payment details updated successfully');
        fetchSalary();
      }
    } catch (err) {
      toast.error('Failed to update payment details');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    setLoadingLeave(true);
    try {
      await axios.post(`${API_URL}/staff/leave`, { startDate, endDate, reason }, { headers: getAuthHeader() });
      toast.success('Leave requested successfully');
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to request leave');
    } finally {
      setLoadingLeave(false);
    }
  };

  const myAppointments = appointments.filter(a => a.barberId === user?.id || a.barberName === user?.name || a.barberName === user?.username);

  return (
    <div className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Welcome, {user?.name}</h2>
        <p className="text-sm text-on-surface-variant mt-1">Staff Portal - Manage your schedule and details.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {['appointments', 'leave', 'salary'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors relative
              ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}
            `}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(212,175,55,0.8)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <h3 className="text-xl font-headline text-on-surface">Your Appointments</h3>
          {myAppointments.length === 0 ? (
            <p className="text-on-surface-variant">No appointments assigned to you yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAppointments.map(apt => (
                <div key={apt.id || apt._id} className="bg-surface-container rounded-2xl p-6 border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-headline text-lg text-on-surface">{apt.serviceName}</h4>
                      <p className="text-sm text-on-surface-variant">{apt.date} at {apt.time}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      apt.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    <p><strong className="text-on-surface">Client:</strong> {apt.clientName}</p>
                    <p><strong className="text-on-surface">Price:</strong> {formatCurrency(apt.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-headline text-on-surface mb-6">Request Leave</h3>
            <form onSubmit={submitLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" />
                </div>
                <div>
                  <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Reason</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows="3" className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"></textarea>
              </div>
              <button type="submit" disabled={loadingLeave} className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:bg-primary/90 transition-colors">
                {loadingLeave ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
          
          <div>
            <h3 className="text-xl font-headline text-on-surface mb-6">Leave History</h3>
            {leaves.length === 0 ? (
              <p className="text-on-surface-variant">No leave requests found.</p>
            ) : (
              <div className="space-y-4">
                {leaves.map(l => (
                  <div key={l._id} className="bg-surface-container rounded-xl p-4 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{l.reason}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      l.status === 'Approved' ? 'text-emerald-400 bg-emerald-500/10' :
                      l.status === 'Rejected' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Earnings & Payout History */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-headline text-on-surface mb-6">Salary &amp; Earnings Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Base Salary</p>
                  <p className="text-xl font-headline text-on-surface">{formatCurrency(salaryData.salary)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Revenue</p>
                  <p className="text-xl font-headline text-on-surface">{formatCurrency(salaryData.revenue)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Paid</p>
                  <p className="text-xl font-headline text-green-400 font-bold">{formatCurrency(salaryData.paidAmount || 0)}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Pending Balance</p>
                  <p className="text-xl font-headline text-primary font-bold">{formatCurrency(Math.max(0, salaryData.revenue - (salaryData.paidAmount || 0)))}</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-headline text-on-surface mb-4">Salary Payout History</h3>
              {(!salaryData.payouts || salaryData.payouts.length === 0) ? (
                <p className="text-xs text-on-surface-variant">No payouts processed yet by the administrator.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-[9px] text-on-surface-variant uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Date</th>
                        <th className="px-4 py-2 font-semibold">Amount Paid</th>
                        <th className="px-4 py-2 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {salaryData.payouts.map((p, index) => (
                        <tr key={index} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">
                            {new Date(p.date).toLocaleDateString()} at {new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-block px-2 py-0.5 rounded bg-green-950/20 border border-green-500/30 text-green-400 font-bold uppercase text-[9px]">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Payment Setup Info Form */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 h-fit">
            <h3 className="text-xl font-headline text-on-surface mb-2">Payment Details</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Enter your UPI ID or Bank account details. The admin will use this information to process your payouts.
            </p>
            <form onSubmit={submitPaymentDetails} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                  placeholder="e.g. name@upi"
                />
              </div>

              <div className="flex items-center my-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-3 text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Bank Account Number / IFSC</label>
                <textarea
                  rows="2"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                  placeholder="e.g. Account: 1234567890, IFSC: HDFC0001234"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingPayment}
                className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSavingPayment ? 'Saving details...' : 'Save Payment Info'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
