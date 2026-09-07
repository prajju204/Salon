import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";

const AdminDashboard = () => {
  const { appointments, barbers, updateAppointmentStatus } = useApp();

  // Calculations
  const completedApts = appointments.filter(a => a.status === 'Completed');
  const confirmedApts = appointments.filter(a => a.status === 'Confirmed');
  const activeApts = appointments.filter(a => a.status === 'In Progress');

  // Total revenue is the sum of completed appointments
  const totalRevenue = completedApts.reduce((sum, a) => sum + a.price, 0);

  // Today's bookings
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = appointments.filter(a => a.date === todayStr);

  // Top performers (sort barbers by revenue desc)
  const sortedBarbers = [...barbers].sort((a, b) => b.revenue - a.revenue);

  // Recent bookings (show last 5)
  const recentBookings = [...appointments]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 5);

  return (
    <main className="pt-28 p-margin-mobile md:p-margin-desktop space-y-gutter max-w-container-max mx-auto font-body">
      
      {/* KPI Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Total Revenue */}
        <div className="glass-panel p-unit-lg rounded-xl flex flex-col justify-between group hover:border-primary/40 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-unit-sm rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">payments</span>
            </div>
            <span className="text-primary text-xs font-semibold bg-primary/10 px-2 py-1 rounded">+12.5%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{formatCurrency(totalRevenue, true)}</h3>
          </div>
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[75%] rounded-full"></div>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="glass-panel p-unit-lg rounded-xl flex flex-col justify-between group hover:border-primary/40 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-unit-sm rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
            </div>
            <span className="text-on-surface-variant text-xs font-semibold">Today</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mb-1">Today's Bookings</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{todayBookings.length}</h3>
          </div>
          <p className="mt-4 text-xs text-on-surface-variant">
            {todayBookings.filter(a => a.status === 'Completed').length} completed, {todayBookings.filter(a => a.status === 'Confirmed').length} pending
          </p>
        </div>

        {/* Active Barbers */}
        <div className="glass-panel p-unit-lg rounded-xl flex flex-col justify-between group hover:border-primary/40 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-unit-sm rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex -space-x-2">
              {barbers.slice(0, 3).map(b => (
                <img key={b.id} className="w-6 h-6 rounded-full border border-surface object-cover" src={b.image} alt={b.name} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mb-1">Staff on Floor</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{barbers.length}</h3>
          </div>
          <p className="mt-4 text-xs text-on-surface-variant">Full capacity schedule achieved</p>
        </div>
      </section>

      {/* Analytics & Top Performers Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Revenue Trend Chart Placeholder */}
        <div className="lg:col-span-2 glass-panel p-unit-lg rounded-xl min-h-[400px] flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h4 className="text-xl font-headline text-on-surface">Revenue Growth</h4>
              <p className="text-on-surface-variant text-xs">Weekly performance overview</p>
            </div>
            <select className="bg-surface-container border-none text-xs text-primary rounded-lg focus:ring-1 focus:ring-primary py-1 px-3">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          {/* Mock Chart Visualization */}
          <div className="flex-1 flex items-end gap-2 pb-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none opacity-20">
              <div className="border-t border-white/50 w-full"></div>
              <div className="border-t border-white/50 w-full"></div>
              <div className="border-t border-white/50 w-full"></div>
              <div className="border-t border-white/50 w-full"></div>
            </div>
            {/* Chart Bars */}
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[40%] rounded-t-lg transition-all hover:h-[45%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Mon: ₹120</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[60%] rounded-t-lg transition-all hover:h-[65%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Tue: ₹240</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[55%] rounded-t-lg transition-all hover:h-[60%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Wed: ₹200</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[85%] rounded-t-lg transition-all hover:h-[90%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Thu: ₹485</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[70%] rounded-t-lg transition-all hover:h-[75%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Fri: ₹310</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[95%] rounded-t-lg transition-all hover:h-[100%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Sat: ₹550</div>
            </div>
            <div className="flex-1 bg-gradient-to-t from-primary/5 to-primary/40 h-[45%] rounded-t-lg transition-all hover:h-[50%] cursor-pointer group relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">Sun: ₹180</div>
            </div>
          </div>
        </div>

        {/* Top Performing Barbers */}
        <div className="glass-panel p-unit-lg rounded-xl flex flex-col h-[400px]">
          <h4 className="text-xl font-headline text-on-surface mb-6">Top Performers</h4>
          <div className="space-y-6 flex-1 custom-scrollbar overflow-y-auto pr-2">
            {sortedBarbers.map((barber, index) => (
              <div key={barber.id} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
                    <img className="w-full h-full object-cover" src={barber.image} alt={barber.name} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{barber.name}</p>
                    <div className="flex items-center text-primary">
                      <span className="material-symbols-outlined text-[14px] fill-current">star</span>
                      <span className="text-xs ml-1">{barber.rating}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm font-bold text-on-surface">{formatCurrency(barber.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Bookings Table */}
      <section className="glass-panel rounded-xl overflow-hidden mb-10">
        <div className="p-unit-lg flex justify-between items-center border-b border-white/10">
          <div>
            <h4 className="text-xl font-headline text-on-surface">Recent Bookings &amp; Scheduler</h4>
            <span className="text-xs text-on-surface-variant">Real-time scheduling activity</span>
          </div>
          <Link
            to="/appointments"
            className="text-xs text-primary font-bold uppercase tracking-wider hover:underline flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
          >
            View Complete History <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
              <tr>
                <th className="px-unit-lg py-4 font-semibold">Client</th>
                <th className="px-unit-lg py-4 font-semibold">Service</th>
                <th className="px-unit-lg py-4 font-semibold">Time</th>
                <th className="px-unit-lg py-4 font-semibold">Barber</th>
                <th className="px-unit-lg py-4 font-semibold">Status</th>
                <th className="px-unit-lg py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {recentBookings.map(apt => (
                <tr key={apt.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-unit-lg py-4 text-on-surface">
                    <span className="font-semibold block">{apt.clientName}</span>
                    {apt.notes && (
                      <span className="text-[11px] text-primary/80 block mt-0.5 italic max-w-xs truncate" title={apt.notes}>
                        "{apt.notes}"
                      </span>
                    )}
                  </td>
                  <td className="px-unit-lg py-4 text-on-surface-variant">{apt.serviceName}</td>
                  <td className="px-unit-lg py-4 text-on-surface-variant">{apt.date} at {apt.time}</td>
                  <td className="px-unit-lg py-4 text-on-surface-variant">{apt.barberName}</td>
                  <td className="px-unit-lg py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      apt.status === 'Completed'
                        ? 'bg-green-950/20 text-green-400 border border-green-500/30'
                        : apt.status === 'In Progress'
                        ? 'bg-primary/20 text-primary border border-primary/30 animate-pulse'
                        : apt.status === 'Cancelled'
                        ? 'bg-red-950/20 text-red-400 border border-red-500/30'
                        : 'bg-white/10 text-on-surface-variant'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-unit-lg py-4 text-right space-x-1">
                    {apt.status === 'Confirmed' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(apt._id || apt.id, 'In Progress')}
                          className="bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          Start
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(apt._id || apt.id, 'Cancelled')}
                          className="bg-red-950/20 border border-red-500/30 text-red-400 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {apt.status === 'In Progress' && (
                      <button
                        onClick={() => updateAppointmentStatus(apt._id || apt.id, 'Completed')}
                        className="bg-green-950/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded transition-all cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
