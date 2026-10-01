import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";

const CustomerDashboard = () => {
  const { user } = useAuth();
  const { appointments, barbers, services } = useApp();
  const navigate = useNavigate();

  // Parse date safely
  const parseSafeDate = (dateStr) => {
    if (!dateStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(`${dateStr}T00:00:00`);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}T00:00:00`);
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
        else return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    }
    return d;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Find upcoming appointment for the logged in user
  const upcomingApt = appointments.find(
    apt => {
      if (apt.clientEmail !== user?.email) return false;
      if (apt.status !== 'Confirmed' && apt.status !== 'In Progress' && apt.status !== 'Rescheduled') return false;
      const aptDate = parseSafeDate(apt.date);
      if (isNaN(aptDate.getTime())) return true;
      return aptDate >= now;
    }
  );

  // Parse date into day and month shorthand
  const getFormattedDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
      return { day, month };
    } catch {
      return { day: '10', month: 'OCT' };
    }
  };

  const aptDate = upcomingApt ? getFormattedDate(upcomingApt.date) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-screen-container-max mx-auto font-body">
      {/* Personal Greeting */}
      <section className="mb-unit-lg">
        <p className="text-on-surface-variant font-label-md text-xs uppercase tracking-widest mb-2">Welcome Back</p>
        <h2 className="font-headline text-3xl md:text-4xl text-on-surface">{getGreeting()}, {user?.name.split(' ')[0]}</h2>
      </section>

      {/* Quick Book Banner */}
      <section className="mb-unit-xl">
        <div 
          onClick={() => navigate('/book-appointment')}
          className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-2xl group cursor-pointer"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{ 
              backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC4bJMxsphQDlLBzSSU1HOb56IuYK1_P2ttamvsz9SE3sjQOeydKGm9EI8vIEJv_39E2SzWT9VFJf9b5gVpO_nAvvmeUlljKsYXeif9IG3lUlWUH2zDLk0mM5pt5f3HwaJoid5FCdhYc8hO01RIMH1KE6sdvb4i63ZivW1vnhBbLXY3WAmnWJjcm-D9xR6NXFLhD5YX14mG05TKjGIhQ7ye6qHAC2KTfQdH2-6XvUbZe2vsKOzOCl9jMOIe8aV7yCTJP_lKrYA_jw')` 
            }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-unit-lg w-full flex flex-col md:flex-row md:items-end md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-headline text-white mb-2">Ready for your next look?</h3>
              <p className="text-on-surface-variant text-sm">Book your favorite service in seconds.</p>
            </div>
            <button className="bg-primary text-on-primary font-label-md text-sm font-semibold px-8 py-4 rounded-lg shadow-xl active:scale-95 transition-all w-fit cursor-pointer">
              Quick Book Now
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Upcoming Appointment Card */}
        <div className="lg:col-span-6 flex flex-col">
          <h4 className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest mb-unit-md">Upcoming Appointment</h4>
          {upcomingApt ? (
            <div className="glass-effect rounded-xl p-unit-lg flex items-center gap-6 relative overflow-hidden flex-grow">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="flex-shrink-0 w-20 h-20 bg-surface-container-highest rounded-xl flex flex-col items-center justify-center border border-white/5 z-10">
                <span className="text-primary font-headline text-2xl font-bold">{aptDate.day}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">{aptDate.month}</span>
              </div>
              <div className="flex-grow z-10">
                <div className="flex items-center gap-2">
                  <h5 className="text-xl font-headline text-on-surface">{upcomingApt.serviceName}</h5>
                  {upcomingApt.status === 'In Progress' && (
                    <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold animate-pulse">In Progress</span>
                  )}
                </div>
                <p className="text-on-surface-variant text-sm mb-2">with {upcomingApt.barberName}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="text-xs font-semibold">{upcomingApt.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span className="text-xs font-semibold">Main Studio</span>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block z-10">
                <button 
                  onClick={() => navigate('/appointments')}
                  className="p-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-primary cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-effect rounded-xl p-unit-lg flex flex-col items-center justify-center text-center py-10 flex-grow">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-3">calendar_today</span>
              <p className="text-on-surface font-semibold mb-1">No upcoming appointments</p>
              <p className="text-on-surface-variant text-xs mb-4">Book your next premium grooming session today.</p>
              <button 
                onClick={() => navigate('/book-appointment')}
                className="px-5 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Schedule Appointment
              </button>
            </div>
          )}
        </div>

        {/* Favorite Barbers */}
        <div className="lg:col-span-6 flex flex-col">
          <h4 className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest mb-unit-md">Favorite Barbers</h4>
          <div className="glass-effect rounded-xl p-unit-lg flex justify-start items-center overflow-x-auto gap-6 custom-scrollbar flex-grow">
            {barbers.map(barber => (
              <div 
                key={barber.id} 
                onClick={() => navigate('/book-appointment', { state: { barberId: barber.id } })}
                className="flex flex-col items-center gap-2 group cursor-pointer min-w-[70px]"
              >
                <div className="w-16 h-16 rounded-full p-0.5 border-2 border-transparent group-hover:border-primary overflow-hidden transition-transform duration-300 group-hover:scale-105">
                  <img className="w-full h-full object-cover rounded-full" src={barber.image} alt={barber.name} />
                </div>
                <span className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors text-center truncate w-full">
                  {barber.name.split(' ')[0]}
                </span>
              </div>
            ))}
            <div 
              onClick={() => navigate('/book-appointment')}
              className="flex flex-col items-center gap-2 group cursor-pointer min-w-[60px]"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-primary">add</span>
              </div>
              <span className="text-[10px] font-semibold text-on-surface-variant">See All</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Services Scroll */}
      <section className="mt-unit-xl">
        <div className="flex justify-between items-center mb-unit-md">
          <h4 className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest">Popular Services</h4>
          <span 
            onClick={() => navigate('/book-appointment')}
            className="text-primary font-semibold text-xs hover:underline cursor-pointer"
          >
            View Menu
          </span>
        </div>
        <div className="flex overflow-x-auto pb-6 gap-unit-md -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 custom-scrollbar scroll-smooth pr-6">
          {services.map(ser => (
            <div 
              key={ser.id} 
              onClick={() => navigate('/book-appointment', { state: { serviceId: ser.id } })}
              className="shrink-0 w-48 glass-effect rounded-xl p-unit-md group cursor-pointer hover:border-primary/50 transition-all active:scale-95"
            >
              <div className="w-full h-32 rounded-lg bg-surface-container-highest mb-3 overflow-hidden">
                <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={ser.image} alt={ser.name} />
              </div>
              <span className="material-symbols-outlined text-primary mb-2">{ser.icon}</span>
              <h6 className="text-on-surface font-headline text-lg mb-1 truncate">{ser.name}</h6>
              <p className="text-primary font-semibold text-xs">From {formatCurrency(ser.price)}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default CustomerDashboard;
