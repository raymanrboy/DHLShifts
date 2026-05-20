import React, { createContext, useContext } from 'react';
import { Language } from './types';
import { enUS, pl, uk } from 'date-fns/locale';

export const locales = {
  EN: enUS,
  PL: pl,
  UA: uk,
};

const translations = {
  EN: {
    editProfile: 'Edit Profile',
    setupProfile: 'Setup Profile',
    passwordOptional: 'Password (optional)',
    saveProfile: 'Save Profile',
    planner: 'Planner',
    fact: 'Schedule',
    plan: 'Plan',
    balance: 'Balance',
    hoursShort: 'h',
    autoFillMonth: 'Auto-fill month',
    start: 'Start',
    end: 'End',
    fillMonth: 'Fill month',
    shift: 'Shift',
    newShift: 'New Shift',
    completed: 'Completed',
    saveToPlan: 'Save to plan',
    save: 'Save',
    workEmailLabel: 'Work Email',
    barcodeLabel: 'Barcode',
    loginLabel: 'Login ID',
    passwordLabel: 'Password',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as string[],
  },
  PL: {
    editProfile: 'Edytuj profil',
    setupProfile: 'Ustawienia profilu',
    passwordOptional: 'Hasło (opcjonalnie)',
    saveProfile: 'Zapisz profil',
    planner: 'Planer',
    fact: 'Grafik',
    plan: 'Plan',
    balance: 'Bilans',
    hoursShort: 'g',
    autoFillMonth: 'Autouzupełnianie',
    start: 'Start',
    end: 'Koniec',
    fillMonth: 'Wypełnij',
    shift: 'Zmiana',
    newShift: 'Nowa zmiana',
    completed: 'Ukończono',
    saveToPlan: 'Zapisz w planie',
    save: 'Zapisz',
    workEmailLabel: 'Work Email',
    barcodeLabel: 'Kod kreskowy',
    loginLabel: 'Login ID',
    passwordLabel: 'Hasło',
    days: ['Ndz', 'Pon', 'Wto', 'Śro', 'Czw', 'Pią', 'Sob'] as string[],
  },
  UA: {
    editProfile: 'Редагувати профіль',
    setupProfile: 'Налаштуй профіль',
    passwordOptional: 'Password (опціонально)',
    saveProfile: 'Зберегти профіль',
    planner: 'Планувальник',
    fact: 'Графік',
    plan: 'План',
    balance: 'Баланс',
    hoursShort: 'г',
    autoFillMonth: 'Авто-заповнення місяця',
    start: 'Початок',
    end: 'Кінець',
    fillMonth: 'Заповнити місяць',
    shift: 'Зміна',
    newShift: 'Нова зміна',
    completed: 'Відпрацьовано',
    saveToPlan: 'Зберегти до плану',
    save: 'Зберегти',
    workEmailLabel: 'Work Email',
    barcodeLabel: 'Barcode',
    loginLabel: 'Login ID',
    passwordLabel: 'Password',
    days: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as string[],
  }
};

export type Translations = typeof translations.EN;

interface LanguageContextType {
  language: Language;
  t: (key: keyof Translations) => string | string[];
  locale: any;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'EN',
  t: (key) => translations.EN[key],
  locale: locales.EN,
});

export const useTranslation = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ language: Language; children: React.ReactNode }> = ({ language, children }) => {
  const t = (key: keyof Translations) => {
    return translations[language][key];
  };

  return (
    <LanguageContext.Provider value={{ language, t, locale: locales[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};
