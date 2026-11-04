// src/components/deals/DealsPage.tsx

"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

import { useShopCatalog } from "@/hooks/use-shop-catalog";
import { useLoadMore } from "@/hooks/use-load-more";
import {
  applyFilters,
  getCategoryFacets,
  getTopCategorySlugs,
  sortProducts,
} from "@/lib/shop/filter-utils";
import { matchesQuery } from "@/lib/shop/search";
import { DEFAULT_FILTERS } from "@/lib/shop/types";
import type { Locale, ShopProduct, SortOption } from "@/lib/shop/types";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductGridSkeleton from "@/components/shop/ProductGridSkeleton";
import SortMenu from "@/components/shop/SortMenu";
import DealsHero from "./DealsHero";

const PAGE_SIZE = 24;
const TAB_LIMIT = 24;
/** Discount tiers offered as quick filters. Tiers that change nothing are hidden. */
const TIERS = [10, 20, 30, 50];

type DealsPageProps = {
  locale: Locale;
  initialCategory?: string | null;
  initialQuery?: string;
};

function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const discountOf = (p: ShopProduct) =>
  p.originalPrice && p.originalPrice > p.price
    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
    : 0;

function Chip({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-11 flex-none items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-300 active:scale-95 ${
        active
          ? "bg-brand-primary text-white shadow-[0_10px_24px_-10px_rgba(23,38,66,0.6)]"
          : "bg-brand-surface text-brand-text ring-1 ring-brand-border hover:-translate-y-0.5 hover:ring-brand-accent"
      }`}
    >
      {children}
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none ${
            active
              ? "bg-brand-accent text-brand-primary"
              : "bg-brand-navbar text-brand-text-secondary"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function DealsPage({
  locale,
  initialCategory = null,
  initialQuery = "",
}: DealsPageProps) {
  const bn = locale === "bn";
  const nf = new Intl.NumberFormat(bn ? "bn-BD" : "en-US");

  const { products, isLoading } = useShopCatalog(locale);

  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory,
  );
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [sort, setSort] = useState<SortOption>("discount");
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounced(query);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Deals = products with a compare price above the selling price.
  const deals = useMemo(
    () => products.filter((p) => discountOf(p) > 0),
    [products],
  );

  const maxDiscount = useMemo(
    () => deals.reduce((m, p) => Math.max(m, discountOf(p)), 0),
    [deals],
  );

  const categoryFacets = useMemo(
    () => getCategoryFacets(deals, DEFAULT_FILTERS),
    [deals],
  );
  const topCategorySlugs = useMemo(
    () => getTopCategorySlugs(deals, TAB_LIMIT),
    [deals],
  );

  // Tiers that actually narrow the list (and aren't empty).
  const tiers = useMemo(
    () =>
      TIERS.map((t) => ({
        value: t,
        count: deals.filter((p) => discountOf(p) >= t).length,
      })).filter((t) => t.count > 0 && t.count < deals.length),
    [deals],
  );

  /*
   * Derive the valid category instead of using setState in useEffect.
   * This fixes the React 19 cascading render warning and keeps the UI clean.
   */
  const validActiveCategory = useMemo(() => {
    if (isLoading) return activeCategory;
    if (!activeCategory) return null;
    const known = categoryFacets.some(
      (f) =>
        f.value === activeCategory ||
        f.children?.some((c) => c.value === activeCategory),
    );
    return known ? activeCategory : null;
  }, [isLoading, activeCategory, categoryFacets]);

  // The tab to light up: the root that holds the selected slug (root or child).
  const activeTab = useMemo(() => {
    if (!validActiveCategory) return null;
    return (
      categoryFacets.find(
        (r) =>
          r.value === validActiveCategory ||
          r.children?.some((c) => c.value === validActiveCategory),
      )?.value ?? null
    );
  }, [validActiveCategory, categoryFacets]);

  const results = useMemo(() => {
    const byCategory = applyFilters(deals, {
      ...DEFAULT_FILTERS,
      categories: validActiveCategory ? [validActiveCategory] : [],
    });
    return sortProducts(
      byCategory
        .filter((p) => (minDiscount ? discountOf(p) >= minDiscount : true))
        .filter((p) => matchesQuery(p, debouncedQuery)),
      sort,
    );
  }, [deals, validActiveCategory, minDiscount, debouncedQuery, sort]);

  const resetKey = useMemo(
    () =>
      JSON.stringify([validActiveCategory, minDiscount, sort, debouncedQuery]),
    [validActiveCategory, minDiscount, sort, debouncedQuery],
  );
  const { visible, hasMore, sentinelRef } = useLoadMore(
    results,
    resetKey,
    PAGE_SIZE,
  );
  const gridProducts = useDeferredValue(visible);

  /* Keep the address bar in sync (shareable links) without a navigation. */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (validActiveCategory)
      url.searchParams.set("category", validActiveCategory);
    else url.searchParams.delete("category");

    const q = debouncedQuery.trim();
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");

    const next = url.pathname + url.search + url.hash;
    const current =
      window.location.pathname + window.location.search + window.location.hash;
    if (next !== current) {
      window.history.replaceState(window.history.state, "", next);
    }
  }, [validActiveCategory, debouncedQuery]);

  const hasActive =
    validActiveCategory !== null || minDiscount !== null || query.trim() !== "";

  const handleClear = () => {
    setActiveCategory(null);
    setMinDiscount(null);
    setQuery("");
  };

  const empty =
    results.length === 0 ? (
      <div className="flex flex-col items-center gap-3 rounded-3xl bg-brand-surface px-6 py-16 text-center ring-1 ring-brand-primary/6">
        <Flame
          className="h-9 w-9 text-brand-text-secondary opacity-60"
          strokeWidth={1.5}
        />
        <p className="font-heading text-base font-bold text-brand-text">
          {hasActive
            ? bn
              ? "কোনো ডিল মেলেনি"
              : "No deals match your filters"
            : bn
              ? "এই মুহূর্তে কোনো ডিল নেই"
              : "No deals right now"}
        </p>
        <p className="max-w-xs text-sm text-brand-text-secondary">
          {hasActive
            ? bn
              ? "কিছু ফিল্টার সরিয়ে আবার চেষ্টা করুন।"
              : "Try removing a filter or two to see more deals."
            : bn
              ? "পরে আবার চেক করুন, নতুন ডিল আসছে!"
              : "Check back soon, new deals are on the way!"}
        </p>
        {hasActive ? (
          <button
            type="button"
            onClick={handleClear}
            className="mt-1 min-h-11 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition active:scale-95 hover:bg-brand-primary-dark"
          >
            {bn ? "সব ফিল্টার মুছুন" : "Clear all filters"}
          </button>
        ) : (
          <Link
            href={`/${locale}/shop`}
            className="mt-1 inline-flex min-h-11 items-center rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition active:scale-95 hover:bg-brand-primary-dark"
          >
            {bn ? "দোকান দেখুন" : "Browse shop"}
          </Link>
        )}
      </div>
    ) : undefined;

  return (
    <div className="[--shop-nav:4.5rem] lg:[--shop-nav:5.75rem]">
      <DealsHero
        locale={locale}
        dealCount={isLoading ? 0 : deals.length}
        maxDiscount={maxDiscount}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={() =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        categoryFacets={categoryFacets}
        topCategorySlugs={topCategorySlugs}
        activeCategory={activeTab}
        onCategoryChange={setActiveCategory}
      />

      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-2 sm:px-6 lg:px-8">
        <div
          ref={resultsRef}
          className="scroll-mt-[calc(var(--shop-nav)+0.5rem)]"
        >
          {/* discount tiers: one scrollable row on phones */}
          {tiers.length > 0 && (
            <div
              role="group"
              aria-label={bn ? "ছাড়ের হার" : "Discount"}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              <Chip
                active={minDiscount === null}
                onClick={() => setMinDiscount(null)}
              >
                {bn ? "সব ডিল" : "All deals"}
              </Chip>

              {tiers.map((t) => (
                <Chip
                  key={t.value}
                  active={minDiscount === t.value}
                  count={t.count}
                  onClick={() =>
                    setMinDiscount(minDiscount === t.value ? null : t.value)
                  }
                >
                  {bn
                    ? `${nf.format(t.value)}%+ ছাড়`
                    : `${nf.format(t.value)}%+ off`}
                </Chip>
              ))}

              {hasActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex min-h-11 flex-none items-center rounded-full px-3 text-sm font-semibold text-brand-text-secondary underline-offset-4 transition active:scale-95 hover:text-brand-text hover:underline"
                >
                  {bn ? "মুছুন" : "Clear"}
                </button>
              )}
            </div>
          )}

          {/* sticky toolbar, same as the shop */}
          <div className="sticky top-[var(--shop-nav)] z-30 -mx-4 mt-3 flex items-center justify-between gap-3 border-b border-brand-border bg-brand-background/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <p
              aria-live="polite"
              className="whitespace-nowrap text-sm text-brand-text-secondary"
            >
              <span className="mr-1 font-semibold tabular-nums text-brand-text">
                {nf.format(results.length)}
              </span>
              {bn ? "টি ডিল" : results.length === 1 ? "deal" : "deals"}
            </p>

            <SortMenu value={sort} onChange={setSort} locale={locale} />
          </div>

          <div className="pt-4">
            {isLoading ? (
              <ProductGridSkeleton />
            ) : (
              <>
                <ProductGrid
                  products={gridProducts}
                  locale={locale}
                  empty={empty}
                />
                {hasMore && (
                  <div ref={sentinelRef} aria-hidden className="h-24" />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
