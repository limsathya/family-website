"use client";

import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";

/**
 * Returns the user's name in the current language.
 * Falls back: current lang name → English name → any available name → "".
 */
export function useDisplayName(): string {
  const { user } = useAuth();
  const { lang: language } = useLanguage();

  if (!user) return "";

  if (language === "zh" && user.name_zh) return user.name_zh;
  if (language === "km" && user.name_km) return user.name_km;
  return user.name;
}

/**
 * Given a user-like object with optional name_zh/name_km,
 * returns the best display name for the given language.
 * Useful for displaying other users (e.g. admin user list, chat).
 */
export function getDisplayName(
  name: string,
  nameZh: string | null | undefined,
  nameKm: string | null | undefined,
  lang: string
): string {
  if (lang === "zh" && nameZh) return nameZh;
  if (lang === "km" && nameKm) return nameKm;
  return name;
}
