import { TIME_ZONES } from './constants';
import { EarningsResult, Rates, ShiftData } from './types';

/**
 * Parses "HH:mm" string to decimal hours (e.g., "02:30" -> 2.5)
 */
export const timeToDecimal = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) + (minutes || 0) / 60;
};

/**
 * Converts decimal hours back to "HH:mm"
 */
export const decimalToTime = (decimal: number): string => {
  let normalized = decimal;
  while (normalized < 0) normalized += 24;
  while (normalized >= 24) normalized -= 24;
  
  const hours = Math.floor(normalized);
  const minutes = Math.round((normalized - hours) * 60);
  
  // Handle rounding up to 60 minutes
  if (minutes === 60) {
    return `${(hours + 1).toString().padStart(2, '0')}:00`;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Adjusts a time string by a set number of hours
 */
export const adjustTime = (timeStr: string, deltaHours: number): string => {
  const current = timeToDecimal(timeStr);
  return decimalToTime(current + deltaHours);
};

/**
 * Calculates earnings for a shift based on day/night rates.
 */
export const calculateEarnings = (startStr: string, endStr: string, rates: Rates): EarningsResult => {
  let start = timeToDecimal(startStr);
  let end = timeToDecimal(endStr);

  if (end <= start) {
    end += 24;
  }

  const shiftDuration = end - start;
  if (shiftDuration <= 0) return { dayHours: 0, nightHours: 0, totalPay: 0 };

  let nightHours = 0;
  let dayHours = 0;
  
  const nightZone1_Start = 0;
  const nightZone1_End = TIME_ZONES.NIGHT_END; 
  const dayZone_Start = TIME_ZONES.NIGHT_END; 
  const dayZone_End = 24;
  const nightZone2_Start = 24;
  const nightZone2_End = 24 + TIME_ZONES.NIGHT_END; 

  const getOverlap = (s1: number, e1: number, s2: number, e2: number) => {
    const startObj = Math.max(s1, s2);
    const endObj = Math.min(e1, e2);
    return Math.max(0, endObj - startObj);
  };

  const night1 = getOverlap(start, end, nightZone1_Start, nightZone1_End);
  const day = getOverlap(start, end, dayZone_Start, dayZone_End);
  const night2 = getOverlap(start, end, nightZone2_Start, nightZone2_End);

  nightHours = night1 + night2;
  dayHours = day;
  
  if (end > nightZone2_End) {
      dayHours += (end - nightZone2_End);
  }

  const totalPay = (nightHours * rates.night) + (dayHours * rates.day);

  return {
    dayHours: Number(dayHours.toFixed(2)),
    nightHours: Number(nightHours.toFixed(2)),
    totalPay
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);
};

// --- Storage Optimization (Compression) ---

/**
 * Compresses the Shifts object to a minimal string format to save storage space.
 * Format: "YYYY-MM-DD": "Start|End|IsCompleted(0/1)"
 */
export const compressShifts = (shifts: Record<string, ShiftData>): Record<string, string> => {
  const compressed: Record<string, string> = {};
  Object.values(shifts).forEach(shift => {
    // We only save actual work days to save space
    if (shift.isWorkDay) {
       compressed[shift.date] = `${shift.startTime}|${shift.endTime}|${shift.isCompleted ? 1 : 0}`;
    }
  });
  return compressed;
};

/**
 * Decompresses storage data back into full ShiftData objects.
 * Handles both legacy (full JSON) and new (compressed string) formats.
 */
export const decompressShifts = (data: any): Record<string, ShiftData> => {
   const shifts: Record<string, ShiftData> = {};
   if (!data || typeof data !== 'object') return shifts;

   Object.entries(data).forEach(([date, value]) => {
      if (typeof value === 'object' && value !== null && 'id' in value) {
         // Handle Legacy Format
         shifts[date] = value as ShiftData;
      } else if (typeof value === 'string') {
         // Handle New Compressed Format "Start|End|Completed"
         const parts = value.split('|');
         if (parts.length >= 2) {
             const [start, end, completed] = parts;
             shifts[date] = {
               id: date,
               date: date,
               isWorkDay: true,
               startTime: start,
               endTime: end,
               isCompleted: completed === '1'
             };
         }
      }
   });
   return shifts;
};

// --- Cloud Storage Helpers ---

const isCloudStorageSupported = (): boolean => {
  const tg = window.Telegram?.WebApp;
  return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9'));
};

export const storage = {
  get: async (key: string): Promise<any | null> => {
    // Try cloud first if supported
    if (isCloudStorageSupported()) {
      try {
        const cloudValue = await new Promise<string | null>((resolve) => {
           window.Telegram.WebApp.CloudStorage.getItem(key, (err, value) => {
              if (err) resolve(null);
              else resolve(value || null);
           });
        });

        if (cloudValue) {
          localStorage.setItem(key, cloudValue);
          return JSON.parse(cloudValue);
        }
      } catch (e) {
        console.warn('CloudStorage access failed:', e);
      }
    }
    
    // Fallback to local
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  },

  set: async (key: string, value: any): Promise<boolean> => {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);

    if (isCloudStorageSupported()) {
      try {
        await new Promise((resolve) => {
          window.Telegram.WebApp.CloudStorage.setItem(key, stringValue, (err, stored) => {
            resolve(stored);
          });
        });
      } catch (e) {
        console.warn('CloudStorage write failed');
      }
    }
    return true;
  }
};