// src/components/hero/messages.ts

export const brandName = {
  bn: "দরকারি জিনিশ",
  en: "Dorkari Jinish",
} as const;

export type SupportedLocale = keyof typeof brandName;

export const heroHeadlines: Record<SupportedLocale, string[]> = {
  en: [
    "Everything your home runs on",
    "Appliances, lighting, wiring — sorted",
    "Built for Bangladeshi homes",
    "Quality you can switch on",
  ],
  bn: [
    "ঘরের প্রতিটি প্রয়োজন, এক জায়গায়",
    "অ্যাপ্লায়েন্স, লাইট, ওয়্যারিং — সব এখানে",
    "বাংলাদেশের ঘরের জন্য তৈরি",
    "ভরসার বিদ্যুৎ, ভরসার কেনাকাটা",
  ],
};

export const heroSearchPlaceholder: Record<SupportedLocale, string> = {
  en: "Search appliances, lighting, wiring…",
  bn: "অ্যাপ্লায়েন্স, লাইট, ওয়্যারিং খুঁজুন…",
};

export const heroFilterAllLabel: Record<SupportedLocale, string> = {
  en: "All Categories",
  bn: "সব ক্যাটাগরি",
};
