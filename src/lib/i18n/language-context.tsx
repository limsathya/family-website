"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { en } from "./en";
import { zh } from "./zh";
import { km } from "./km";

export type Language = "en" | "zh" | "km";

const translations = { en, zh, km };

const LANG_STORAGE_KEY = "family-lang";

function getInitialLang(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language | null;
  if (stored && translations[stored]) return stored;
  // Detect browser language
  const browserLang = navigator.language.split("-")[0];
  if (browserLang === "zh") return "zh";
  if (browserLang === "km") return "km";
  return "en";
}

type TranslationKey = keyof typeof en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey | string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => (en as Record<string, string>)[key] || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    setLangState(getInitialLang());
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_STORAGE_KEY, newLang);
    document.documentElement.lang = newLang === "zh" ? "zh-CN" : newLang === "km" ? "km" : "en";
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = translations[lang] as unknown as Record<string, string>;
      const fallback = en as unknown as Record<string, string>;
      return dict[key] || fallback[key] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  return useContext(LanguageContext).t;
}
