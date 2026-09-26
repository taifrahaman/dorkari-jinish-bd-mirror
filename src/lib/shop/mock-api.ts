// src/lib/shop/mock-api.ts
import type { FilterState, ShopProduct, SortOption } from "./types";
import { DUMMY_PRODUCTS } from "./dummy-products";
import { applyFilters, sortProducts } from "./filter-utils";
import { matchesQuery } from "./search";

export const SIMULATED_LATENCY_MS = 800;
export const PAGE_SIZE = 24;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchShopCatalog(
  delayMs: number = SIMULATED_LATENCY_MS,
): Promise<ShopProduct[]> {
  await wait(delayMs);
  return DUMMY_PRODUCTS;
}

export type ShopProductsParams = {
  page?: number; // 0-based
  pageSize?: number;
  filters: FilterState;
  sort: SortOption;
  query?: string;
};

export type ShopProductsPage = {
  items: ShopProduct[];
  /** Matches across ALL pages, for the "48 results" label. */
  total: number;
  page: number;
  /** null when this is the last page. */
  nextPage: number | null;
};

export async function fetchShopProducts(
  {
    page = 0,
    pageSize = PAGE_SIZE,
    filters,
    sort,
    query = "",
  }: ShopProductsParams,
  delayMs: number = SIMULATED_LATENCY_MS,
): Promise<ShopProductsPage> {
  await wait(delayMs);

  const matches = sortProducts(
    applyFilters(DUMMY_PRODUCTS, filters).filter((p) => matchesQuery(p, query)),
    sort,
  );

  const start = page * pageSize;
  return {
    items: matches.slice(start, start + pageSize),
    total: matches.length,
    page,
    nextPage: start + pageSize < matches.length ? page + 1 : null,
  };
}
