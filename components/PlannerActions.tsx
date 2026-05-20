import React, { useState } from 'react';
import { Check, Trash2, Wand2 } from 'lucide-react';
import { haptic } from '../utils';

interface PlannerActionsProps {
  onGenerate: (days: number[], startTime: string, endTime: string) => void;
  onClear: () => void;
}

const DAYS = [
  { label: 'Нд', index: 0 }, { label: 'Пн', index: 1 }, { label: 'Вт', index: 2 }, 
  { label: 'Ср', index: 3 }, { label: 'Чт', index: 4 }, { label: 'Пт', index: 5 }, { label: 'Сб', index: 6 },
];
const DISPLAY_DAYS = [...DAYS.slice(1), DAYS[0]];

const PlannerActions: React.FC<PlannerActionsProps> = ({ onGenerate, onClear }) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("02:00");
  const [endTime, setEndTime] = useState("10:00");

  const toggleDay = (dayIndex: number) => {
    haptic.selection();
    setSelectedDays(prev => 
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl p-6 mt-4 mx-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#FFCC00] p-2 rounded-xl text-black">
          <Wand2 size={20} />
        </div>
        <h3 className="font-black uppercase tracking-widest text-sm text-slate-800">Авто-заповнення місяця</h3>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-6">
        {DISPLAY_DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.index);
          return (
            <button key={day.index} onClick={() => toggleDay(day.index)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all border-2 ${isSelected ? 'bg-[#D40511] border-[#D40511] text-white shadow-md' : 'bg-slate-50 border-transparent text-slate-400'}`}
            >
                <span className="text-[10px] font-black uppercase">{day.label}</span>
                {isSelected && <Check size={12} className="mt-0.5 opacity-80" />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Початок</label>
          <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-black text-slate-800 outline-none text-center" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Кінець</label>
          <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-slate-50 rounded-xl p-3 font-black text-slate-800 outline-none text-center" />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onClear} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center active:scale-95 transition-all hover:text-red-500">
           <Trash2 size={20} />
        </button>
        <button onClick={() => { haptic.notification('success'); onGenerate(selectedDays, startTime, endTime); }} className="flex-1 h-14 rounded-2xl bg-[#D40511] text-white font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg shadow-red-500/20">
           Заповнити місяць
        </button>
      </div>
    </div>
  );
};

export default PlannerActions;
