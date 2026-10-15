// src/components/shop/index.tsx

"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  applyFilters,
  getBrandFacets,
  getCategoryFacets,
  getColorFacets,
  getTopCategorySlugs,
  sortProducts,
} from "@/lib/shop/filter-utils";
import { matchesQuery } from "@/lib/shop/search";
import { countActiveFilters, DEFAULT_FILTERS } from "@/lib/shop/types";
import type { FilterState, Locale, SortOption } from "@/lib/shop/types";
import { useShopCatalog } from "@/hooks/use-shop-catalog";

import ShopHero from "./ShopHero";
import FilterBar from "./FilterBar";
import FilterPanel from "./Filterpanel";
import ActiveFilterPills from "./ActiveFilterPills";
import ProductGrid from "./ProductGrid";
import ProductGridSkeleton from "./ProductGridSkeleton";
import EmptyState from "./EmptyState";

import { useLoadMore } from "@/hooks/use-load-more";

const PAGE_SIZE = 24;
const TOP_CATEGORY_COUNT = 6;

type ShopPageProps = {
  locale?: Locale;
};

function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ShopPage({ locale = "en" }: ShopPageProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("featured");
  const [panelOpen, setPanelOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Full catalog. Loaded once. Everything below is derived in-memory.
  const { products, isLoading } = useShopCatalog(locale);

  const priceMax = useMemo(
    () => (products.length ? Math.max(...products.map((p) => p.price)) : 0),
    [products],
  );

  const categoryFacets = useMemo(
    () => getCategoryFacets(products, filters),
    [products, filters],
  );
  const brandFacets = useMemo(
    () => getBrandFacets(products, filters),
    [products, filters],
  );
  const colorFacets = useMemo(
    () => getColorFacets(products, filters),
    [products, filters],
  );

  // Stable "top 6" chips — recomputed only when the catalog itself changes,
  // not on every filter tweak, so chip order doesn't jump around.
  const topCategorySlugs = useMemo(
    () => getTopCategorySlugs(products, TOP_CATEGORY_COUNT),
    [products],
  );

  const results = useMemo(
    () =>
      sortProducts(
        applyFilters(products, filters).filter((p) =>
          matchesQuery(p, debouncedQuery),
        ),
        sort,
      ),
    [products, filters, debouncedQuery, sort],
  );

  const resetKey = useMemo(
    () => JSON.stringify([filters, sort, debouncedQuery]),
    [filters, sort, debouncedQuery],
  );
  const { visible, hasMore, sentinelRef } = useLoadMore(
    results,
    resetKey,
    PAGE_SIZE,
  );
  const gridProducts = useDeferredValue(visible);

  // A root chip lights up when every selected category belongs to it
  // (either the root itself, or one/more of its children).
  const activeCategory = useMemo(() => {
    if (filters.categories.length === 0) return null;

    const roots = new Set<string>();
    for (const slug of filters.categories) {
      const root = categoryFacets.find(
        (r) => r.value === slug || r.children?.some((c) => c.value === slug),
      );
      if (!root) return null;
      roots.add(root.value);
    }

    return roots.size === 1 ? [...roots][0] : null;
  }, [filters.categories, categoryFacets]);

  const activeFilterCount = countActiveFilters(filters);

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-[calc(var(--shop-nav)+1rem)] [--shop-nav:4.5rem] sm:px-6 lg:px-8 lg:[--shop-nav:5.75rem]">
      <ShopHero
        locale={locale}
        productCount={isLoading ? 0 : products.length}
        query={query}
        onQueryChange={setQuery}
        onSearchSubmit={() =>
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      />

      <div
        ref={resultsRef}
        className="scroll-mt-[calc(var(--shop-nav)+0.5rem)]"
      >
        <FilterBar
          locale={locale}
          categoryFacets={categoryFacets}
          topCategorySlugs={topCategorySlugs}
          activeCategory={activeCategory}
          onCategoryChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              categories: value ? [value] : [],
            }))
          }
          onOpenFilters={() => setPanelOpen(true)}
          activeFilterCount={activeFilterCount}
          sort={sort}
          onSortChange={setSort}
          resultCount={results.length}
        />

        {activeFilterCount > 0 && (
          <div className="py-3">
            <ActiveFilterPills
              locale={locale}
              filters={filters}
              onChange={setFilters}
              categoryFacets={categoryFacets}
              brandFacets={brandFacets}
              colorFacets={colorFacets}
            />
          </div>
        )}

        <div className="pt-4">
          {isLoading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid
                products={gridProducts}
                locale={locale}
                empty={
                  results.length === 0 ? (
                    <EmptyState locale={locale} onClear={handleClear} />
                  ) : undefined
                }
              />
              {hasMore && (
                <div ref={sentinelRef} aria-hidden className="h-24" />
              )}
            </>
          )}
        </div>
      </div>

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        locale={locale}
        filters={filters}
        onChange={setFilters}
        onClear={handleClear}
        categoryFacets={categoryFacets}
        brandFacets={brandFacets}
        colorFacets={colorFacets}
        resultCount={results.length}
        priceMax={priceMax}
      />
    </div>
  );
}
