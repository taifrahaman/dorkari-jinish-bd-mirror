// src/components/home/bazaar/AnnouncementTicker.tsx
import type { Lang } from "@/components/home-hero/heroCollections";
import styles from "./AnnouncementTicker.module.css";

const MESSAGES: Record<Lang, string[]> = {
  bn: [
    "সারা দেশে ডেলিভারি",
    "ক্যাশ অন ডেলিভারি",
    "প্রতি সপ্তাহে নতুন অফার",
    "দরকারি সবকিছু এক জায়গায়",
  ],
  en: [
    "Delivery across Bangladesh",
    "Cash on delivery",
    "New offers every week",
    "Everything you need, in one place",
  ],
};

/** The list is repeated so the loop never shows a gap, even on wide screens. */
const COPIES = 6;

export default function AnnouncementTicker({ locale }: { locale: Lang }) {
  const items = MESSAGES[locale];
  return (
    <div
      className={styles.bar}
      role="region"
      aria-label={locale === "bn" ? "ঘোষণা" : "Announcements"}
    >
      <div className={styles.track}>
        {Array.from({ length: COPIES }, (_, n) => (
          <ul
            key={n}
            className={`${styles.list} ${n > 0 ? styles.dupe : ""}`}
            aria-hidden={n > 0 ? true : undefined}
          >
            {items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
