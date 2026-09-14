// src/app/[locale]/page.tsx

import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

import MobileHero from "@/components/home/MobileHero";
import HeroBackground from "@/components/home/HeroBackground";
import styles from "./page.module.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <>
      {/* Hero region — background glow + hero content */}
      <div className={styles.heroRegion}>
        <HeroBackground />

        <div className={styles.heroContent}>
          {/* Search button goes here, above the hero */}
          {/* <MobileSearch /> */}

          <MobileHero />
        </div>
      </div>

      {/* --- existing home content below --- */}
      <section style={{ padding: "1rem", height: "200vh" }}>
        <h2>Featured</h2>
        {/* product grid, categories, etc. */}
      </section>
    </>
  );
}
