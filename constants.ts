import { Rates } from './types';

export const DEFAULT_RATES: Rates = {
  day: 34.00,       // 06:00 - 00:00
  night: 37.70,     // 00:00 - 06:00
};

export const DEFAULT_SHIFT = {
  START: "02:00",
  END: "10:00",
};

export const TIME_ZONES = {
  NIGHT_END: 6, // 6 AM
};