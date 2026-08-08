import { createContext, useContext, useState, type ReactNode } from 'react';
import { translations, type Language } from './translations';

export const LANGUAGES: { code: Language; nativeName: string }[] = [
  { code: 'sq', nativeName: 'Shqip' },
  { code: 'en', nativeName: 'English' },
  { code: 'de', nativeName: 'Deutsch' },
];

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'studenthub_language';

function detectInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && translations[stored]) return stored;
  const browser = navigator.language.slice(0, 2);
  if (browser === 'sq' || browser === 'de' || browser === 'en') return browser as Language;
  return 'sq';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] ?? translations.en[key] ?? key;
  };

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
