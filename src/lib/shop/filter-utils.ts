// src/lib/shop/filter-utils.ts

import type {
  Facet,
  FilterState,
  Locale,
  ShopProduct,
  SortOption,
} from "./types";
import { BRAND_LIST, CATEGORY_LIST } from "./dummy-products";

/* ------------------------------------------------------------------ */
/* Formatting                                                           */
/* ------------------------------------------------------------------ */

export function formatPrice(price: number, locale: Locale): string {
  const value = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-BD", {
    maximumFractionDigits: 0,
  }).format(price);
  return `৳${value}`;
}

/* ------------------------------------------------------------------ */
/* Filtering                                                            */
/* ------------------------------------------------------------------ */

/**
 * Applies every filter dimension except `except`. Used to compute facet
 * counts that reflect all *other* active filters without a facet
 * shrinking its own option list to just the selected values.
 */
function applyFiltersExcept(
  products: ShopProduct[],
  filters: FilterState,
  except?: keyof FilterState,
): ShopProduct[] {
  return products.filter((p) => {
    if (except !== "categories" && filters.categories.length > 0) {
      if (!filters.categories.includes(p.categorySlug)) return false;
    }
    if (except !== "brands" && filters.brands.length > 0) {
      if (!filters.brands.includes(p.brandSlug)) return false;
    }
    if (except !== "priceRange" && filters.priceRange) {
      const [min, max] = filters.priceRange;
      if (p.price < min || p.price > max) return false;
    }
    if (except !== "minRating" && filters.minRating !== null) {
      if (p.rating < filters.minRating) return false;
    }
    if (except !== "colors" && filters.colors.length > 0) {
      const hasColor = p.colors.some((c) => filters.colors.includes(c.hex));
      if (!hasColor) return false;
    }
    if (except !== "inStockOnly" && filters.inStockOnly) {
      if (!p.inStock) return false;
    }
    if (except !== "onSaleOnly" && filters.onSaleOnly) {
      if (!p.originalPrice) return false;
    }
    return true;
  });
}

export function applyFilters(
  products: ShopProduct[],
  filters: FilterState,
): ShopProduct[] {
  return applyFiltersExcept(products, filters);
}

export function sortProducts(
  products: ShopProduct[],
  sort: SortOption,
): ShopProduct[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "newest":
      return sorted.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    case "discount": {
      const discountOf = (p: ShopProduct) =>
        p.originalPrice ? (p.originalPrice - p.price) / p.originalPrice : 0;
      return sorted.sort((a, b) => discountOf(b) - discountOf(a));
    }
    case "featured":
    default:
      return sorted;
  }
}

/* ------------------------------------------------------------------ */
/* Facet counts                                                         */
/* ------------------------------------------------------------------ */

export function getCategoryFacets(
  products: ShopProduct[],
  filters: FilterState,
): Facet[] {
  const pool = applyFiltersExcept(products, filters, "categories");
  return CATEGORY_LIST.map(({ value, label }) => ({
    value,
    label,
    count: pool.filter((p) => p.categorySlug === value).length,
  }));
}

export function getBrandFacets(
  products: ShopProduct[],
  filters: FilterState,
): Facet[] {
  const pool = applyFiltersExcept(products, filters, "brands");
  return BRAND_LIST.map(({ value, label }) => ({
    value,
    label,
    count: pool.filter((p) => p.brandSlug === value).length,
  })).filter(
    (facet) => facet.count > 0 || filters.brands.includes(facet.value),
  );
}

export function getResultCount(
  products: ShopProduct[],
  filters: FilterState,
): number {
  return applyFilters(products, filters).length;
}
