import { RATES, TIME_ZONES } from './constants';
import { EarningsResult } from './types';

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
 * Assumes shifts are within a single 24h period or wrap simply.
 * For this specific app logic:
 * Night Rate: 00:00 - 06:00
 * Day Rate: 06:00 - 24:00
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

  // We analyze the shift hour by hour (or segment by segment)
  // Simplified logic for the specified rules:
  // We need to calculate intersection of [start, end] with [0, 6] (Night) and [6, 24] (Day)
  // Since we might go past 24 (next day), we treat:
  // 00:00-06:00 (Day 1) -> Night
  // 06:00-24:00 (Day 1) -> Day
  // 24:00-30:00 (Day 2 00:00-06:00) -> Night
  
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
  
  // Edge case: if shift goes beyond 30 (next day 6am), remaining is day. 
  // But standard usage described usually fits 02:00-10:00. 
  // If end > 30, add to day.
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
  return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'PLN' }).format(amount);
};
