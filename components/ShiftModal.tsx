import React from 'react';
import { X, Calendar as CalendarIcon, Minus, Plus, Trash2 } from 'lucide-react';
import { ShiftData } from '../types';
import { adjustTime, calculateEarnings, formatCurrency } from '../utils';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ShiftData;
  onSave: (updatedShift: ShiftData) => void;
  onDelete: () => void; 
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shift, onSave, onDelete }) => {
  if (!isOpen) return null;

  const earnings = calculateEarnings(shift.startTime, shift.endTime);

  const handleTimeChange = (field: 'startTime' | 'endTime', delta: number) => {
    const newValue = adjustTime(shift[field], delta);
    onSave({ ...shift, [field]: newValue });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSave({ ...shift, [e.target.name]: e.target.value });
  };

  const toggleCompleted = () => {
    onSave({ ...shift, isCompleted: !shift.isCompleted });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#F2F4F8]/80 dark:bg-black/80 backdrop-blur-sm pointer-events-auto transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card - Soft UI Style */}
      <div className="pointer-events-auto relative bg-white dark:bg-[#1e1e1e] w-full md:w-[480px] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-black/60 overflow-hidden animate-in slide-in-from-bottom duration-300 md:zoom-in-95 border border-white dark:border-white/5 transition-colors duration-300">
        
        {/* Mobile Drag Handle */}
        <div className="md:hidden w-full flex justify-center pt-4 pb-1" onClick={onClose}>
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Налаштування</h2>
            <div className="flex items-center gap-2 mt-1 text-slate-400 dark:text-gray-500 font-medium">
                <CalendarIcon size={16} />
                <span>{shift.date}</span>
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
          
          {/* Custom Switch Toggle for Status */}
          <div className="flex items-center justify-between">
             <span className="font-bold text-slate-700 dark:text-gray-300 text-lg">Зміна відпрацьована?</span>
             <button 
                onClick={toggleCompleted}
                className={`w-16 h-9 rounded-full relative transition-all duration-300 shadow-inner ${
                  shift.isCompleted ? 'bg-[#D40511]' : 'bg-slate-200 dark:bg-[#333]'
                }`}
             >
                <div className={`absolute top-1 bottom-1 left-1 w-7 h-7 bg-white dark:bg-gray-200 rounded-full shadow-md transition-transform duration-300 ${
                    shift.isCompleted ? 'translate-x-7' : 'translate-x-0'
                }`} />
             </button>
          </div>

          <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />

          {/* Time Inputs - Styled like 'Input field' in reference */}
          <div className="space-y-6">
             {/* Start Time */}
             <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 dark:text-gray-500 flex items-center gap-2">
                    Початок
                </label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1a1a1a] p-1.5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5">
                     <button onClick={() => handleTimeChange('startTime', -1)} className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm dark:shadow-black/20 text-slate-600 dark:text-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <Minus size={18} />
                     </button>
                     <input 
                      type="time" 
                      name="startTime"
                      value={shift.startTime}
                      onChange={handleValueChange}
                      className="bg-transparent font-extrabold text-lg text-slate-800 dark:text-white text-center w-24 outline-none"
                    />
                     <button onClick={() => handleTimeChange('startTime', 1)} className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm dark:shadow-black/20 text-slate-600 dark:text-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <Plus size={18} />
                     </button>
                </div>
             </div>

             {/* End Time */}
             <div className="flex items-center justify-between">
                <label className="font-bold text-slate-500 dark:text-gray-500 flex items-center gap-2">
                    Кінець
                </label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#1a1a1a] p-1.5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5">
                     <button onClick={() => handleTimeChange('endTime', -1)} className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm dark:shadow-black/20 text-slate-600 dark:text-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <Minus size={18} />
                     </button>
                     <input 
                      type="time" 
                      name="endTime"
                      value={shift.endTime}
                      onChange={handleValueChange}
                      className="bg-transparent font-extrabold text-lg text-slate-800 dark:text-white text-center w-24 outline-none"
                    />
                     <button onClick={() => handleTimeChange('endTime', 1)} className="w-10 h-10 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-sm dark:shadow-black/20 text-slate-600 dark:text-gray-300 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <Plus size={18} />
                     </button>
                </div>
             </div>
          </div>

          {/* Result Card (Inset style) */}
          <div className="bg-slate-50 dark:bg-[#1a1a1a] rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] flex justify-between items-center">
             <div>
                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">Разом за день</p>
                <div className="flex gap-3 text-xs font-medium text-slate-500 dark:text-gray-400">
                   <span>День: {earnings.dayHours}ч</span>
                   <span>Ніч: {earnings.nightHours}ч</span>
                </div>
             </div>
             <div className="text-right">
                <span className="block text-3xl font-black text-[#D40511] dark:text-red-400">{Math.round(earnings.totalPay)}<span className="text-lg ml-1 font-bold text-slate-400 dark:text-gray-600">zl</span></span>
             </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
             <button 
                onClick={onDelete}
                className="w-16 h-16 flex items-center justify-center rounded-[1.5rem] bg-white dark:bg-[#2d2d2d] border-2 border-slate-100 dark:border-white/5 text-slate-400 dark:text-gray-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900 transition-colors shadow-sm dark:shadow-black/20"
            >
                <Trash2 size={24} />
            </button>
            <button 
                onClick={onClose}
                className="flex-1 h-16 rounded-[1.5rem] bg-[#222] dark:bg-white text-white dark:text-black font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-300 dark:shadow-none"
            >
                Зберегти зміни
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
