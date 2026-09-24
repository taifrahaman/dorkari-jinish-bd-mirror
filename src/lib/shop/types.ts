// src/lib/shop/types.ts

export type Locale = "en" | "bn";

export type LocalizedText = {
  en: string;
  bn: string;
};

export type ProductColor = {
  hex: string;
  name?: LocalizedText;
};

export type ShopProduct = {
  id: string;
  name: LocalizedText;
  brand: LocalizedText;
  brandSlug: string;
  category: LocalizedText;
  categorySlug: string;
  tag?: LocalizedText;
  price: number;
  originalPrice?: number;
  rating: number;
  colors: ProductColor[];
  image: string;
  href: string;
  inStock: boolean;
  /** ISO date string — used for the "Newest" sort. */
  createdAt: string;
};

export type SortOption =
  "featured" | "price-asc" | "price-desc" | "rating" | "newest" | "discount";

export type PriceRange = [number, number];

export type FilterState = {
  categories: string[]; // categorySlug values
  brands: string[]; // brandSlug values
  priceRange: PriceRange | null;
  minRating: number | null;
  colors: string[]; // hex values
  inStockOnly: boolean;
  onSaleOnly: boolean;
};

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  brands: [],
  priceRange: null,
  minRating: null,
  colors: [],
  inStockOnly: false,
  onSaleOnly: false,
};

/** One selectable value inside a filter section, with a live result count. */
export type Facet = {
  value: string;
  label: LocalizedText;
  count: number;
};

export function isFilterActive(filters: FilterState): boolean {
  return (
    filters.categories.length > 0 ||
    filters.brands.length > 0 ||
    filters.priceRange !== null ||
    filters.minRating !== null ||
    filters.colors.length > 0 ||
    filters.inStockOnly ||
    filters.onSaleOnly
  );
}

export function countActiveFilters(filters: FilterState): number {
  return (
    filters.categories.length +
    filters.brands.length +
    filters.colors.length +
    (filters.priceRange ? 1 : 0) +
    (filters.minRating !== null ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.onSaleOnly ? 1 : 0)
  );
}
