// src/components/deals/DealsHero.tsx

"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { Flame } from "lucide-react";

import ShopSearch from "@/components/shop/Search";
import ShopCategoryTabs, {
  type CategoryTab,
} from "@/components/shop/ShopCategoryTabs";
import { glowForCategory } from "@/components/shop/categoryGlow";
import type { CategoryFacetNode, Locale } from "@/lib/shop/types";
import styles from "@/components/shop/ShopHero.module.css";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

/** Hot orange for "all deals"; a category swaps in its own light. */
const DEALS_GLOW = "255,132,64";
const glowFor = (slug: string | null) =>
  slug ? glowForCategory(slug) : DEALS_GLOW;

const COPY = {
  brand: { en: "Dorkari Jinish", bn: "দরকারি জিনিশ" },
  headline: { en: "Hot Deals", bn: "সেরা ডিল" },
  sub: {
    en: "Our biggest discounts, sorted by highest savings.",
    bn: "সর্বোচ্চ ছাড়ের পণ্যগুলো এক জায়গায়।",
  },
  all: { en: "All", bn: "সব" },
  categories: { en: "Categories", bn: "ক্যাটাগরি" },
  placeholder: { en: "Search deals…", bn: "ডিল খুঁজুন…" },
};

type DealsHeroProps = {
  locale: Locale;
  dealCount: number;
  maxDiscount: number;
  query: string;
  onQueryChange: (value: string) => void;
  onSearchSubmit?: () => void;
  categoryFacets: CategoryFacetNode[];
  topCategorySlugs: string[];
  activeCategory: string | null;
  onCategoryChange: (value: string | null) => void;
};

export default function DealsHero({
  locale,
  dealCount,
  maxDiscount,
  query,
  onQueryChange,
  onSearchSubmit,
  categoryFacets,
  topCategorySlugs,
  activeCategory,
  onCategoryChange,
}: DealsHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const glowA = useRef<HTMLDivElement>(null);
  const glowB = useRef<HTMLDivElement>(null);
  const glowIdx = useRef(0);
  const prevCategory = useRef(activeCategory);

  // Constant across renders so React never overwrites what GSAP animates.
  const [initialRgb] = useState(() => glowFor(activeCategory));

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
    if (prevCategory.current === activeCategory) return;
    prevCategory.current = activeCategory;

    const root = rootRef.current;
    const a = glowA.current;
    const b = glowB.current;
    if (!root || !a || !b) return;

    const rgb = glowFor(activeCategory);
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

  const nf = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US");
  const bn = locale === "bn";

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
          <Flame
            aria-hidden
            className="mr-2 inline-block h-[0.8em] w-[0.8em] -translate-y-[0.06em] text-brand-accent"
            strokeWidth={1.8}
          />
          {COPY.headline[locale]}
        </h1>

        <p
          data-in
          className={`mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-brand-text-secondary ${
            bn ? "tracking-normal" : ""
          }`}
        >
          {COPY.sub[locale]}
        </p>

        {dealCount > 0 && (
          <p data-in className={styles.countChip}>
            <span className={styles.countDot} />
            {bn
              ? `${nf.format(dealCount)}টি ডিল · সর্বোচ্চ ${nf.format(maxDiscount)}% ছাড়`
              : `${nf.format(dealCount)} deals · up to ${nf.format(maxDiscount)}% off`}
          </p>
        )}

        <div data-in className={styles.searchWrap}>
          <ShopSearch
            locale={locale}
            variant="onLight"
            value={query}
            onChange={onQueryChange}
            onSubmit={onSearchSubmit}
            placeholder={COPY.placeholder[locale]}
          />
        </div>

        {tabs.length > 0 && (
          <div data-in className={styles.tabsWrap}>
            <ShopCategoryTabs
              tabs={tabs}
              active={activeCategory}
              onChange={onCategoryChange}
              allLabel={COPY.all[locale]}
              groupLabel={COPY.categories[locale]}
            />
          </div>
        )}
      </div>
    </section>
  );
}
