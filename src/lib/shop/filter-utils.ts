// src/lib/shop/filter-utils.ts

import type {
  CategoryFacetNode,
  ColorFacet,
  Facet,
  FilterState,
  Locale,
  LocalizedText,
  ProductColor,
  ShopProduct,
  SortOption,
} from "./types";

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
/* Category matching                                                    */
/* ------------------------------------------------------------------ */

/**
 * A product matches a category filter value if:
 *   - its leaf slug equals the value, OR
 *   - its root slug equals the value.
 *
 * This makes a root chip select the whole subtree.
 */
function categoryMatches(product: ShopProduct, slug: string): boolean {
  if (product.categorySlug === slug) return true;
  if (product.mainCategorySlug === slug) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Filtering                                                            */
/* ------------------------------------------------------------------ */

function applyFiltersExcept(
  products: ShopProduct[],
  filters: FilterState,
  except?: keyof FilterState,
): ShopProduct[] {
  return products.filter((p) => {
    if (except !== "categories" && filters.categories.length > 0) {
      if (!filters.categories.some((slug) => categoryMatches(p, slug))) {
        return false;
      }
    }
    if (except !== "brands" && filters.brands.length > 0) {
      if (!p.brandSlug || !filters.brands.includes(p.brandSlug)) return false;
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
/* Facet source lists — derived from the catalog                      */
/* ------------------------------------------------------------------ */

function deriveCategoryTree(products: ShopProduct[]): CategoryFacetNode[] {
  const roots = new Map<
    string,
    {
      label: LocalizedText;
      children: Map<string, LocalizedText>;
    }
  >();

  for (const p of products) {
    const rootSlug = p.mainCategorySlug ?? p.categorySlug;
    const rootLabel = p.mainCategory ?? p.category;
    if (!rootSlug) continue;

    let node = roots.get(rootSlug);
    if (!node) {
      node = { label: rootLabel, children: new Map() };
      roots.set(rootSlug, node);
    }

    if (p.categorySlug && p.categorySlug !== rootSlug) {
      if (!node.children.has(p.categorySlug)) {
        node.children.set(p.categorySlug, p.category);
      }
    }
  }

  return Array.from(roots, ([value, { label, children }]) => ({
    value,
    label,
    count: 0,
    children: children.size
      ? Array.from(children, ([cValue, cLabel]) => ({
          value: cValue,
          label: cLabel,
          count: 0,
        }))
      : undefined,
  }));
}

function deriveBrandList(
  products: ShopProduct[],
): { value: string; label: LocalizedText }[] {
  const seen = new Map<string, LocalizedText>();
  for (const p of products) {
    if (p.brandSlug && p.brand && !seen.has(p.brandSlug)) {
      seen.set(p.brandSlug, p.brand);
    }
  }
  return Array.from(seen, ([value, label]) => ({ value, label }));
}

function deriveColorList(products: ShopProduct[]): ProductColor[] {
  const seen = new Map<string, ProductColor>();
  for (const p of products) {
    for (const c of p.colors) {
      if (!seen.has(c.hex)) seen.set(c.hex, c);
    }
  }
  return Array.from(seen.values());
}

/* ------------------------------------------------------------------ */
/* Facet counts                                                         */
/* ------------------------------------------------------------------ */

export function getCategoryFacets(
  products: ShopProduct[],
  filters: FilterState,
): CategoryFacetNode[] {
  const pool = applyFiltersExcept(products, filters, "categories");

  return deriveCategoryTree(products).map((root) => ({
    ...root,
    count: pool.filter((p) => categoryMatches(p, root.value)).length,
    children: root.children?.map((child) => ({
      ...child,
      count: pool.filter((p) => p.categorySlug === child.value).length,
    })),
  }));
}

export function getBrandFacets(
  products: ShopProduct[],
  filters: FilterState,
): Facet[] {
  const pool = applyFiltersExcept(products, filters, "brands");
  return deriveBrandList(products)
    .map(({ value, label }) => ({
      value,
      label,
      count: pool.filter((p) => p.brandSlug === value).length,
    }))
    .filter((facet) => facet.count > 0 || filters.brands.includes(facet.value));
}

export function getColorFacets(
  products: ShopProduct[],
  filters: FilterState,
): ColorFacet[] {
  const pool = applyFiltersExcept(products, filters, "colors");
  return deriveColorList(products).map((color) => ({
    hex: color.hex,
    name: color.name,
    count: pool.filter((p) => p.colors.some((c) => c.hex === color.hex)).length,
  }));
}

export function getResultCount(
  products: ShopProduct[],
  filters: FilterState,
): number {
  return applyFilters(products, filters).length;
}

/**
 * Top N root-category slugs by product count, computed from the raw
 * catalog. Stable across filter changes — used by FilterBar for the
 * horizontal chip strip.
 */
export function getTopCategorySlugs(
  products: ShopProduct[],
  limit = 6,
): string[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const slug = p.mainCategorySlug ?? p.categorySlug;
    if (!slug) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
}

/**
 * Locate a category facet (root or child) by value.
 */
export function findCategoryFacet(
  nodes: CategoryFacetNode[],
  value: string,
): Facet | undefined {
  for (const node of nodes) {
    if (node.value === value) return node;
    const child = node.children?.find((c) => c.value === value);
    if (child) return child;
  }
  return undefined;
}
