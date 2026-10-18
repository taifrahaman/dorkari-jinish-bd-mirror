// src/components/shop/ShopHero.tsx

"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";

import ShopSearch from "./Search";
import ShopCategoryTabs, { type CategoryTab } from "./ShopCategoryTabs";
import { glowForCategory } from "./categoryGlow";
import type { CategoryFacetNode, Locale } from "@/lib/shop/types";
import styles from "./ShopHero.module.css";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

const COPY = {
  brand: { en: "Dorkari Jinish", bn: "দরকারি জিনিশ" },
  headline: { en: "Browse everything", bn: "সব পণ্য, এক জায়গায়" },
  all: { en: "All", bn: "সব" },
  categories: { en: "Categories", bn: "ক্যাটাগরি" },
};

const SUGGESTIONS: Record<Locale, string[]> = {
  en: ["Fan", "LED bulb", "Fry pan", "Toy", "Gift"],
  bn: ["ফ্যান", "এলইডি বাল্ব", "ফ্রাই প্যান", "খেলনা", "উপহার"],
};

type ShopHeroProps = {
  locale?: Locale;
  productCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit?: () => void;
  categoryFacets: CategoryFacetNode[];
  topCategorySlugs: string[];
  activeCategory: string | null;
  onCategoryChange: (value: string | null) => void;
};

export default function ShopHero({
  locale = "en",
  productCount,
  query,
  onQueryChange,
  onSearchSubmit,
  categoryFacets,
  topCategorySlugs,
  activeCategory,
  onCategoryChange,
}: ShopHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const glowA = useRef<HTMLDivElement>(null);
  const glowB = useRef<HTMLDivElement>(null);
  const glowIdx = useRef(0);
  const firstRun = useRef(true);

  // Constant across renders so React never overwrites what GSAP animates.
  const [initialRgb] = useState(() => glowForCategory(activeCategory));

  const tabs = useMemo<CategoryTab[]>(
    () =>
      topCategorySlugs
        .map((slug) => categoryFacets.find((f) => f.value === slug))
        .filter((f): f is CategoryFacetNode => Boolean(f))
        .map((f) => ({
          value: f.value,
          label: f.label[locale],
          count: f.count,
          rgb: glowForCategory(f.value),
        })),
    [topCategorySlugs, categoryFacets, locale],
  );

  /* entrance */
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const ctx = gsap.context(() => {
      gsap.from("[data-in]", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.07,
      });
    }, root);

    return () => ctx.revert();
  }, []);

  /* crossfade the glow when the category changes */
  useEffect(() => {
    const root = rootRef.current;
    const a = glowA.current;
    const b = glowB.current;
    if (!root || !a || !b) return;

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const rgb = glowForCategory(activeCategory);
    const layers = [a, b];
    const out = layers[glowIdx.current];
    const inn = layers[1 - glowIdx.current];
    glowIdx.current = 1 - glowIdx.current;

    root.style.setProperty("--rgb", rgb);
    inn.style.setProperty("--rgb", rgb);
    gsap.killTweensOf(layers);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(out, { opacity: 0 });
      gsap.set(inn, { opacity: 0.6, scale: 1 });
      return;
    }

    gsap.to(out, { opacity: 0, duration: 1, ease: "power1.inOut" });
    gsap.fromTo(
      inn,
      { opacity: 0, scale: 0.7 },
      { opacity: 0.6, scale: 1, duration: 1.1, ease: "power3.out" },
    );
  }, [activeCategory]);

  const count = productCount.toLocaleString(
    locale === "bn" ? "bn-BD" : "en-US",
  );

  return (
    <section
      ref={rootRef}
      className={styles.root}
      style={{ "--rgb": initialRgb } as CSSVars}
    >
      <div
        ref={glowA}
        className={styles.glow}
        aria-hidden
        style={{ "--rgb": initialRgb, opacity: 0.6 } as CSSVars}
      />
      <div
        ref={glowB}
        className={styles.glow}
        aria-hidden
        style={{ opacity: 0 }}
      />

      <div className={styles.content}>
        <p data-in className={styles.brand}>
          {COPY.brand[locale]}
        </p>

        <h1 data-in className={styles.headline}>
          {COPY.headline[locale]}
        </h1>

        {productCount > 0 && (
          <p data-in className={styles.countChip}>
            <span className={styles.countDot} />
            {locale === "bn" ? `${count}টি পণ্য` : `${count} products`}
          </p>
        )}

        <div data-in className={styles.searchWrap}>
          <ShopSearch
            locale={locale}
            variant="onLight"
            value={query}
            onChange={onQueryChange}
            onSubmit={onSearchSubmit}
            suggestions={SUGGESTIONS[locale]}
          />
        </div>

        <div data-in className={styles.tabsWrap}>
          <ShopCategoryTabs
            tabs={tabs}
            active={activeCategory}
            onChange={onCategoryChange}
            allLabel={COPY.all[locale]}
            groupLabel={COPY.categories[locale]}
          />
        </div>
      </div>
    </section>
  );
}
