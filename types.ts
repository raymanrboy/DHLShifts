export interface ShiftData {
  id: string; // usually the date string YYYY-MM-DD
  date: string;
  isWorkDay: boolean;
  startTime: string; // Format "HH:mm"
  endTime: string;   // Format "HH:mm"
  isCompleted: boolean; // Has the user actually worked this shift?
}

export interface EarningsResult {
  dayHours: number;
  nightHours: number;
  totalPay: number;
}

export interface DayStats {
  projected: number;
  earned: number;
  workDaysCount: number;
  completedDaysCount: number;
}
