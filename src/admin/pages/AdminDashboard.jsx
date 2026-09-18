import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";

const AdminDashboard = () => {
  const { appointments, barbers, orders = [], updateAppointmentStatus } = useApp();

  // Calculations
  const completedApts = appointments.filter(a => a.status === 'Completed');
  const confirmedApts = appointments.filter(a => a.status === 'Confirmed');
  const activeApts = appointments.filter(a => a.status === 'In Progress');

  // Total revenue is the sum of completed appointments
  const totalRevenue = completedApts.reduce((sum, a) => sum + a.price, 0);

  // Today and Tomorrow string calculations for Scheduler
  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const formatDateStr = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = formatDateStr(todayDate);
  const tomorrowStr = formatDateStr(tomorrowDate);

  const todayBookings = appointments.filter(a => a.date === todayStr);

  // Top performers (sort barbers by revenue desc)
  const sortedBarbers = [...barbers].sort((a, b) => b.revenue - a.revenue);

  // Recent Bookings & Scheduler: Most recent bookings, excluding Cancelled and Declined
  const recentBookings = [...appointments]
    .filter(a => a.status !== 'Cancelled' && a.status !== 'Declined')
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 10);

  // Chart State (7 days or 30 days)
  const [chartRange, setChartRange] = React.useState('7');

  // Compute daily revenue dynamically based on actual appointments & orders
  const getChartData = () => {
    const daysCount = parseInt(chartRange, 10);
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const dayLabel = daysCount === 7 
        ? d.toLocaleDateString('en-US', { weekday: 'short' }) 
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Sum completed appointments revenue on this date
      const aptRev = appointments
        .filter(a => a.date === dateStr && a.status === 'Completed')
        .reduce((sum, a) => sum + (a.finalAmount || a.price || 0), 0);

      // Sum delivered/completed product orders revenue on this date
      const orderRev = (orders || [])
        .filter(o => {
          if (!['Delivered', 'Completed'].includes(o.status)) return false;
          const oDate = new Date(o.createdAt).toISOString().split('T')[0];
          return oDate === dateStr;
        })
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      result.push({
        dateStr,
        label: dayLabel,
        revenue: aptRev + orderRev
      });
    }

    const maxRev = Math.max(...result.map(r => r.revenue), 100);
    return { data: result, maxRev };
  };

  const { data: chartData, maxRev: chartMaxRev } = getChartData();

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
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[50%] rounded-full"></div>
          </div>
        </div>

        {/* Active Appointments */}
        <div className="glass-panel p-unit-lg rounded-xl flex flex-col justify-between group hover:border-primary/40 transition-all duration-500">
          <div className="flex justify-between items-start mb-4">
            <div className="p-unit-sm rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary">pending_actions</span>
            </div>
            <span className="text-on-surface-variant text-xs font-semibold">Active</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-widest mb-1">In-Progress &amp; Confirmed</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{activeApts.length + confirmedApts.length}</h3>
          </div>
          <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[90%] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Analytics & Top Performers Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Dynamic Revenue Trend Chart */}
        <div className="lg:col-span-2 glass-panel p-unit-lg rounded-xl min-h-[400px] flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <div>
              <h4 className="text-xl font-headline text-on-surface">Revenue Growth</h4>
              <p className="text-on-surface-variant text-xs">
                {chartRange === '7' ? 'Past 7 Days performance' : 'Past 30 Days performance'}
              </p>
            </div>
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="bg-surface-container border border-white/10 text-xs text-primary rounded-lg focus:ring-1 focus:ring-primary py-1.5 px-3 font-semibold cursor-pointer outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          {/* Dynamic Chart Visualization */}
          <div className="flex-1 flex flex-col justify-end pt-4 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between py-6 pointer-events-none opacity-20">
              <div className="border-t border-white/50 w-full flex items-center justify-end"><span className="text-[9px] text-white/70 -mt-3 pr-1">₹{chartMaxRev}</span></div>
              <div className="border-t border-white/50 w-full flex items-center justify-end"><span className="text-[9px] text-white/70 -mt-3 pr-1">₹{Math.round(chartMaxRev * 0.66)}</span></div>
              <div className="border-t border-white/50 w-full flex items-center justify-end"><span className="text-[9px] text-white/70 -mt-3 pr-1">₹{Math.round(chartMaxRev * 0.33)}</span></div>
              <div className="border-t border-white/50 w-full flex items-center justify-end"><span className="text-[9px] text-white/70 -mt-3 pr-1">₹0</span></div>
            </div>

            {/* Chart Bars */}
            <div className="flex items-end gap-1.5 md:gap-2 h-48 w-full z-10">
              {chartData.map((item, idx) => {
                const heightPct = Math.max(8, Math.round((item.revenue / chartMaxRev) * 100));
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-primary/10 via-primary/30 to-primary/80 rounded-t-md transition-all duration-300 hover:brightness-125 cursor-pointer group relative flex flex-col justify-end items-center"
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-surface-container-high border border-primary/30 text-on-surface px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-30">
                      <p className="text-[10px] text-on-surface-variant font-medium">{item.dateStr}</p>
                      <p className="text-primary font-bold">₹{item.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex gap-1.5 md:gap-2 pt-2 border-t border-white/10 z-10">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex-1 text-center text-[9px] md:text-[10px] font-medium text-on-surface-variant/80 truncate" title={item.label}>
                  {chartRange === '30' && idx % 3 !== 0 ? '' : item.label}
                </div>
              ))}
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
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-unit-lg py-8 text-center text-on-surface-variant text-xs">
                    No active scheduling activity for today or tomorrow.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;
