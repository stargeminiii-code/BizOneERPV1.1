import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { vi } from './vi';
import { en } from './en';

export type Language = 'vi' | 'en';

export const LANGUAGE_STORAGE_KEY = 'bizone_language';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof vi>;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatDate: (dateStr: string | Date | undefined | null, includeTime?: boolean) => string;
  formatNumber: (value: number, decimals?: number) => string;
  getLocalized: <T extends Record<string, any>>(obj: T | null | undefined, fieldPrefix?: string) => string;
}

const translations: Record<Language, any> = {
  vi,
  en
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'en' || saved === 'vi') {
        return saved;
      }
    } catch {}
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      const currentDict = translations[language] || translations.vi;
      const val = getNestedValue(currentDict, key);
      if (val !== undefined) return val;

      // Fallback to Vietnamese dictionary
      const fallbackVal = getNestedValue(translations.vi, key);
      if (fallbackVal !== undefined) return fallbackVal;

      return fallback || key;
    };
  }, [language]);

  const formatCurrency = useMemo(() => {
    return (amount: number, currencyCode?: string): string => {
      const safeAmount = Number.isFinite(amount) ? amount : 0;
      if (language === 'vi') {
        const formatted = new Intl.NumberFormat('vi-VN').format(safeAmount);
        return currencyCode ? `${formatted} ${currencyCode}` : `${formatted} ₫`;
      } else {
        const formatted = new Intl.NumberFormat('en-US').format(safeAmount);
        return currencyCode ? `${formatted} ${currencyCode}` : `${formatted} VND`;
      }
    };
  }, [language]);

  const formatDate = useMemo(() => {
    return (dateStr: string | Date | undefined | null, includeTime: boolean = false): string => {
      if (!dateStr) return '';
      try {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        if (isNaN(date.getTime())) {
          return String(dateStr);
        }

        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');

        if (language === 'vi') {
          const datePart = `${d}/${m}/${y}`;
          return includeTime ? `${datePart} ${hh}:${mm}` : datePart;
        } else {
          const datePart = `${m}/${d}/${y}`;
          return includeTime ? `${datePart} ${hh}:${mm}` : datePart;
        }
      } catch {
        return String(dateStr);
      }
    };
  }, [language]);

  const formatNumber = useMemo(() => {
    return (value: number, decimals: number = 0): string => {
      const safeVal = Number.isFinite(value) ? value : 0;
      if (language === 'vi') {
        return new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(safeVal);
      } else {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(safeVal);
      }
    };
  }, [language]);

  const getLocalized = useMemo(() => {
    return <T extends Record<string, any>>(obj: T | null | undefined, fieldPrefix: string = 'name'): string => {
      if (!obj) return '';
      if (typeof obj === 'string') return obj;

      // Case 1: object has name_vi / name_en or fieldPrefix_vi / fieldPrefix_en
      const keyLang = `${fieldPrefix}_${language}`;
      const keyVi = `${fieldPrefix}_vi`;
      const keyDefault = fieldPrefix;

      if (obj[keyLang]) return String(obj[keyLang]);
      if (obj[keyVi]) return String(obj[keyVi]);
      if (obj[keyDefault]) {
        // If it's a localized object { vi: '...', en: '...' }
        if (typeof obj[keyDefault] === 'object' && obj[keyDefault] !== null) {
          return obj[keyDefault][language] || obj[keyDefault].vi || '';
        }
        return String(obj[keyDefault]);
      }

      // Case 2: obj is { vi: '...', en: '...' }
      if (obj[language]) return String(obj[language]);
      if (obj.vi) return String(obj.vi);

      return '';
    };
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
    getLocalized
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = useLanguage;
