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

// Minimal Telegram WebApp types
export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebAppInitData {
  user?: TelegramWebAppUser;
}

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramHapticFeedback {
  impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => TelegramHapticFeedback;
  notificationOccurred: (type: 'error' | 'success' | 'warning') => TelegramHapticFeedback;
  selectionChanged: () => TelegramHapticFeedback;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  isExpanded: boolean;
  viewportHeight: number;
  isVersionAtLeast: (version: string) => boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation: () => void;
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (err: Error | null, stored: boolean) => void) => void;
    getItem: (key: string, callback: (err: Error | null, value: string | null) => void) => void;
  };
  HapticFeedback: TelegramHapticFeedback;
  showAlert: (message: string, callback?: () => void) => void;
  onEvent: (eventType: string, eventHandler: () => void) => void;
  offEvent: (eventType: string, eventHandler: () => void) => void;
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}