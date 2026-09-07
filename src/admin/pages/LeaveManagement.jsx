import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE } from '@/shared/utils/api';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/leaves`, { headers: getAuthHeader() });
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API_BASE}/api/admin/leaves/${id}/status`, { status }, { headers: getAuthHeader() });
      if (res.data.success) {
        toast.success(`Leave request ${status.toLowerCase()} successfully`);
        fetchLeaves();
      }
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const filteredLeaves = leaves.filter(l => l.status === activeTab);

  return (
    <main className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Leave Management</h2>
        <p className="text-sm text-on-surface-variant mt-1">Review, approve, or reject stylist leave requests.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-8 overflow-x-auto pb-1 scrollbar-hide">
        {['Pending', 'Approved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors relative
              ${activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}
            `}
          >
            {tab} Requests
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(212,175,55,0.8)] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-on-surface-variant">Loading leave requests...</p>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-surface-container/20">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3 block">event_busy</span>
          <p className="text-on-surface-variant">No {activeTab.toLowerCase()} leave requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaves.map((leave) => (
            <div
              key={leave._id || leave.id}
              className="glass-panel p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-surface-container to-background flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-surface-container">
                    <img
                      className="w-full h-full object-cover"
                      src={leave.barberId?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw'}
                      alt={leave.barberId?.name}
                    />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold text-on-surface">{leave.barberId?.name || 'Unknown Barber'}</h4>
                    <p className="text-[10px] text-primary uppercase tracking-wider">{leave.barberId?.role || 'Staff'}</p>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-4" />

                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Leave Duration</span>
                    <p className="text-sm font-semibold text-on-surface mt-0.5">
                      {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-on-surface-variant tracking-wider">Reason</span>
                    <p className="text-xs text-on-surface-variant mt-0.5 italic leading-relaxed">
                      "{leave.reason}"
                    </p>
                  </div>
                </div>
              </div>

              {activeTab === 'Pending' && (
                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button
                    onClick={() => handleUpdateStatus(leave._id || leave.id, 'Approved')}
                    className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(leave._id || leave.id, 'Rejected')}
                    className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default LeaveManagement;
