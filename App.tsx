// @wiki: overview.md (Architecture), technical/dependency-graph.md (State Topology), technical/state-storage.md (Autosave loop)
import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, ClipboardList, CheckCircle2 } from 'lucide-react';

import { ShiftData, UserProfile, Language } from './types';
import { DEFAULT_SHIFT } from './constants';
import { storage, compressShifts, decompressShifts, haptic } from './utils';
import ProfileBadge from './components/ProfileBadge';
import ProfileSetup from './components/ProfileSetup';
import ShiftModal from './components/ShiftModal';
import CalendarGrid from './components/CalendarGrid';
import PlannerActions from './components/PlannerActions';
import HoursSummary from './components/HoursSummary';
import { LanguageProvider, useTranslation } from './i18n';

// We extract the main UI into InnerApp so it can use `useTranslation` hook
const InnerApp: React.FC<{
  profile: UserProfile;
  profilePhoto: string | null;
  tgAvatarUrl: string | null;
  shifts: Record<string, ShiftData>;
  setShifts: React.Dispatch<React.SetStateAction<Record<string, ShiftData>>>;
  setIsEditingProfile: (val: boolean) => void;
}> = ({ profile, profilePhoto, tgAvatarUrl, shifts, setShifts, setIsEditingProfile }) => {
  const { t, locale } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<'planner' | 'fact'>('fact');

  useEffect(() => {
    document.documentElement.lang = locale.code || 'en';
  }, [locale]);

  // --- Calendar ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const calendarKeys = useMemo(() => calendarDays.map(d => format(d, 'yyyy-MM-dd')), [calendarDays]);

  const activeShift = useMemo(() => {
    if (!selectedDate) return null;
    return shifts[selectedDate] || {
      date: selectedDate,
      isWorkDay: false,
      startTime: DEFAULT_SHIFT.START,
      endTime: DEFAULT_SHIFT.END,
      isCompleted: false
    };
  }, [selectedDate, shifts]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
  };

  const handleGenerateMonth = (days: number[], startTime: string, endTime: string) => {
    const newShifts = { ...shifts };
    eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) }).forEach(day => {
        const dayOfWeek = day.getDay();
        const key = format(day, 'yyyy-MM-dd');
        if (days.includes(dayOfWeek) && !newShifts[key]?.isWorkDay) {
            newShifts[key] = { 
              date: key, 
              isWorkDay: true, 
              startTime: dayOfWeek === 1 ? "03:00" : startTime, 
              endTime: dayOfWeek === 1 ? "11:00" : endTime, 
              isCompleted: false 
            };
        }
    });
    setShifts(newShifts);
  };

  const handleClearMonth = () => {
    const newShifts = { ...shifts };
    const monthPrefix = format(currentDate, 'yyyy-MM');
    Object.keys(newShifts).forEach(key => {
       if (key.startsWith(monthPrefix)) {
         delete newShifts[key];
       }
    });
    setShifts(newShifts);
  };

  const daysLabel = t('days') as string[];

  return (
    <div className="min-h-screen bg-[#FFCC00] text-black pb-32 overflow-x-hidden font-sans">
      <div
        className="flex justify-center w-full px-6 pb-2 pointer-events-none"
        style={{
          paddingTop: 'calc(var(--tg-content-safe-area-inset-top, var(--tg-safe-area-inset-top, env(safe-area-inset-top, 24px))) + 52px)'
        }}
      >
         <img src="/logo.webp" alt="DHL Logo" className="h-[134px] sm:h-[154px] w-auto object-contain drop-shadow-sm" />
      </div>

      <main className="max-w-xl mx-auto px-2 space-y-6">
        <ProfileBadge
          profile={profile}
          photoUrl={profilePhoto || tgAvatarUrl}
          onEditProfile={() => setIsEditingProfile(true)}
        />

        <section className="bg-white rounded-[2.5rem] shadow-2xl p-4 mx-2">
            <div className="flex items-center justify-between px-4 mb-4">
                <button onClick={() => { haptic.impact('light'); setCurrentDate(subMonths(currentDate, 1)); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full shadow-sm text-slate-600 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
                <div className="flex flex-col items-center">
                    <h2 className="font-black text-lg uppercase tracking-widest text-[#D40511]">
                      {format(currentDate, 'LLLL', { locale })}
                    </h2>
                    <span className="text-[10px] font-bold text-slate-400">{format(currentDate, 'yyyy')}</span>
                </div>
                <button onClick={() => { haptic.impact('light'); setCurrentDate(addMonths(currentDate, 1)); }} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-full shadow-sm text-slate-600 active:scale-95 transition-all"><ChevronRight size={20} /></button>
            </div>

            <div className="flex bg-slate-50 rounded-2xl p-1 mb-4 shadow-inner">
               <button 
                 onClick={() => { haptic.selection(); setCalendarMode('planner'); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${calendarMode === 'planner' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <ClipboardList size={16} className={calendarMode === 'planner' ? 'text-[#D40511]' : ''} />
                 {t('planner')}
               </button>
               <button 
                 onClick={() => { haptic.selection(); setCalendarMode('fact'); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${calendarMode === 'fact' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <CheckCircle2 size={16} className={calendarMode === 'fact' ? 'text-[#FFCC00]' : ''} />
                 {t('fact')}
               </button>
            </div>

            <div className="grid grid-cols-7 pb-2 mb-2 border-b border-slate-100">
                {[daysLabel[1], daysLabel[2], daysLabel[3], daysLabel[4], daysLabel[5], daysLabel[6], daysLabel[0]].map((day, i) => (
                    <div key={day} className={`text-center text-[11px] font-black uppercase tracking-widest ${i >= 5 ? 'text-[#D40511]' : 'text-slate-400'}`}>{day}</div>
                ))}
            </div>

            <CalendarGrid 
               mode={calendarMode}
               currentDate={currentDate}
               calendarDays={calendarDays}
               calendarKeys={calendarKeys}
               shifts={shifts}
               onDayClick={handleDayClick}
            />
        </section>

        {calendarMode === 'planner' && (
          <PlannerActions onGenerate={handleGenerateMonth} onClear={handleClearMonth} />
        )}

        <HoursSummary shifts={shifts} currentDate={currentDate} />

      </main>

      <ShiftModal
        isOpen={!!selectedDate && !!activeShift}
        onClose={() => setSelectedDate(null)}
        shift={activeShift || { date: '', isWorkDay: false, startTime: DEFAULT_SHIFT.START, endTime: DEFAULT_SHIFT.END, isCompleted: false }}
        mode={calendarMode}
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
    </div>
  );
};

const App: React.FC = () => {
  const [shifts, setShifts] = useState<Record<string, ShiftData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | string>('guest');
  const [tgAvatarUrl, setTgAvatarUrl] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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

  const shiftsKey = useMemo(() => `shifts_v2_${userId}`, [userId]);
  const profileKey = useMemo(() => `profile_v1_${userId}`, [userId]);
  const photoKey = useMemo(() => `profile_photo_${userId}`, [userId]);

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

  useEffect(() => {
    if (!isLoading) {
       const handler = setTimeout(() => {
         storage.set(shiftsKey, compressShifts(shifts));
       }, 500);
       return () => clearTimeout(handler);
    }
  }, [shifts, shiftsKey, isLoading]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFCC00] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D40511] w-10 h-10" />
      </div>
    );
  }

  const currentLanguage: Language = profile?.language || 'EN';

  if (!profile || isEditingProfile) {
    return (
      <LanguageProvider language={currentLanguage}>
        <ProfileSetup
          initialProfile={profile}
          initialPhoto={profilePhoto}
          tgAvatarUrl={tgAvatarUrl}
          onSave={handleProfileSave}
          onCancel={profile ? () => setIsEditingProfile(false) : undefined}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider language={currentLanguage}>
      <InnerApp 
        profile={profile}
        profilePhoto={profilePhoto}
        tgAvatarUrl={tgAvatarUrl}
        shifts={shifts}
        setShifts={setShifts}
        setIsEditingProfile={setIsEditingProfile}
      />
    </LanguageProvider>
  );
};

export default App;