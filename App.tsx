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
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Wand2, Loader2 } from 'lucide-react';

import { ShiftData, DayStats } from './types';
import { DEFAULT_SHIFT } from './constants';
import { calculateEarnings, storage } from './utils';
import StatsPanel from './components/StatsPanel';
import ShiftModal from './components/ShiftModal';
import AutoFillModal from './components/AutoFillModal';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [selectedShift, setSelectedShift] = useState<ShiftData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>('guest');

  // --- Telegram Init & Theme ---
  useEffect(() => {
    const tg = window.Telegram.WebApp;
    
    // Initialize
    tg.ready();
    tg.expand();
    
    // Check version before calling methods not supported in 6.0
    // enableClosingConfirmation is available since 6.2
    if (tg.isVersionAtLeast && tg.isVersionAtLeast('6.2')) {
        tg.enableClosingConfirmation();
    }

    // Get User ID
    if (tg.initDataUnsafe?.user?.id) {
        setUserId(tg.initDataUnsafe.user.id);
    }

    // Handle Theme
    const applyTheme = () => {
      const isDark = tg.colorScheme === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme();
    
    // Listen for theme changes
    tg.onEvent('themeChanged', applyTheme);
    return () => tg.offEvent('themeChanged', applyTheme);
  }, []);

  // --- Storage Key Construction ---
  const storageKey = useMemo(() => `shifts_data_v1_${userId}`, [userId]);

  // --- Load Data ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await storage.get(storageKey);
        if (data) {
          setShifts(data);
        }
      } catch (e) {
        console.error("Failed to load shifts", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [storageKey]);

  // --- Save Data ---
  useEffect(() => {
    // Debounce save or save immediately if not loading
    if (!isLoading && Object.keys(shifts).length > 0) {
       const handler = setTimeout(() => {
         storage.set(storageKey, shifts);
       }, 500);
       return () => clearTimeout(handler);
    }
  }, [shifts, storageKey, isLoading]);

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

  const handleAutoFill = (selectedDayIndices: number[]) => {
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const newShifts = { ...shifts };
    
    let addedCount = 0;
    daysInMonth.forEach(day => {
        const dayOfWeek = day.getDay();
        const dateKey = format(day, 'yyyy-MM-dd');

        // Check if this day of week is selected AND (it's not already a shift OR it is a shift but not a workday)
        if (selectedDayIndices.includes(dayOfWeek) && (!newShifts[dateKey] || !newShifts[dateKey].isWorkDay)) {
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
    
    const tg = window.Telegram?.WebApp;

    // Using Telegram's HapticFeedback (available since 6.1)
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }

    // Using showAlert (available since 6.2)
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.2') && tg.showAlert) {
       tg.showAlert(`Додано ${addedCount} робочих змін`);
    } else {
       // Fallback for older versions (e.g. 6.0)
       alert(`Додано ${addedCount} робочих змін`);
    }
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
    // Dark mode: darker bg, lighter borders
    const cellBaseClass = "relative min-h-[90px] p-2 flex flex-col justify-between transition-all duration-200 select-none border-b border-r border-slate-100/50 dark:border-white/5 last:border-r-0";
    
    const bgClass = !isCurrentMonth 
        ? 'bg-slate-50/30 dark:bg-white/5 text-slate-300 dark:text-gray-600' 
        : 'bg-transparent active:bg-slate-50 dark:active:bg-white/5';

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
                    : 'text-slate-600 dark:text-gray-300'}
            `}>
                {format(day, 'd')}
            </span>
            {shift.isWorkDay && (
                <div className={`
                    w-2.5 h-2.5 rounded-full shadow-sm
                    ${shift.isCompleted ? 'bg-[#D40511]' : 'bg-[#FFCC00] ring-2 ring-white dark:ring-[#2d2d2d]'}
                `}/>
            )}
        </div>

        {shift.isWorkDay && (
            <div className="mt-1 flex justify-end">
                <div className={`
                    flex flex-col items-center justify-center min-w-[2.5rem]
                    py-1.5 px-2 rounded-xl transition-all
                    ${shift.isCompleted 
                        ? 'bg-gradient-to-br from-red-50 to-white dark:from-red-900/20 dark:to-red-900/10 text-[#D40511] dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/30' 
                        : 'bg-white dark:bg-[#333] text-slate-400 dark:text-gray-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-none border border-slate-100 dark:border-white/10'}
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

  if (isLoading) {
      return (
          <div className="min-h-screen bg-tg-bg flex items-center justify-center">
              <Loader2 className="animate-spin text-tg-button w-10 h-10" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text pb-32 transition-colors duration-300">
      {/* Soft Header */}
      <header className={`sticky top-0 z-30 transition-all duration-300 px-4 pt-4 pb-2 ${scrolled ? 'pt-2' : 'pt-6'}`}>
        <div className="bg-white/80 dark:bg-[#242424]/90 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] dark:shadow-black/50 rounded-[2rem] p-4 flex items-center justify-between border border-white dark:border-white/5">
            <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-br from-[#D40511] to-[#b0040e] text-white p-2.5 rounded-2xl shadow-lg shadow-red-500/20">
                    <CalendarIcon size={22} />
                </div>
                <div>
                    <h1 className="font-extrabold text-xl leading-none text-slate-800 dark:text-white">
                        Work<span className="text-[#D40511]">Shift</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 ml-0.5">Scheduler</p>
                </div>
            </div>
            
            {/* Month Navigator - Inset Style */}
            <div className="flex items-center bg-slate-100/50 dark:bg-[#1a1a1a] p-1.5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <button onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#2a2a2a] hover:bg-white dark:hover:bg-[#333] rounded-xl shadow-sm text-slate-600 dark:text-gray-300 transition-all active:scale-95 border border-slate-100 dark:border-white/5">
                    <ChevronLeft size={18} />
                </button>
                <span className="w-28 text-center text-sm font-bold capitalize truncate text-slate-700 dark:text-gray-200">
                    {format(currentDate, 'LLLL', { locale: uk })}
                </span>
                <button onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#2a2a2a] hover:bg-white dark:hover:bg-[#333] rounded-xl shadow-sm text-slate-600 dark:text-gray-300 transition-all active:scale-95 border border-slate-100 dark:border-white/5">
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-8">
        
        <StatsPanel stats={currentMonthStats} />

        {/* Calendar Card - Claymorphism Style */}
        <div className="bg-white dark:bg-[#242424] rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-black/40 border border-white/60 dark:border-white/5 overflow-hidden relative transition-colors duration-300">
            {/* Decorative soft gradient at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-50/50 dark:from-white/5 to-transparent pointer-events-none" />
            
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 relative z-10 pt-4 pb-2 border-b border-slate-100/50 dark:border-white/5">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, i) => (
                    <div key={day} className={`text-center text-[11px] font-extrabold uppercase tracking-wider ${i >= 5 ? 'text-[#D40511]/80 dark:text-red-400' : 'text-slate-400 dark:text-gray-500'}`}>
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
            onClick={() => setIsAutoFillModalOpen(true)}
            className="group flex items-center justify-center w-16 h-16 rounded-[2rem] bg-[#222] dark:bg-[#D40511] text-white shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 border-4 border-white/10 dark:border-white/20"
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
      
      <AutoFillModal 
        isOpen={isAutoFillModalOpen}
        onClose={() => setIsAutoFillModalOpen(false)}
        onGenerate={handleAutoFill}
      />
    </div>
  );
};

export default App;
