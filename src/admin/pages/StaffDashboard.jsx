import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useApp } from '@/shared/context/AppContext';
import axios from 'axios';
import { formatCurrency } from '@/shared/utils/format';
import { toast } from 'sonner';

const API_URL = 'http://localhost:5000/api';

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
  const [salaryData, setSalaryData] = useState({ salary: 0, revenue: 0 });

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
      }
    } catch (err) {
      console.error('Failed to fetch salary:', err);
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
        <div className="glass-panel p-8 rounded-2xl border border-white/10 max-w-lg">
          <h3 className="text-xl font-headline text-on-surface mb-6">Salary Details</h3>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Base Salary</p>
              <p className="text-3xl font-headline text-primary">{formatCurrency(salaryData.salary)}</p>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Revenue Generated</p>
              <p className="text-2xl font-headline text-on-surface">{formatCurrency(salaryData.revenue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
