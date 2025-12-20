import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check, Settings, DollarSign, Sun, Moon, Plus, Minus } from 'lucide-react';
import { Rates } from '../types';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (selectedDayIndices: number[]) => void;
  rates: Rates;
  onUpdateRates: (rates: Rates) => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate, 
  rates, 
  onUpdateRates
}) => {
  const [activeTab, setActiveTab] = useState<'fill' | 'rates'>('fill');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);

  if (!isOpen) return null;

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

  const handleRateChange = (type: 'day' | 'night', delta: number) => {
    triggerHaptic('soft');
    onUpdateRates({
      ...rates,
      [type]: Math.max(0, parseFloat((rates[type] + delta).toFixed(2)))
    });
  };

  const DAYS = [
    { label: 'Нд', index: 0 }, { label: 'Пн', index: 1 }, { label: 'Вт', index: 2 }, 
    { label: 'Ср', index: 3 }, { label: 'Чт', index: 4 }, { label: 'Пт', index: 5 }, { label: 'Сб', index: 6 },
  ];
  const DISPLAY_DAYS = [...DAYS.slice(1), DAYS[0]];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
      
      <div 
        className="pointer-events-auto relative bg-white dark:bg-[#1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white dark:border-white/5 transition-all duration-300 overflow-hidden"
      >
        <div className="md:hidden w-full flex justify-center pt-4" onClick={onClose}>
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        <div className="px-8 pt-6 pb-2">
            <div className="flex bg-slate-100 dark:bg-[#1a1a1a] p-1 rounded-2xl mb-6">
                <button 
                    onClick={() => { triggerHaptic('selection'); setActiveTab('fill'); }}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'fill' ? 'bg-white dark:bg-[#2d2d2d] text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                    <CalendarIcon size={18} /> Графік
                </button>
                <button 
                    onClick={() => { triggerHaptic('selection'); setActiveTab('rates'); }}
                    className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'rates' ? 'bg-white dark:bg-[#2d2d2d] text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                >
                    <DollarSign size={18} /> Ставки
                </button>
            </div>
        </div>

        <div className="px-8 pb-10 space-y-6">
          {activeTab === 'fill' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-3">
                 {DISPLAY_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.index);
                    return (
                        <button key={day.index} onClick={() => toggleDay(day.index)}
                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${isSelected ? 'bg-[#D40511] border-[#D40511] text-white shadow-lg shadow-red-500/10' : 'bg-slate-50 dark:bg-[#2a2a2a] border-transparent text-slate-400'}`}
                        >
                            <span className="text-xl font-bold">{day.label}</span>
                            {isSelected && <Check size={18} className="mt-1 opacity-60" />}
                        </button>
                    );
                 })}
              </div>
              <button onClick={() => { onGenerate(selectedDays); onClose(); }} className="w-full h-16 rounded-2xl bg-[#D40511] text-white font-bold text-lg active:scale-95 transition-all shadow-lg shadow-red-500/20">Згенерувати місяць</button>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Денна ставка', key: 'day' as const, icon: <Sun size={20} className="text-orange-400/80" /> },
                { label: 'Нічна ставка', key: 'night' as const, icon: <Moon size={20} className="text-blue-400/80" /> }
              ].map(item => (
                <div key={item.key} className="bg-slate-50/50 dark:bg-[#1a1a1a] p-5 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-white dark:bg-[#2d2d2d] rounded-xl shadow-sm">{item.icon}</div>
                        <span className="font-bold text-slate-500 dark:text-gray-400 uppercase text-xs tracking-wider">{item.label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <button onClick={() => handleRateChange(item.key, -0.1)} className="w-12 h-12 bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-sm flex items-center justify-center active:scale-90 transition-transform border border-slate-50 dark:border-transparent"><Minus size={20} /></button>
                        <div className="flex-1 text-center">
                            <span className="text-3xl font-black text-[#1a1c24] dark:text-white">{rates[item.key].toFixed(2)}</span>
                            <span className="ml-1 text-sm font-bold text-slate-400 uppercase">zl/год</span>
                        </div>
                        <button onClick={() => handleRateChange(item.key, 0.1)} className="w-12 h-12 bg-white dark:bg-[#2d2d2d] rounded-2xl shadow-sm flex items-center justify-center active:scale-90 transition-transform border border-slate-50 dark:border-transparent"><Plus size={20} /></button>
                    </div>
                </div>
              ))}
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 pt-2">Всі розрахунки оновлюються автоматично</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolsModal;