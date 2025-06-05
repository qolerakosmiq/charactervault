
'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageCode } from '@/i18n/config';
import { loadLocaleData } from '@/i18n/loadLocaleData';
import { processRawDataBundle, type LocaleDataBundle, type ProcessedSiteData } from '@/i18n/i18n-data';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  translations: ProcessedSiteData | null;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'dnd_app_language';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as LanguageCode;
      return SUPPORTED_LANGUAGES.find(l => l.code === storedLang)?.code || DEFAULT_LANGUAGE;
    }
    return DEFAULT_LANGUAGE;
  });
  const [translations, setTranslations] = useState<ProcessedSiteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    loadLocaleData(language)
      .then((bundle) => {
        setTranslations(processRawDataBundle(bundle));
        setIsLoading(false);
      })
      .catch(error => {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to default language if loading fails
        if (language !== DEFAULT_LANGUAGE) {
          setLanguageState(DEFAULT_LANGUAGE); // This will trigger another load
        } else {
          setIsLoading(false); // Avoid infinite loop if default fails
        }
      });
  }, [language]);

  const setLanguage = (newLang: LanguageCode) => {
    if (SUPPORTED_LANGUAGES.find(l => l.code === newLang)) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      setLanguageState(newLang);
    }
  };
  
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    translations,
    isLoading,
  }), [language, translations, isLoading]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
