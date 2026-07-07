import * as React from 'react';
import { cn } from "@/shared/utils/cn";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  className?: string;
  disabledDates?: (date: Date) => boolean;
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  className,
  disabledDates
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days: { date: Date; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    days.push({
      date,
      isCurrentMonth: false,
      isDisabled: true
    });
  }

  // Current month days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isDisabled = disabledDates 
      ? disabledDates(date) 
      : date < today; // default disable past dates
    
    days.push({
      date,
      isCurrentMonth: true,
      isDisabled
    });
  }

  // Next month filler days to complete grid (multiples of 7)
  const totalDays = days.length;
  const remainingDays = 42 - totalDays; // 6 rows of 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      isDisabled: true
    });
  }

  const selectDay = (dayDate: Date) => {
    if (onSelect) {
      onSelect(dayDate);
    }
  };

  const isToday = (date: Date) => {
    const t = new Date();
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selected) return false;
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className={cn('p-4 max-w-sm w-full mx-auto glass-panel rounded-2xl border border-white/5 bg-white/[0.01]', className)}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-headline font-bold text-md text-on-surface text-lg">
          {monthNames[month]} {year}
        </h4>
        <div className="flex gap-1">
          <button
            onClick={handlePrevMonth}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={handleNextMonth}
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 text-on-surface-variant hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center gap-1 mb-2">
        {weekDays.map((day) => (
          <span key={day} className="text-[10px] uppercase font-bold text-on-surface-variant/60 tracking-wider py-1">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-body">
        {days.map((day, idx) => {
          const isSel = isSelected(day.date);
          const isTod = isToday(day.date);
          
          return (
            <button
              key={idx}
              onClick={() => !day.isDisabled && selectDay(day.date)}
              disabled={day.isDisabled}
              type="button"
              className={cn(
                'w-9 h-9 sm:w-10 sm:h-10 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer border',
                day.isCurrentMonth ? 'text-on-surface' : 'text-on-surface-variant/20 border-transparent',
                day.isDisabled && 'opacity-20 pointer-events-none border-transparent',
                isTod && !isSel && 'border-primary/40 text-primary',
                !isTod && !isSel && day.isCurrentMonth && 'border-transparent bg-white/[0.01] hover:border-white/20 hover:bg-white/5',
                isSel && 'bg-primary border-primary text-on-primary font-bold shadow-[0_0_15px_rgba(242,202,80,0.35)]'
              )}
            >
              {day.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
Calendar.displayName = 'Calendar';
