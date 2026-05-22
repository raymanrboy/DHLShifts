import React from 'react';
import { format, isSameMonth } from 'date-fns';
import { ShiftData } from '../types';
import { haptic, calcHours } from '../utils';

interface CalendarGridProps {
  mode: 'planner' | 'fact';
  currentDate: Date;
  calendarDays: Date[];
  calendarKeys: string[];
  shifts: Record<string, ShiftData>;
  onDayClick: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({ mode, currentDate, calendarDays, calendarKeys, shifts, onDayClick }) => {
  return (
    <div className="grid grid-cols-7 gap-y-2">
      {calendarDays.map((day, index) => {
          const dateKey = calendarKeys[index];
          const shift = shifts[dateKey];
          const isCurrentMonth = isSameMonth(day, currentDate);

          const prevKey = calendarKeys[index - 1] ?? null;
          const nextKey = calendarKeys[index + 1] ?? null;
          const isPrev = shift?.isWorkDay && prevKey && shifts[prevKey]?.isWorkDay;
          const isNext = shift?.isWorkDay && nextKey && shifts[nextKey]?.isWorkDay;

          const isFact = mode === 'fact';
          const displayStart = isFact ? (shift?.actualStartTime || shift?.startTime) : shift?.startTime;

          // Calculate daily balance if workday is completed
          let dailyBalance = 0;
          if (shift?.isWorkDay && shift.isCompleted) {
            const planHours = calcHours(shift.startTime, shift.endTime);
            const actHours = calcHours(shift.actualStartTime || shift.startTime, shift.actualEndTime || shift.endTime);
            dailyBalance = actHours - planHours;
          }

          const formatHours = (h: number) => {
            const abs = Math.abs(h);
            return abs % 1 === 0 ? abs.toString() : abs.toFixed(1);
          };

          return (
              <div
                  key={day.toString()}
                  onClick={() => { haptic.selection(); onDayClick(day); }}
                  className={`relative h-[65px] flex flex-col items-center justify-center transition-colors cursor-pointer ${!isCurrentMonth ? 'opacity-20' : ''}`}
              >
                  {shift?.isWorkDay && isPrev && <div className="absolute -left-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}
                  {shift?.isWorkDay && isNext && <div className="absolute -right-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}

                  <div className="relative z-10">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${
                        shift?.isWorkDay
                          ? (isFact && shift.isCompleted ? 'bg-[#FFCC00] text-[#D40511] border-2 border-[#D40511]' : 'bg-[#D40511] text-white border-2 border-white')
                          : 'bg-white text-slate-600 border border-slate-100'
                      }`}>
                          {format(day, 'd')}
                      </div>

                      {/* Daily Balance Badge */}
                      {isFact && shift?.isWorkDay && shift.isCompleted && dailyBalance !== 0 && (
                        <div className={`absolute -top-1.5 -right-2.5 z-20 text-[8px] font-black leading-none rounded-full px-1 py-0.5 border shadow-sm ${
                           dailyBalance > 0 
                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                             : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                           {dailyBalance > 0 ? `+${formatHours(dailyBalance)}` : `-${formatHours(dailyBalance)}`}
                        </div>
                      )}
                  </div>

                  {shift?.isWorkDay && (
                      <div className="relative z-10 mt-1 flex items-center gap-1">
                          <span className="text-[9px] font-black text-slate-800">{displayStart}</span>
                      </div>
                  )}
              </div>
          );
      })}
    </div>
  );
};

export default CalendarGrid;
