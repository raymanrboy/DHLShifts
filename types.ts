// @wiki: technical/symbol-map.md (API contracts), concepts/telegram-integration.md (Haptics/Cloud interfaces)
export interface ShiftData {
  date: string;        // "YYYY-MM-DD" — also used as key
  isWorkDay: boolean;
  startTime: string;   // Planned start "HH:mm"
  endTime: string;     // Planned end "HH:mm"
  actualStartTime?: string; // Actual start (only if different from plan)
  actualEndTime?: string;   // Actual end (only if different from plan)
  isCompleted: boolean;
}

export type Language = 'PL' | 'EN' | 'UA';

export interface UserProfile {
  email: string;
  login: string;
  password?: string;
  language?: Language;
}

// Minimal Telegram WebApp types
export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
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
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
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
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}