// src/components/hero/Hero.tsx
"use client";

import { useLocale } from "next-intl";
import HeroBackground from "./HeroBackground";
import HeroHeadline from "./HeroHeadline";
import HeroSearch from "./HeroSearch";
import { brandName, heroHeadlines, type SupportedLocale } from "./messages";
import styles from "./Hero.module.css";

export default function Hero() {
  const locale = useLocale() as SupportedLocale;
  const headlines = heroHeadlines[locale] ?? heroHeadlines.en;
  const brand = brandName[locale] ?? brandName.en;

  return (
    <section className={styles.region}>
      <HeroBackground height="full" />

      <div className={styles.content}>
        <p className={styles.brand}>{brand}</p>
        <HeroHeadline items={headlines} />
        <HeroSearch />
      </div>
    </section>
  );
}
