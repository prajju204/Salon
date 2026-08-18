import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const AdminAttendance = () => {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ totalStaff: 0, presentToday: 0, absentToday: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    fetchAttendance();
  }, [filterDate, filterName, filterStatus]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterName) params.name = filterName;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get(`${API_URL}/admin/attendance`, {
        headers: getAuthHeader(),
        params
      });

      if (res.data.success) {
        setRecords(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Staff Attendance Dashboard</h2>
        <p className="text-sm text-on-surface-variant mt-1">Monitor, query, and filter check-in records.</p>
      </div>

      {/* Metrics Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Total Staff */}
        <div className="bg-surface-container rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">groups</span>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total Staff</p>
            <p className="text-2xl font-headline text-on-surface font-black mt-1">{stats.totalStaff}</p>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-surface-container rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Present Today</p>
            <p className="text-2xl font-headline text-emerald-400 font-black mt-1">{stats.presentToday}</p>
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-surface-container rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
            <span className="material-symbols-outlined text-2xl">cancel</span>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Absent Today</p>
            <p className="text-2xl font-headline text-red-400 font-black mt-1">{stats.absentToday}</p>
          </div>
        </div>
      </div>

      {/* Filter and Query bar */}
      <div className="bg-surface-container rounded-2xl p-6 border border-white/5 shadow-xl mb-8 flex flex-col md:flex-row md:items-end gap-4">
        {/* Date Filter */}
        <div className="flex-1">
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Filter by Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface"
          />
        </div>

        {/* Name Filter */}
        <div className="flex-1">
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Staff Name</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              placeholder="Search by name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-background border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary text-on-surface cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-black/10">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Staff Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Check-in Time</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-primary text-2xl mr-2 align-middle">sync</span>
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                          <img
                            src={record.barberId?.image || record.barberId?.profilePic || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw'}
                            alt={record.barberId?.name || 'Staff'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{record.barberId?.name || 'Unknown Staff'}</p>
                          <p className="text-[10px] text-on-surface-variant">{record.barberId?.role || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface">
                      {record.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {record.checkInTime ? (
                        new Date(record.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${record.status === 'Present' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
