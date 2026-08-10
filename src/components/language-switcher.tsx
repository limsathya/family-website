"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/lib/i18n/language-context";
import { useTranslation } from "@/lib/i18n/language-context";

const LANG_KEYS: Record<Language, string> = {
  en: "lang.en",
  zh: "lang.zh",
  km: "lang.km",
};

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const t = useTranslation();

  const cycle = () => {
    const order: Language[] = ["en", "zh", "km"];
    const idx = order.indexOf(lang);
    setLang(order[(idx + 1) % order.length]);
  };

  return (
    <Button variant="ghost" size="sm" onClick={cycle} className="gap-1 text-xs">
      <Globe className="h-3.5 w-3.5" />
      {t(LANG_KEYS[lang])}
    </Button>
  );
}
