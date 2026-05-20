import React from 'react';
import { calcMonthStats } from '../utils';
import { ShiftData } from '../types';

interface HoursSummaryProps {
  shifts: Record<string, ShiftData>;
  currentDate: Date;
}

const HoursSummary: React.FC<HoursSummaryProps> = ({ shifts, currentDate }) => {
  const { planned, actual, balance } = calcMonthStats(shifts, currentDate);

  const formatHours = (h: number) => {
    // Only show decimals if not whole
    return h % 1 === 0 ? h.toString() : h.toFixed(1);
  };

  const isPositive = balance >= 0;

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-5 mx-2 mt-4 flex items-center justify-between border-2 border-slate-50">
      
      <div className="text-center flex-1 border-r border-slate-100">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">План</p>
         <p className="text-lg font-black text-slate-800">{formatHours(planned)} <span className="text-xs text-slate-400">г</span></p>
      </div>

      <div className="text-center flex-1 border-r border-slate-100">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Факт</p>
         <p className="text-lg font-black text-[#D40511]">{formatHours(actual)} <span className="text-xs text-red-300">г</span></p>
      </div>

      <div className="text-center flex-1 relative">
         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Баланс</p>
         <div className="flex items-center justify-center gap-1">
            <p className={`text-lg font-black ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {balance > 0 ? '+' : ''}{formatHours(balance)}
            </p>
         </div>
      </div>

    </div>
  );
};

export default HoursSummary;
