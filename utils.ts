// @wiki: technical/symbol-map.md (Utility contracts), concepts/storage-optimization.md (Shift compression strings)
import { format } from 'date-fns';
import { ShiftData } from './types';

/**
 * Adjusts a "HH:mm" time string by a set number of hours.
 */
export const adjustTime = (timeStr: string, deltaHours: number): string => {
  if (!timeStr) return "00:00";
  const [hours, minutes] = timeStr.split(':').map(Number);
  let newHours = (hours + deltaHours) % 24;
  if (newHours < 0) newHours += 24;
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// --- Haptic Feedback ---

export const haptic = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => {
    try { window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style); } catch {}
  },
  notification: (type: 'success' | 'warning' | 'error') => {
    try { window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type); } catch {}
  },
  selection: () => {
    try { window.Telegram?.WebApp?.HapticFeedback?.selectionChanged(); } catch {}
  },
};

// --- Hours Calculation ---

export const calcHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let hours = endH - startH + (endM - startM) / 60;
  if (hours < 0) hours += 24; // Handle night shifts (e.g. 22:00 -> 06:00)
  return hours;
};

export const calcMonthStats = (shifts: Record<string, ShiftData>, monthDate: Date): { planned: number; actual: number; balance: number } => {
  let planned = 0;
  let actual = 0;
  
  const targetPrefix = format(monthDate, 'yyyy-MM');

  Object.values(shifts).forEach(shift => {
    if (!shift.isWorkDay) return;
    
    if (!shift.date.startsWith(targetPrefix)) return;

    const isPlanned = shift.isPlanned !== false;
    const planHours = isPlanned ? calcHours(shift.startTime, shift.endTime) : 0;
    planned += planHours;
    
    if (shift.isCompleted) {
      const actStart = shift.actualStartTime || shift.startTime;
      const actEnd = shift.actualEndTime || shift.endTime;
      actual += calcHours(actStart, actEnd);
    } else {
      actual += isPlanned ? planHours : 0;
    }
  });

  return { planned, actual, balance: actual - planned };
};

// --- Storage Optimization (Compression) ---

export const compressShifts = (shifts: Record<string, ShiftData>): Record<string, string> => {
  const compressed: Record<string, string> = {};
  Object.values(shifts).forEach(shift => {
    if (shift.isWorkDay) {
       const actStart = shift.actualStartTime || '';
       const actEnd = shift.actualEndTime || '';
       const planned = shift.isPlanned !== false ? '1' : '0';
       compressed[shift.date] = `${shift.startTime}|${shift.endTime}|${shift.isCompleted ? 1 : 0}|${actStart}|${actEnd}|${planned}`;
    }
  });
  return compressed;
};

export const decompressShifts = (data: any): Record<string, ShiftData> => {
   const shifts: Record<string, ShiftData> = {};
   if (!data || typeof data !== 'object') return shifts;

   Object.entries(data).forEach(([date, value]) => {
      if (typeof value === 'object' && value !== null) {
         // Handle Legacy Format (may have `id` field — we ignore it)
         const legacy = value as any;
         shifts[date] = {
           date: legacy.date || date,
           isWorkDay: legacy.isWorkDay ?? true,
           isPlanned: legacy.isPlanned ?? true,
           startTime: legacy.startTime,
           endTime: legacy.endTime,
           actualStartTime: legacy.actualStartTime,
           actualEndTime: legacy.actualEndTime,
           isCompleted: legacy.isCompleted ?? false,
         };
      } else if (typeof value === 'string') {
         // Handle Compressed Format "Start|End|Completed" or "Start|End|Completed|ActualStart|ActualEnd|Planned"
         const parts = value.split('|');
         if (parts.length >= 3) {
             const [start, end, completed, actStart, actEnd, planned] = parts;
             shifts[date] = {
               date: date,
               isWorkDay: true,
               isPlanned: planned !== undefined ? planned === '1' : true,
               startTime: start,
               endTime: end,
               actualStartTime: actStart || undefined,
               actualEndTime: actEnd || undefined,
               isCompleted: completed === '1'
             };
         }
      }
   });
   return shifts;
};

// --- Photo Utilities ---

/**
 * Resizes an image file to a square JPEG, returns base64 data URL.
 */
export const resizePhoto = (file: File, size = 500, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Center-crop to square
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

// --- Cloud Storage Helpers ---

const isCloudStorageSupported = (): boolean => {
  const tg = window.Telegram?.WebApp;
  return !!(tg && tg.isVersionAtLeast && tg.isVersionAtLeast('6.9'));
};

export const storage = {
  get: async (key: string): Promise<any | null> => {
    if (isCloudStorageSupported()) {
      try {
        const cloudValue = await new Promise<string | null>((resolve) => {
           window.Telegram!.WebApp.CloudStorage.getItem(key, (err, value) => {
              if (err) resolve(null);
              else resolve(value || null);
           });
        });
        if (cloudValue) {
          localStorage.setItem(key, cloudValue);
          return JSON.parse(cloudValue);
        }
      } catch (e) {
        console.warn('CloudStorage read failed:', e);
      }
    }
    const local = localStorage.getItem(key);
    return local ? JSON.parse(local) : null;
  },

  set: async (key: string, value: any): Promise<boolean> => {
    // SECURITY DISCLAIMER: Passwords and PII inside UserProfile are serialized as plaintext.
    // In a production environment with strict security requirements, sensitive fields should be 
    // encrypted (e.g. using AES) before being stored in localStorage / Telegram CloudStorage.
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    if (isCloudStorageSupported()) {
      try {
        await new Promise((resolve) => {
          window.Telegram!.WebApp.CloudStorage.setItem(key, stringValue, (err, stored) => {
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