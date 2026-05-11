import React, { useState } from 'react';
import { Check, Settings } from 'lucide-react';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedDayIndices: number[]) => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);


  const triggerHaptic = (type: 'selection' | 'soft') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.isVersionAtLeast?.('6.1') && tg.HapticFeedback) {
      if (type === 'selection') tg.HapticFeedback.selectionChanged();
      else tg.HapticFeedback.impactOccurred('soft');
    }
  };

  const toggleDay = (dayIndex: number) => {
    triggerHaptic('selection');
    setSelectedDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const DAYS = [
    { label: 'Нд', index: 0 }, { label: 'Пн', index: 1 }, { label: 'Вт', index: 2 }, 
    { label: 'Ср', index: 3 }, { label: 'Чт', index: 4 }, { label: 'Пт', index: 5 }, { label: 'Сб', index: 6 },
  ];
  const DISPLAY_DAYS = [...DAYS.slice(1), DAYS[0]];

  return (
    <div className={`fixed inset-0 z-50 flex items-end md:items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} style={{ willChange: 'opacity' }} />
      
      <div 
        className={`relative bg-white dark:bg-[#1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-2xl border border-white dark:border-white/5 overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="md:hidden w-full flex justify-center pt-4" onClick={onClose}>
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        <div className="px-8 pt-8 pb-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#FFCC00] p-2 rounded-xl text-black">
                    <Settings size={20} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Налаштування графіку</h2>
            </div>
        </div>

        <div className="px-8 pb-10">
          <div className="space-y-8">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Оберіть робочі дні тижня</p>
                <div className="grid grid-cols-4 gap-3">
                   {DISPLAY_DAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.index);
                      return (
                          <button key={day.index} onClick={() => toggleDay(day.index)}
                              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${isSelected ? 'bg-[#D40511] border-[#D40511] text-white shadow-lg' : 'bg-slate-50 dark:bg-[#2a2a2a] border-transparent text-slate-400'}`}
                          >
                              <span className="text-xl font-black uppercase tracking-tighter">{day.label}</span>
                              {isSelected && <Check size={16} className="mt-1 opacity-60" />}
                          </button>
                      );
                   })}
                </div>
            </div>
            
            <div className="space-y-3">
                <button onClick={() => { onGenerate(selectedDays); onClose(); }} className="w-full h-16 rounded-2xl bg-[#D40511] text-white font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-lg shadow-red-500/20 border-b-4 border-red-800">
                    Згенерувати місяць
                </button>
                <button onClick={onClose} className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-[#2a2a2a] text-slate-500 font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
                    Скасувати
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsModal;