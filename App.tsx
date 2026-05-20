import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Wand2, Loader2 } from 'lucide-react';

import { ShiftData, UserProfile } from './types';
import { DEFAULT_SHIFT } from './constants';
import { storage, compressShifts, decompressShifts, haptic } from './utils';
import ProfileBadge from './components/ProfileBadge';
import ProfileSetup from './components/ProfileSetup';
import ShiftModal from './components/ShiftModal';
import ToolsModal from './components/ToolsModal';

const App: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>('guest');
  const [tgAvatarUrl, setTgAvatarUrl] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // --- Telegram Init ---
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    try {
      if (tg.setHeaderColor) tg.setHeaderColor('#FFCC00');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#FFCC00');
    } catch (e) {}
    if (tg.isVersionAtLeast?.('6.2')) tg.enableClosingConfirmation();
    if (tg.initDataUnsafe?.user?.id) setUserId(tg.initDataUnsafe.user.id);
    if (tg.initDataUnsafe?.user?.photo_url) setTgAvatarUrl(tg.initDataUnsafe.user.photo_url);
  }, []);

  // --- Storage Keys ---
  const shiftsKey = useMemo(() => `shifts_v2_${userId}`, [userId]);
  const profileKey = useMemo(() => `profile_v1_${userId}`, [userId]);
  const photoKey = useMemo(() => `profile_photo_${userId}`, [userId]);

  // --- Load Profile + Shifts ---
  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [storedShifts, storedProfile] = await Promise.all([
          storage.get(shiftsKey),
          storage.get(profileKey),
        ]);
        if (storedShifts) setShifts(decompressShifts(storedShifts));
        if (storedProfile) setProfile(storedProfile as UserProfile);

        // Photo from localStorage (too large for CloudStorage)
        const photo = localStorage.getItem(photoKey);
        if (photo) setProfilePhoto(photo);
      } catch (e) {
        console.error("Load failed");
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [shiftsKey, profileKey, photoKey]);

  // --- Auto-save Shifts ---
  useEffect(() => {
    if (!isLoading) {
       const handler = setTimeout(() => {
         storage.set(shiftsKey, compressShifts(shifts));
       }, 500);
       return () => clearTimeout(handler);
    }
  }, [shifts, shiftsKey, isLoading]);

  // --- Profile Save Handler ---
  const handleProfileSave = async (newProfile: UserProfile, photo: string | null) => {
    setProfile(newProfile);
    setProfilePhoto(photo);
    setIsEditingProfile(false);

    await storage.set(profileKey, newProfile);

    if (photo) {
      localStorage.setItem(photoKey, photo);
    } else {
      localStorage.removeItem(photoKey);
    }
  };

  // --- Calendar ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const calendarKeys = useMemo(() => calendarDays.map(d => format(d, 'yyyy-MM-dd')), [calendarDays]);

  const activeShift = useMemo(() => {
    if (!selectedDate) return null;
    const dateObj = new Date(selectedDate);
    const isMonday = dateObj.getDay() === 1;
    return shifts[selectedDate] || {
      date: selectedDate,
      isWorkDay: false,
      startTime: isMonday ? "03:00" : DEFAULT_SHIFT.START,
      endTime: isMonday ? "11:00" : DEFAULT_SHIFT.END,
      isCompleted: false
    };
  }, [selectedDate, shifts]);

  const handleDayClick = (date: Date) => {
    haptic.selection();
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFCC00] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D40511] w-10 h-10" />
      </div>
    );
  }

  // --- Profile Setup (first launch or editing) ---
  if (!profile || isEditingProfile) {
    return (
      <ProfileSetup
        initialProfile={profile}
        initialPhoto={profilePhoto}
        tgAvatarUrl={tgAvatarUrl}
        onSave={handleProfileSave}
        onCancel={profile ? () => setIsEditingProfile(false) : undefined}
      />
    );
  }

  // --- Main App ---
  return (
    <div className="min-h-screen bg-[#FFCC00] text-black pb-32 overflow-x-hidden font-sans">

      {/* Top Logo */}
      <div
        className="flex justify-center w-full px-6 pb-2 pointer-events-none"
        style={{
          paddingTop: 'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 24px))) + 52px)'
        }}
      >
         <img src="/logo.png" alt="DHL Logo" className="h-[134px] sm:h-[154px] w-auto object-contain drop-shadow-sm" />
      </div>

      <main className="max-w-xl mx-auto px-2 space-y-6">

        {/* Profile Badge */}
        <ProfileBadge
          profile={profile}
          photoUrl={profilePhoto || tgAvatarUrl}
          onEditProfile={() => setIsEditingProfile(true)}
        />

        {/* Calendar Section */}
        <section className="bg-white rounded-[2.5rem] shadow-2xl p-4 mx-2">
            <div className="flex items-center justify-between px-4 mb-4">
                <button onClick={() => { haptic.impact('light'); setCurrentDate(subMonths(currentDate, 1)); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full shadow-sm text-slate-600 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h2 className="font-black text-lg uppercase tracking-widest text-[#D40511]">{format(currentDate, 'LLLL', { locale: uk })}</h2>
                    <span className="text-[10px] font-bold text-slate-400">{format(currentDate, 'yyyy')}</span>
                </div>
                <button onClick={() => { haptic.impact('light'); setCurrentDate(addMonths(currentDate, 1)); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full shadow-sm text-slate-600 active:scale-95 transition-all"><ChevronRight size={20} /></button>
            </div>

            <div className="grid grid-cols-7 pb-2 mb-2 border-b border-slate-100">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((day, i) => (
                    <div key={day} className={`text-center text-[11px] font-black uppercase tracking-widest ${i >= 5 ? 'text-[#D40511]' : 'text-slate-400'}`}>{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2">
                {calendarDays.map((day, index) => {
                    const dateKey = calendarKeys[index];
                    const shift = shifts[dateKey];
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    const prevKey = calendarKeys[index - 1] ?? null;
                    const nextKey = calendarKeys[index + 1] ?? null;
                    const isPrev = shift?.isWorkDay && prevKey && shifts[prevKey]?.isWorkDay;
                    const isNext = shift?.isWorkDay && nextKey && shifts[nextKey]?.isWorkDay;

                    return (
                        <div
                            key={day.toString()}
                            onClick={() => handleDayClick(day)}
                            className={`relative h-[65px] flex flex-col items-center justify-center transition-colors cursor-pointer ${!isCurrentMonth ? 'opacity-20' : ''}`}
                        >
                            {shift?.isWorkDay && isPrev && <div className="absolute -left-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}
                            {shift?.isWorkDay && isNext && <div className="absolute -right-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}

                            <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${
                              shift?.isWorkDay
                                ? (shift.isCompleted ? 'bg-[#FFCC00] text-[#D40511] border-2 border-[#D40511]' : 'bg-[#D40511] text-white border-2 border-white')
                                : 'bg-white text-slate-600 border border-slate-100'
                            }`}>
                                {format(day, 'd')}
                            </div>

                            {shift?.isWorkDay && (
                                <div className="relative z-10 mt-1 flex items-center gap-1">
                                    <span className="text-[9px] font-black text-slate-800">{shift.startTime}</span>
                                    {!shift.isCompleted && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
      </main>

      {/* Tools Button */}
      <div className="fixed bottom-8 right-6 z-20">
        <button onClick={() => { haptic.impact('rigid'); setIsToolsModalOpen(true); }} className="w-14 h-14 rounded-full bg-black text-white shadow-2xl flex items-center justify-center active:scale-95 transition-all border-2 border-[#FFCC00]">
            <Wand2 size={20} />
        </button>
      </div>

      <ShiftModal
        isOpen={!!selectedDate && !!activeShift}
        onClose={() => setSelectedDate(null)}
        shift={activeShift || { date: '', isWorkDay: false, startTime: '06:00', endTime: '14:00', isCompleted: false }}
        onSave={(updated) => {
          setShifts(prev => ({ ...prev, [updated.date]: { ...updated, isWorkDay: true } }));
        }}
        onDelete={() => {
          haptic.notification('warning');
          setShifts(prev => {
            const n = { ...prev };
            if (activeShift) delete n[activeShift.date];
            return n;
          });
          setSelectedDate(null);
        }}
      />

      <ToolsModal
        isOpen={isToolsModalOpen} onClose={() => setIsToolsModalOpen(false)}
        onGenerate={(days) => {
            const newShifts = { ...shifts };
            eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).forEach(day => {
                const dayOfWeek = day.getDay();
                const key = format(day, 'yyyy-MM-dd');
                if (days.includes(dayOfWeek) && !newShifts[key]?.isWorkDay) {
                    newShifts[key] = { date: key, isWorkDay: true, startTime: dayOfWeek === 1 ? "03:00" : DEFAULT_SHIFT.START, endTime: dayOfWeek === 1 ? "11:00" : DEFAULT_SHIFT.END, isCompleted: false };
                }
            });
            setShifts(newShifts);
            haptic.notification('success');
        }}
      />
    </div>
  );
};

export default App;