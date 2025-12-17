import { RATES, TIME_ZONES } from './constants';
import { EarningsResult, ShiftData } from './types';

/**
 * Parses "HH:mm" string to decimal hours (e.g., "02:30" -> 2.5)
 */
export const timeToDecimal = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
};

/**
 * Converts decimal hours back to "HH:mm"
 */
export const decimalToTime = (decimal: number): string => {
  let normalized = decimal;
  if (normalized < 0) normalized += 24;
  if (normalized >= 24) normalized -= 24;
  
  const hours = Math.floor(normalized);
  const minutes = Math.round((normalized - hours) * 60);
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
export const calculateEarnings = (startStr: string, endStr: string): EarningsResult => {
  let start = timeToDecimal(startStr);
  let end = timeToDecimal(endStr);

  // Handle overnight shifts (e.g. 22:00 to 06:00) by adding 24 to end if it's smaller
  if (end < start) {
    end += 24;
  }

  const shiftDuration = end - start;
  if (shiftDuration <= 0) return { dayHours: 0, nightHours: 0, totalPay: 0 };

  let nightHours = 0;
  let dayHours = 0;
  
  const nightZone1_Start = 0;
  const nightZone1_End = TIME_ZONES.NIGHT_END; // 6
  const dayZone_Start = TIME_ZONES.NIGHT_END; // 6
  const dayZone_End = 24;
  const nightZone2_Start = 24;
  const nightZone2_End = 24 + TIME_ZONES.NIGHT_END; // 30

  // Helper to get overlap
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

  const totalPay = (nightHours * RATES.NIGHT) + (dayHours * RATES.DAY);

  return {
    dayHours,
    nightHours,
    totalPay
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(amount);
};

// --- Cloud Storage Helpers ---

const isCloudStorageSupported = (): boolean => {
  const tg = window.Telegram?.WebApp;
  // CloudStorage was introduced in Bot API 6.9
  return tg && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.9');
};

export const storage = {
  // Try to use Telegram CloudStorage, fallback to localStorage
  get: async (key: string): Promise<any | null> => {
    // 1. Always attempt to read from localStorage first for immediate data
    const local = localStorage.getItem(key);
    let data = local ? JSON.parse(local) : null;

    // 2. If CloudStorage is supported, try to sync/fetch from there
    if (isCloudStorageSupported()) {
      try {
        const cloudValue = await new Promise<string | null>((resolve) => {
           window.Telegram.WebApp.CloudStorage.getItem(key, (err, value) => {
              if (err) {
                // If error occurs (e.g. timeout), just resolve null and use local
                console.warn('CloudStorage read error:', err);
                resolve(null);
              } else {
                resolve(value);
              }
           });
        });

        if (cloudValue) {
          // If we got data from cloud, use it (it's the source of truth)
          try {
            data = JSON.parse(cloudValue);
            // Optionally update local cache
            localStorage.setItem(key, cloudValue);
          } catch (e) {
            console.error('Failed to parse cloud data', e);
          }
        }
      } catch (e) {
        console.warn('CloudStorage access failed:', e);
      }
    }
    
    return data;
  },

  set: async (key: string, value: any): Promise<boolean> => {
    const stringValue = JSON.stringify(value);
    
    // 1. Save to local storage
    try {
        localStorage.setItem(key, stringValue);
    } catch (e) {
        console.error('LocalStorage write error:', e);
    }

    // 2. Sync to CloudStorage if supported
    if (isCloudStorageSupported()) {
      try {
        return new Promise((resolve) => {
          window.Telegram.WebApp.CloudStorage.setItem(key, stringValue, (err, stored) => {
            if (err) {
              console.warn('CloudStorage write error:', err);
              resolve(false);
            } else {
              resolve(stored);
            }
          });
        });
      } catch (e) {
        console.warn('CloudStorage access failed:', e);
        return false;
      }
    }
    
    return true;
  }
};