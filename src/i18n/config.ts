// src/i18n/config.ts

export type Locale = (typeof locales)[number];

export const locales = ["bn", "en"] as const;
export const defaultLocale: Locale = "bn";

export const localeNames: Record<Locale, string> = {
  bn: "বাংলা",
  en: "English",
};
