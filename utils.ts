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

/**
 * Shared haptic feedback utilities.
 * Single source of truth for all Telegram haptic interactions.
 */
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