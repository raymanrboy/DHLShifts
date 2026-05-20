import React from 'react';
import { format, isSameMonth } from 'date-fns';
import { ShiftData } from '../types';
import { haptic } from '../utils';

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

          return (
              <div
                  key={day.toString()}
                  onClick={() => { haptic.selection(); onDayClick(day); }}
                  className={`relative h-[65px] flex flex-col items-center justify-center transition-colors cursor-pointer ${!isCurrentMonth ? 'opacity-20' : ''}`}
              >
                  {shift?.isWorkDay && isPrev && <div className="absolute -left-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}
                  {shift?.isWorkDay && isNext && <div className="absolute -right-1 top-1/2 w-[55%] h-1 bg-[#D40511] -translate-y-1/2 z-0" />}

                  <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${
                    shift?.isWorkDay
                      ? (isFact && shift.isCompleted ? 'bg-[#FFCC00] text-[#D40511] border-2 border-[#D40511]' : 'bg-[#D40511] text-white border-2 border-white')
                      : 'bg-white text-slate-600 border border-slate-100'
                  }`}>
                      {format(day, 'd')}
                  </div>

                  {shift?.isWorkDay && (
                      <div className="relative z-10 mt-1 flex items-center gap-1">
                          <span className="text-[9px] font-black text-slate-800">{displayStart}</span>
                          {!isFact && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />}
                      </div>
                  )}
              </div>
          );
      })}
    </div>
  );
};

export default CalendarGrid;
