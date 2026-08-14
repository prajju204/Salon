import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '@/shared/context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const StaffAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/staff/attendance/today`, { headers: getAuthHeader() });
      if (res.data.success) {
        setAttendance(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresent = async () => {
    try {
      setMarking(true);
      const res = await axios.post(`${API_URL}/staff/attendance`, {}, { headers: getAuthHeader() });
      if (res.data.success) {
        setAttendance(res.data.data);
        toast.success('Your attendance has been marked successfully!');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark attendance';
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Staff Attendance</h2>
        <p className="text-sm text-on-surface-variant mt-1">Mark and monitor your daily presence.</p>
      </div>

      <div className="max-w-md bg-surface-container rounded-2xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

        <div className="mb-6">
          <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">Today's Date</p>
          <h3 className="text-xl font-headline text-on-surface font-bold">{todayStr}</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : attendance ? (
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl">
              <span className="material-symbols-outlined text-emerald-400 text-3xl">check_circle</span>
              <div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Status: Present</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Checked in at: {new Date(attendance.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <button
              disabled
              className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-on-surface-variant font-bold text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-xs">done</span>
              Already Marked
            </button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
              <span className="material-symbols-outlined text-yellow-500 text-3xl">warning</span>
              <div>
                <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Not Checked In</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Please check in to mark your presence today.</p>
              </div>
            </div>

            <button
              onClick={handleMarkPresent}
              disabled={marking}
              className="w-full py-4 rounded-xl bg-primary text-on-primary hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all font-bold text-xs uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">touch_app</span>
              {marking ? 'Marking Present...' : 'Mark Present'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAttendance;
