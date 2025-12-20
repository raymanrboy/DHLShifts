import React from 'react';
import { X, Calendar as CalendarIcon, Minus, Plus, Trash2, Sun, Moon } from 'lucide-react';
import { ShiftData, Rates } from '../types';
import { adjustTime, calculateEarnings } from '../utils';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftData;
  onSave: (updatedShift: ShiftData) => void;
  onDelete: () => void;
  rates: Rates;
  tilt?: { x: number, y: number };
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shift, onSave, onDelete, rates, tilt = { x: 0, y: 0 } }) => {
  if (!isOpen) return null;

  const triggerHaptic = (type: 'soft' | 'medium' | 'selection' | 'success') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      if (type === 'selection') tg.HapticFeedback.selectionChanged();
      else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
      else tg.HapticFeedback.impactOccurred(type as any);
    }
  };

  const earnings = calculateEarnings(shift.startTime, shift.endTime, rates);

  const handleSaveAndClose = () => {
    triggerHaptic('success');
    onSave(shift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose}/>
      <div 
        className="pointer-events-auto relative bg-white dark:bg-[#1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-black/60 border border-white dark:border-white/5 transition-all duration-300 overflow-hidden"
        style={{ transform: `translate3d(${tilt.x * 8}px, ${tilt.y * 8}px, 0)` }}
      >
        <div className="md:hidden w-full flex justify-center pt-4 pb-1"><div className="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full"></div></div>
        
        <div className="px-8 pt-6 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-[#1a1c24] dark:text-white tracking-tight">{shift.isWorkDay ? 'Зміна' : 'Нова зміна'}</h2>
            <div className="flex items-center gap-2 mt-1 text-slate-400 font-medium">
              <CalendarIcon size={16} className="opacity-60" />
              <span>{shift.date}</span>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-[#2d2d2d] text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 pb-10 space-y-8">
          {shift.isWorkDay && (
            <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-gray-300 text-lg">Зміна відпрацьована?</span>
                <button onClick={() => { triggerHaptic('medium'); onSave({ ...shift, isCompleted: !shift.isCompleted }); }} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${shift.isCompleted ? 'bg-[#D40511]' : 'bg-slate-200 dark:bg-[#333]'}`}>
                    <div className={`absolute top-1 bottom-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${shift.isCompleted ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
          )}

          <div className="space-y-4">
             {[
               { field: 'startTime', label: 'ПОЧАТОК' },
               { field: 'endTime', label: 'КІНЕЦЬ' }
             ].map(item => (
                <div key={item.field} className="flex items-center justify-between group">
                    <label className="font-bold text-slate-400 dark:text-gray-500 uppercase text-[11px] tracking-[0.1em]">{item.label}</label>
                    <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-[#1a1a1a] p-1.5 rounded-2xl border border-slate-100 dark:border-white/5">
                         <button 
                           onClick={() => { triggerHaptic('soft'); onSave({ ...shift, [item.field]: adjustTime(shift[item.field as 'startTime'|'endTime'], -1) }); }} 
                           className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm flex items-center justify-center text-slate-600 dark:text-gray-300 active:scale-90 transition-transform"
                         >
                            <Minus size={18} />
                         </button>
                         <input 
                           type="time" 
                           step="60"
                           value={shift[item.field as 'startTime'|'endTime']} 
                           onChange={(e) => onSave({ ...shift, [item.field]: e.target.value })} 
                           className="bg-transparent font-extrabold text-lg text-[#1a1c24] dark:text-white text-center w-24 outline-none"
                         />
                         <button 
                           onClick={() => { triggerHaptic('soft'); onSave({ ...shift, [item.field]: adjustTime(shift[item.field as 'startTime'|'endTime'], 1) }); }} 
                           className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm flex items-center justify-center text-slate-600 dark:text-gray-300 active:scale-90 transition-transform"
                         >
                            <Plus size={18} />
                         </button>
                    </div>
                </div>
             ))}
          </div>

          <div className="bg-slate-50/50 dark:bg-[#1a1a1a] rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 flex justify-between items-center">
             <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">РАЗОМ ЗА ДЕНЬ</p>
                <div className="flex gap-4 items-center">
                   <div className="flex items-center gap-1.5">
                      <Sun size={14} className="text-orange-400/80" />
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">{earnings.dayHours}г</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <Moon size={14} className="text-blue-400/80" />
                      <span className="text-xs font-bold text-slate-600 dark:text-gray-300">{earnings.nightHours}г</span>
                   </div>
                </div>
             </div>
             <div className="text-right">
                <span className="block text-3xl font-black text-[#D40511] leading-none">
                  {Math.round(earnings.totalPay)}<span className="text-lg ml-1 font-bold opacity-40 lowercase">zl</span>
                </span>
             </div>
          </div>

          <div className="flex gap-4 pt-2">
             {shift.isWorkDay && (
                <button 
                  onClick={onDelete} 
                  className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#2d2d2d] border border-slate-100 dark:border-white/5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={24} />
                </button>
             )}
            <button 
              onClick={handleSaveAndClose} 
              className="flex-1 h-14 rounded-2xl bg-[#D40511] text-white font-bold text-lg active:scale-95 transition-all shadow-lg shadow-red-500/20"
            >
                Зберегти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;