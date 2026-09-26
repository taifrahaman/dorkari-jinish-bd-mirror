// src/components/shop/index.tsx

"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

import {
  applyFilters,
  getBrandFacets,
  getCategoryFacets,
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

// imports
import { useLoadMore } from "@/hooks/use-load-more";

const PAGE_SIZE = 24;

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
  const { products, isLoading } = useShopCatalog();

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

  // Exactly what the grid should show, in order. ProductGrid diffs this
  // list by `id` and animates the difference. (.filter() returns a fresh
  // array, so sortProducts never touches the catalog itself.)
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

  // Chips and toolbar respond instantly; the grid re-renders at lower priority.
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

  const activeCategory =
    filters.categories.length === 1 ? filters.categories[0] : null;
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
                // Keyed off the urgent `results` (not the deferred list) so
                // "no results" can't flash while the grid is catching up.
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
        resultCount={results.length}
        priceMax={priceMax}
      />
    </div>
  );
}
