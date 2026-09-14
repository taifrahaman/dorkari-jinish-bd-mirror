// src/components/home/MobileHero.tsx

"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import LanguageSwitcher from "@/components/navigation/mobile/language/LanguageSwitcher";
import MobileHeaderNotification from "@/components/navigation/mobile/header/MobileHeaderNotification";
import {
  announcementMessages,
  brandName,
  type SupportedLocale,
} from "@/components/navigation/mobile/constants/announcementMessages";
import AnimatedRotatingHeadline from "./AnimatedRotatingHeadline";
import styles from "./MobileHero.module.css";

const ROTATION_INTERVAL = 6000;

export default function MobileHero() {
  const locale = useLocale();
  const key = (locale as SupportedLocale) ?? "en";

  const brand = brandName[key] ?? brandName.en;

  const taglines = useMemo(() => {
    const messages = announcementMessages[key] ?? announcementMessages.en;
    return messages.map((m) => m.title);
  }, [key]);

  return (
    <section className={styles.hero} aria-label="Promotion">
      <div className={styles.row}>
        <div className={styles.textBlock}>
          <span className={styles.brand}>{brand}</span>
          <AnimatedRotatingHeadline
            items={taglines}
            interval={ROTATION_INTERVAL}
            className={styles.headline}
          />
        </div>

        <div className={styles.actions}>
          <LanguageSwitcher />
          <MobileHeaderNotification />
        </div>
      </div>
    </section>
  );
}
