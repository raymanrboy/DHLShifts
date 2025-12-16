import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isWeekend,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wand2 } from 'lucide-react';

import { ShiftData, DayStats } from './types';
import { DEFAULT_SHIFT } from './constants';
import { calculateEarnings } from './utils';
import StatsPanel from './components/StatsPanel';
import ShiftModal from './components/ShiftModal';

// Storage Key
const STORAGE_KEY = 'work-shift-calculator-data';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [selectedShift, setSelectedShift] = useState<ShiftData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setShifts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored shifts", e);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.keys(shifts).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
    }
  }, [shifts]);

  // Handle scroll for header effect
  useEffect(() => {
    const handleScroll = () => {
        setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Calendar Data Generation ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); 
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // --- Handlers ---
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const getShiftForDate = (date: Date): ShiftData => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return shifts[dateKey] || {
      id: dateKey,
      date: dateKey,
      isWorkDay: false,
      startTime: DEFAULT_SHIFT.START,
      endTime: DEFAULT_SHIFT.END,
      isCompleted: false
    };
  };

  const handleDayClick = (date: Date) => {
    const existing = getShiftForDate(date);
    if (!existing.isWorkDay) {
        const isMonday = date.getDay() === 1;
        setSelectedShift({ 
          ...existing, 
          isWorkDay: true,
          startTime: isMonday ? "03:00" : DEFAULT_SHIFT.START,
          endTime: isMonday ? "11:00" : DEFAULT_SHIFT.END,
        });
    } else {
        setSelectedShift(existing);
    }
    setIsModalOpen(true);
  };

  const handleSaveShift = (updatedShift: ShiftData) => {
    setShifts(prev => ({
      ...prev,
      [updatedShift.id]: updatedShift
    }));
    setSelectedShift(updatedShift); 
  };

  const handleDeleteShift = () => {
    if (selectedShift) {
        const resetShift = { ...selectedShift, isWorkDay: false, isCompleted: false };
        setShifts(prev => {
            const newState = { ...prev };
            newState[selectedShift.id] = resetShift;
            return newState;
        });
        setIsModalOpen(false);
    }
  };

  const fillStandardMonth = () => {
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const newShifts = { ...shifts };
    
    let addedCount = 0;
    daysInMonth.forEach(day => {
        const dayOfWeek = day.getDay();
        const isWeekDay = dayOfWeek !== 0 && dayOfWeek !== 6;
        const dateKey = format(day, 'yyyy-MM-dd');

        if (isWeekDay && (!newShifts[dateKey] || !newShifts[dateKey].isWorkDay)) {
            const isMonday = dayOfWeek === 1;
            newShifts[dateKey] = {
                id: dateKey,
                date: dateKey,
                isWorkDay: true,
                startTime: isMonday ? "03:00" : DEFAULT_SHIFT.START,
                endTime: isMonday ? "11:00" : DEFAULT_SHIFT.END,
                isCompleted: false
            };
            addedCount++;
        }
    });

    setShifts(newShifts);
    alert(`Додано ${addedCount} робочих змін (Пн-Пт)`);
  };

  const currentMonthStats = useMemo((): DayStats => {
    let projected = 0;
    let earned = 0;
    let workDaysCount = 0;
    let completedDaysCount = 0;

    Object.values(shifts).forEach((shift: ShiftData) => {
        const d = new Date(shift.date);
        if (isSameMonth(d, currentDate) && shift.isWorkDay) {
            const { totalPay } = calculateEarnings(shift.startTime, shift.endTime);
            projected += totalPay;
            workDaysCount++;
            if (shift.isCompleted) {
                earned += totalPay;
                completedDaysCount++;
            }
        }
    });

    return { projected, earned, workDaysCount, completedDaysCount };
  }, [shifts, currentDate]);


  const renderCell = (day: Date) => {
    const shift = getShiftForDate(day);
    const isCurrentMonth = isSameMonth(day, currentDate);
    const isToday = isSameDay(day, new Date());
    const { totalPay } = calculateEarnings(shift.startTime, shift.endTime);

    // Dynamic classes based on state to create depth
    const cellBaseClass = "relative min-h-[90px] p-2 flex flex-col justify-between transition-all duration-200 select-none border-b border-r border-slate-100/50 last:border-r-0";
    const bgClass = !isCurrentMonth ? 'bg-slate-50/30 text-slate-300' : 'bg-transparent active:bg-slate-50';

    return (
      <div 
        key={day.toString()} 
        onClick={() => handleDayClick(day)}
        className={`${cellBaseClass} ${bgClass}`}
      >
        <div className="flex justify-between items-start">
            <span className={`text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center transition-all
                ${isToday 
                    ? 'bg-[#D40511] text-white shadow-[0_4px_10px_rgba(212,5,17,0.4)]' 
                    : 'text-slate-600'}
            `}>
                {format(day, 'd')}
            </span>
            {shift.isWorkDay && (
                <div className={`
                    w-2.5 h-2.5 rounded-full shadow-sm
                    ${shift.isCompleted ? 'bg-[#D40511]' : 'bg-[#FFCC00] ring-2 ring-white'}
                `}/>
            )}
        </div>

        {shift.isWorkDay && (
            <div className="mt-1 flex justify-end">
                <div className={`
                    flex flex-col items-center justify-center min-w-[2.5rem]
                    py-1.5 px-2 rounded-xl transition-all
                    ${shift.isCompleted 
                        ? 'bg-gradient-to-br from-red-50 to-white text-[#D40511] shadow-sm border border-red-100' 
                        : 'bg-white text-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] border border-slate-100'}
                `}>
                    <span className="text-xs md:text-sm font-extrabold leading-none">
                        {Math.round(totalPay)}
                    </span>
                    <span className="text-[9px] font-bold leading-none opacity-60 mt-0.5 uppercase tracking-wide">
                        zl
                    </span>
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F8] text-slate-800 pb-32">
      {/* Soft Header */}
      <header className={`sticky top-0 z-30 transition-all duration-300 px-4 pt-4 pb-2 ${scrolled ? 'pt-2' : 'pt-6'}`}>
        <div className="bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] rounded-[2rem] p-4 flex items-center justify-between border border-white">
            <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-br from-[#D40511] to-[#b0040e] text-white p-2.5 rounded-2xl shadow-lg shadow-red-500/20">
                    <CalendarIcon size={22} />
                </div>
                <div>
                    <h1 className="font-extrabold text-xl leading-none text-slate-800">
                        Work<span className="text-[#D40511]">Shift</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 ml-0.5">Scheduler</p>
                </div>
            </div>
            
            {/* Month Navigator - Inset Style */}
            <div className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                <button onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center bg-white hover:bg-white rounded-xl shadow-sm text-slate-600 transition-all active:scale-95 border border-slate-100">
                    <ChevronLeft size={18} />
                </button>
                <span className="w-28 text-center text-sm font-bold capitalize truncate text-slate-700">
                    {format(currentDate, 'LLLL', { locale: uk })}
                </span>
                <button onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center bg-white hover:bg-white rounded-xl shadow-sm text-slate-600 transition-all active:scale-95 border border-slate-100">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-8">
        
        <StatsPanel stats={currentMonthStats} />

        {/* Calendar Card - Claymorphism Style */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative">
            {/* Decorative soft gradient at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 relative z-10 pt-4 pb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, i) => (
                    <div key={day} className={`text-center text-[11px] font-extrabold uppercase tracking-wider ${i >= 5 ? 'text-[#D40511]/80' : 'text-slate-400'}`}>
                        {day}
                    </div>
                ))}
            </div>
            
            {/* Days Grid */}
            <div className="grid grid-cols-7 relative z-10">
                {calendarDays.map(day => renderCell(day))}
            </div>
        </div>
      </main>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-8 right-6 z-20">
        <button 
            onClick={fillStandardMonth}
            className="group flex items-center justify-center w-16 h-16 rounded-[2rem] bg-[#222] text-white shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white/10"
        >
            <Wand2 size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Modals */}
      {selectedShift && (
        <ShiftModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            shift={selectedShift}
            onSave={handleSaveShift}
            onDelete={handleDeleteShift}
        />
      )}
    </div>
  );
};

export default App;