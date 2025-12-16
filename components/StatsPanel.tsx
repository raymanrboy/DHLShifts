import React from 'react';
import { DayStats } from '../types';
import { formatCurrency } from '../utils';
import { TrendingUp, Briefcase, Zap } from 'lucide-react';

interface StatsPanelProps {
  stats: DayStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="flex md:grid md:grid-cols-3 gap-6 mb-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0">
      
      {/* Primary Card (Earned) - Styled like "Billing Account" */}
      <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden group">
        <div className="flex justify-between items-start mb-6 relative z-10">
             <div>
                <h3 className="text-slate-900 font-extrabold text-lg">Заробіток</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Фактичний</p>
             </div>
             <div className="bg-[#D40511] text-white p-3 rounded-2xl shadow-lg shadow-red-200">
                <Zap size={24} className="fill-current" />
             </div>
        </div>
        
        <div className="relative z-10">
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {formatCurrency(stats.earned)}
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2">
                за {stats.completedDaysCount} змін
            </p>
        </div>

        {/* Inset Progress Bar */}
        <div className="mt-8 relative z-10">
            <div className="h-4 w-full bg-slate-100 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
                 <div 
                    className="h-full bg-gradient-to-r from-[#D40511] to-[#ff4d5a] rounded-full shadow-sm transition-all duration-1000"
                    style={{ width: stats.workDaysCount > 0 ? `${(stats.completedDaysCount / stats.workDaysCount) * 100}%` : '0%' }}
                 />
            </div>
             <p className="text-right text-[10px] font-bold text-slate-300 mt-2 uppercase tracking-widest">Прогрес місяця</p>
        </div>
      </div>

      {/* Secondary Card (Projected) */}
      <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white relative">
        <div className="flex justify-between items-start mb-6">
             <div>
                <h3 className="text-slate-900 font-extrabold text-lg">Прогноз</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">На кінець місяця</p>
             </div>
             <div className="bg-slate-100 text-slate-400 p-3 rounded-2xl">
                <TrendingUp size={24} />
             </div>
        </div>
        
        <div>
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight opacity-60">
                {formatCurrency(stats.projected)}
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-2">
               Якщо виконати {stats.workDaysCount} змін
            </p>
        </div>
      </div>

       {/* Shifts Count Card */}
       <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-white relative">
        <div className="flex justify-between items-start mb-6">
             <div>
                <h3 className="text-slate-900 font-extrabold text-lg">Зміни</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Статистика</p>
             </div>
             <div className="bg-[#FFCC00] text-slate-900 p-3 rounded-2xl shadow-lg shadow-yellow-100">
                <Briefcase size={24} />
             </div>
        </div>
        
        <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                {stats.completedDaysCount}
            </h2>
            <span className="text-2xl font-bold text-slate-300">/ {stats.workDaysCount}</span>
        </div>
        
        <div className="mt-8 flex gap-2">
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                <span className="block text-xl font-bold text-slate-700">{stats.workDaysCount - stats.completedDaysCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Залишилось</span>
            </div>
            <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                <span className="block text-xl font-bold text-[#D40511]">{stats.completedDaysCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Готово</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;