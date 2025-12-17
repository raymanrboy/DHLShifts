import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';

interface AutoFillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedDayIndices: number[]) => void;
}

const AutoFillModal: React.FC<AutoFillModalProps> = ({ isOpen, onClose, onGenerate }) => {
  // Default to Mon-Fri (1, 2, 3, 4, 5). 0 is Sunday, 6 is Saturday.
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
    
    // Haptic feedback for selection (v6.1+)
    const tg = window.Telegram?.WebApp;
    if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.HapticFeedback) {
      tg.HapticFeedback.selectionChanged();
    }
  };

  const handleGenerate = () => {
    onGenerate(selectedDays);
    onClose();
  };

  const DAYS = [
    { label: 'Нд', index: 0 },
    { label: 'Пн', index: 1 },
    { label: 'Вт', index: 2 },
    { label: 'Ср', index: 3 },
    { label: 'Чт', index: 4 },
    { label: 'Пт', index: 5 },
    { label: 'Сб', index: 6 },
  ];

  // Reorder to start from Monday for display logic (EU standard)
  const DISPLAY_DAYS = [...DAYS.slice(1), DAYS[0]];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="pointer-events-auto relative bg-white dark:bg-[#1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-black/60 overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 border border-white dark:border-white/5 transition-colors duration-300">
        
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-full flex justify-center pt-4 pb-1" onClick={onClose}>
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Автозаповнення</h2>
            <div className="flex items-center gap-2 mt-1 text-slate-400 dark:text-gray-500 font-medium">
                <CalendarIcon size={16} />
                <span>Оберіть робочі дні</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-[#2d2d2d] text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-[#333] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 space-y-8">
          
          <div className="grid grid-cols-4 gap-3">
             {DISPLAY_DAYS.map((day) => {
                const isSelected = selectedDays.includes(day.index);
                return (
                    <button
                        key={day.index}
                        onClick={() => toggleDay(day.index)}
                        className={`
                            aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-200 border-2
                            ${isSelected 
                                ? 'bg-[#D40511] border-[#D40511] text-white shadow-lg shadow-red-500/20' 
                                : 'bg-slate-50 dark:bg-[#2a2a2a] border-transparent text-slate-400 dark:text-gray-500 hover:bg-slate-100 dark:hover:bg-[#333]'}
                        `}
                    >
                        <span className="text-lg font-bold">{day.label}</span>
                        {isSelected && <Check size={16} className="mt-1 opacity-60" />}
                    </button>
                );
             })}
          </div>

          <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
             <p className="text-sm font-medium text-slate-500 dark:text-gray-400">
                Це створить робочі зміни на всі вибрані дні поточного місяця, які ще не мають змін.
             </p>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={selectedDays.length === 0}
            className="w-full h-16 rounded-[1.5rem] bg-[#222] dark:bg-white text-white dark:text-black font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-300 dark:shadow-none disabled:opacity-50 disabled:scale-100"
          >
            Згенерувати графік
          </button>

        </div>
      </div>
    </div>
  );
};

export default AutoFillModal;