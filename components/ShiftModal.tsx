import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Minus, Plus, Trash2, Clock, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { ShiftData } from '../types';
import { adjustTime, haptic, calcHours } from '../utils';
import { useTranslation } from '../i18n';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftData;
  mode: 'planner' | 'fact';
  onSave: (updatedShift: ShiftData) => void;
  onDelete: () => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shift, mode, onSave, onDelete }) => {
  const { t, locale } = useTranslation();
  const [draft, setDraft] = useState<ShiftData>(shift);

  useEffect(() => {
    if (isOpen) {
      setDraft(shift);
    }
  }, [isOpen, shift.date]);

  const handleSaveAndClose = () => {
    haptic.notification('success');
    onSave(draft);
    onClose();
  };

  const formattedDate = draft.date
    ? format(new Date(draft.date), 'd MMMM yyyy', { locale })
    : draft.date;

  if (!isOpen) return null;

  const isFact = mode === 'fact';
  const displayStart = isFact ? (draft.actualStartTime || draft.startTime) : draft.startTime;
  const displayEnd = isFact ? (draft.actualEndTime || draft.endTime) : draft.endTime;
  const planHours = calcHours(draft.startTime, draft.endTime);

  const updateTime = (field: 'start' | 'end', delta: number) => {
    haptic.impact('soft');
    if (isFact) {
      const current = field === 'start' ? displayStart : displayEnd;
      const newVal = adjustTime(current, delta);
      if (field === 'start') {
        setDraft({ ...draft, actualStartTime: newVal });
      } else {
        setDraft({ ...draft, actualEndTime: newVal });
      }
    } else {
      const current = field === 'start' ? draft.startTime : draft.endTime;
      const newVal = adjustTime(current, delta);
      if (field === 'start') {
        setDraft({ ...draft, startTime: newVal });
      } else {
        setDraft({ ...draft, endTime: newVal });
      }
    }
  };

  const setTime = (field: 'start' | 'end', val: string) => {
    if (isFact) {
      if (field === 'start') setDraft({ ...draft, actualStartTime: val });
      else setDraft({ ...draft, actualEndTime: val });
    } else {
      if (field === 'start') setDraft({ ...draft, startTime: val });
      else setDraft({ ...draft, endTime: val });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-300 opacity-100">
      <div className="absolute inset-0 bg-[#F2F4F8]/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white #1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl border border-white overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform translate-y-0">
        
        <div className="md:hidden w-full flex justify-center pt-4 pb-1">
          <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
        </div>

        <div className="px-8 pt-6 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">{shift.isWorkDay ? t('shift') : t('newShift')}</h2>
            <div className="flex items-center gap-2 mt-1 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
              <CalendarIcon size={14} className="opacity-60 text-[#D40511]" />
              <span>{formattedDate}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 #2d2d2d] text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-10 space-y-6">
          {isFact && shift.isWorkDay && (
            <div className="bg-slate-50 #1a1a1a] p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('plan')}</p>
                <div className="flex items-center gap-2 text-slate-500">
                   <Clock size={14} />
                   <span className="font-bold text-sm">{draft.startTime} &rarr; {draft.endTime}</span>
                   <span className="text-xs">({planHours} {t('hoursShort')})</span>
                </div>
              </div>
              <Lock size={16} className="text-slate-300" />
            </div>
          )}

          {isFact && (
             <div className="flex items-center justify-between bg-slate-50 #1a1a1a] p-4 rounded-2xl border border-slate-100 ">
                 <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${draft.isCompleted ? 'bg-[#D40511]' : 'bg-slate-300'}`} />
                     <span className="font-black text-slate-700 uppercase text-xs tracking-wider">{t('completed')}</span>
                 </div>
                 <button onClick={() => { haptic.impact('medium'); setDraft({ ...draft, isCompleted: !draft.isCompleted }); }} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${draft.isCompleted ? 'bg-[#D40511]' : 'bg-slate-200 #333]'}`}>
                     <div className={`absolute top-1 bottom-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${draft.isCompleted ? 'translate-x-6' : 'translate-x-0'}`} />
                 </button>
             </div>
          )}

          <div className="space-y-4">
             {[
               { field: 'start' as const, label: t('start'), val: displayStart },
               { field: 'end' as const, label: t('end'), val: displayEnd }
             ].map(item => (
                <div key={item.field} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-300" />
                        <label className="font-black text-slate-400 uppercase text-[10px] tracking-widest">{item.label}</label>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 #1a1a1a] p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                         <button
                           onClick={() => updateTime(item.field, -1)}
                           className="w-10 h-10 bg-white #2a2a2a] rounded-xl shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                         >
                            <Minus size={18} />
                         </button>
                         <input
                           type="time"
                           step="60"
                           value={item.val}
                           onChange={(e) => setTime(item.field, e.target.value)}
                           className="bg-transparent font-black text-xl text-slate-800 text-center w-32 outline-none"
                         />
                         <button
                           onClick={() => updateTime(item.field, 1)}
                           className="w-10 h-10 bg-white #2a2a2a] rounded-xl shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition-transform"
                         >
                            <Plus size={18} />
                         </button>
                    </div>
                </div>
             ))}
          </div>

          <div className="flex gap-4 pt-2">
             {shift.isWorkDay && (
                <button
                  onClick={onDelete}
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 #2d2d2d] border border-slate-100 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={24} />
                </button>
             )}
            <button
              onClick={handleSaveAndClose}
              className="flex-1 h-14 rounded-2xl bg-[#D40511] text-white font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-red-500/20 border-b-4 border-red-800"
            >
                {isFact ? t('save') : t('saveToPlan')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;