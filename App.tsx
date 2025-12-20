import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

import { ShiftData, DayStats, Rates } from './types';
import { DEFAULT_SHIFT, DEFAULT_RATES } from './constants';
import { calculateEarnings, storage } from './utils';
import StatsPanel from './components/StatsPanel';
import ShiftModal from './components/ShiftModal';
import ToolsModal from './components/ToolsModal';

const App: React.FC = () => {
  // --- State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>('guest');

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error' | 'selection') => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;

    try {
      if (type === 'selection') tg.HapticFeedback.selectionChanged();
      else if (['success', 'warning', 'error'].includes(type)) tg.HapticFeedback.notificationOccurred(type as any);
      else tg.HapticFeedback.impactOccurred(type as any);
    } catch (e) {
      console.warn('Haptic failed');
    }
  };

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    if (tg.isVersionAtLeast?.('6.2')) tg.enableClosingConfirmation();
    if (tg.initDataUnsafe?.user?.id) setUserId(tg.initDataUnsafe.user.id);

    const applyTheme = () => {
      document.documentElement.classList.toggle('dark', tg.colorScheme === 'dark');
    };
    applyTheme();
    tg.onEvent('themeChanged', applyTheme);
    return () => tg.offEvent('themeChanged', applyTheme);
  }, []);

  const shiftsKey = useMemo(() => `shifts_v1_${userId}`, [userId]);
  const ratesKey = useMemo(() => `rates_v1_${userId}`, [userId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [storedShifts, storedRates] = await Promise.all([
          storage.get(shiftsKey),
          storage.get(ratesKey)
        ]);
        if (storedShifts) setShifts(storedShifts);
        if (storedRates) setRates(storedRates);
      } catch (e) {
        console.error("Load failed");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [shiftsKey, ratesKey]);

  useEffect(() => {
    if (!isLoading) {
       const handler = setTimeout(() => {
         storage.set(shiftsKey, shifts);
         storage.set(ratesKey, rates);
       }, 500);
       return () => clearTimeout(handler);
    }
  }, [shifts, rates, shiftsKey, ratesKey, isLoading]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }); 
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Derived active shift for the modal
  const activeShift = useMemo(() => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate);
    const isMonday = dateObj.getDay() === 1;
    return shifts[selectedDate] || {
      id: selectedDate, 
      date: selectedDate, 
      isWorkDay: false,
      startTime: isMonday ? "03:00" : DEFAULT_SHIFT.START, 
      endTime: isMonday ? "11:00" : DEFAULT_SHIFT.END, 
      isCompleted: false
    };
  }, [selectedDate, shifts]);

  const handleDayClick = (date: Date) => {
    triggerHaptic('selection');
    const dateKey = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateKey);
  };

  const currentMonthStats = useMemo((): DayStats => {
    let projected = 0, earned = 0, workDaysCount = 0, completedDaysCount = 0;
    Object.values(shifts).forEach((shift: ShiftData) => {
        if (isSameMonth(new Date(shift.date), currentDate) && shift.isWorkDay) {
            const { totalPay } = calculateEarnings(shift.startTime, shift.endTime, rates);
            projected += totalPay;
            workDaysCount++;
            if (shift.isCompleted) {
                earned += totalPay;
                completedDaysCount++;
            }
        }
    });
    return { projected, earned, workDaysCount, completedDaysCount };
  }, [shifts, currentDate, rates]);

  if (isLoading) return <div className="min-h-screen bg-tg-bg flex items-center justify-center"><Loader2 className="animate-spin text-[#D40511] w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-tg-bg text-tg-text pb-32 transition-colors duration-300 overflow-x-hidden">
      <div className="h-28"></div>
      <header className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 px-4 pt-4 pb-2 ${scrolled ? 'pt-2' : 'pt-6'}`}>
        <div className="bg-white/80 dark:bg-[#242424]/90 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] rounded-[2rem] p-4 flex items-center justify-between border border-white dark:border-white/5">
            <div className="flex items-center gap-3 pl-2">
                <div className="bg-gradient-to-br from-[#D40511] to-[#b0040e] text-white p-2.5 rounded-2xl shadow-lg shadow-red-500/20"><CalendarIcon size={22} /></div>
                <div>
                    <h1 className="font-extrabold text-xl leading-none text-slate-800 dark:text-white tracking-tight">Work<span className="text-[#D40511]">Shift</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 ml-0.5 opacity-60">Scheduler</p>
                </div>
            </div>
            <div className="flex items-center bg-slate-100/50 dark:bg-[#1a1a1a] p-1.5 rounded-2xl shadow-inner border border-slate-50 dark:border-transparent">
                <button onClick={() => { triggerHaptic('light'); setCurrentDate(subMonths(currentDate, 1)); }} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm text-slate-600 dark:text-gray-300 active:scale-95 transition-all"><ChevronLeft size={18} /></button>
                <span className="w-28 text-center text-sm font-bold capitalize truncate text-slate-700 dark:text-gray-200">{format(currentDate, 'LLLL', { locale: uk })}</span>
                <button onClick={() => { triggerHaptic('light'); setCurrentDate(addMonths(currentDate, 1)); }} className="w-9 h-9 flex items-center justify-center bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm text-slate-600 dark:text-gray-300 active:scale-95 transition-all"><ChevronRight size={18} /></button>
            </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-4 space-y-8">
        <div>
          <StatsPanel stats={currentMonthStats} />
        </div>
        <div 
          className="bg-white dark:bg-[#242424] rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white/60 dark:border-white/5 overflow-hidden relative"
        >
            <div className="grid grid-cols-7 pt-4 pb-2 border-b border-slate-100/50 dark:border-white/5">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, i) => (
                    <div key={day} className={`text-center text-[11px] font-extrabold uppercase tracking-[0.1em] ${i >= 5 ? 'text-[#D40511]' : 'text-slate-400'}`}>{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {calendarDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const shift = shifts[dateKey];
                    const isToday = isSameDay(day, new Date());
                    const earnings = shift ? calculateEarnings(shift.startTime, shift.endTime, rates) : null;
                    return (
                        <div key={day.toString()} onClick={() => handleDayClick(day)} className={`relative min-h-[90px] p-2 flex flex-col justify-between border-b border-r border-slate-100/50 dark:border-white/5 last:border-r-0 ${isSameMonth(day, currentDate) ? 'active:bg-slate-50 dark:active:bg-[#2a2a2a]' : 'opacity-30'}`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center ${isToday ? 'bg-[#D40511] text-white shadow-lg shadow-red-500/30' : 'text-slate-600 dark:text-gray-300'}`}>{format(day, 'd')}</span>
                                {shift?.isWorkDay && <div className={`w-2 h-2 rounded-full ${shift.isCompleted ? 'bg-[#D40511]' : 'bg-yellow-400'}`}/>}
                            </div>
                            {shift?.isWorkDay && earnings && (
                                <div className="mt-1 text-right">
                                    <div className="inline-block py-1 px-2 bg-slate-50 dark:bg-[#333] rounded-lg text-[10px] font-black text-slate-700 dark:text-gray-300 border border-slate-100 dark:border-white/5">
                                        {Math.round(earnings.totalPay)}<span className="ml-0.5 opacity-50 font-bold lowercase">zl</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
      </main>
      <div className="fixed bottom-8 right-6 z-20">
        <button onClick={() => { triggerHaptic('rigid'); setIsToolsModalOpen(true); }} className="w-16 h-16 rounded-[2rem] bg-[#222] dark:bg-[#D40511] text-white shadow-xl flex items-center justify-center active:scale-95 transition-all border-4 border-white/10 dark:border-white/5">
            <Wand2 size={24} />
        </button>
      </div>
      
      {activeShift && (
        <ShiftModal 
          isOpen={!!selectedDate} 
          onClose={() => setSelectedDate(null)} 
          shift={activeShift} 
          onSave={(updated) => { 
            setShifts(prev => ({ ...prev, [updated.id]: { ...updated, isWorkDay: true } })); 
          }}
          onDelete={() => { 
            triggerHaptic('warning'); 
            setShifts(prev => { 
              const n = { ...prev }; 
              delete n[activeShift.id]; 
              return n; 
            }); 
            setSelectedDate(null); 
          }}
          rates={rates}
        />
      )}

      <ToolsModal 
        isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)} 
        rates={rates} onUpdateRates={setRates}
        onGenerate={(days) => {
            const newShifts = { ...shifts };
            eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).forEach(day => {
                const dayOfWeek = day.getDay();
                const key = format(day, 'yyyy-MM-dd');
                if (days.includes(dayOfWeek) && !newShifts[key]?.isWorkDay) {
                    newShifts[key] = { id: key, date: key, isWorkDay: true, startTime: dayOfWeek === 1 ? "03:00" : DEFAULT_SHIFT.START, endTime: dayOfWeek === 1 ? "11:00" : DEFAULT_SHIFT.END, isCompleted: false };
                }
            });
            setShifts(newShifts);
            triggerHaptic('success');
        }}
      />
    </div>
  );
};

export default App;