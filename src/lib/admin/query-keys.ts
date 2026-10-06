// src/lib/admin/query-keys.ts

import type {
  CategoryListQuery,
  CategorySuggestQuery,
} from "@/lib/validations/category.schema";
import type { ProductListQuery } from "@/lib/validations/product.schema";
import type { ColorListQuery } from "@/lib/validations/color.schema";

/* ============================================================
 * Query key factory
 * ============================================================ */

export const adminKeys = {
  /* ----------------------------------------------------------
   * Root
   * ---------------------------------------------------------- */
  all: ["admin"] as const,

  /* ----------------------------------------------------------
   * Products
   * ---------------------------------------------------------- */
  products: {
    all: () => [...adminKeys.all, "products"] as const,

    lists: () => [...adminKeys.products.all(), "list"] as const,

    list: (params: Partial<ProductListQuery> = {}) =>
      [...adminKeys.products.lists(), normalizeParams(params)] as const,

    details: () => [...adminKeys.products.all(), "detail"] as const,

    detail: (id: string) => [...adminKeys.products.details(), id] as const,

    suggest: (q: string) =>
      [...adminKeys.products.all(), "suggest", q] as const,

    import: (sessionId: string) =>
      [...adminKeys.products.all(), "import", sessionId] as const,

    stats: (id: string, range: string) =>
      [...adminKeys.products.detail(id), "stats", range] as const,

    specSuggestions: (q: string, category?: string) =>
      [
        ...adminKeys.products.all(),
        "spec-suggestions",
        { q, category: category ?? null },
      ] as const,
  },

  /* ----------------------------------------------------------
   * Categories
   * ---------------------------------------------------------- */
  categories: {
    all: () => [...adminKeys.all, "categories"] as const,

    lists: () => [...adminKeys.categories.all(), "list"] as const,

    list: (params: Partial<CategoryListQuery> = {}) =>
      [...adminKeys.categories.lists(), normalizeParams(params)] as const,

    details: () => [...adminKeys.categories.all(), "detail"] as const,

    detail: (id: string) => [...adminKeys.categories.details(), id] as const,

    tree: () => [...adminKeys.categories.all(), "tree"] as const,

    suggest: (params: Partial<CategorySuggestQuery>) =>
      [
        ...adminKeys.categories.all(),
        "suggest",
        normalizeParams(params),
      ] as const,
  },

  /* ----------------------------------------------------------
   * Colors
   * ---------------------------------------------------------- */
  colors: {
    all: () => [...adminKeys.all, "colors"] as const,

    lists: () => [...adminKeys.colors.all(), "list"] as const,

    list: (params: Partial<ColorListQuery> = {}) =>
      [...adminKeys.colors.lists(), normalizeParams(params)] as const,

    details: () => [...adminKeys.colors.all(), "detail"] as const,

    detail: (id: string) => [...adminKeys.colors.details(), id] as const,

    suggest: (q: string, limit: number) =>
      [...adminKeys.colors.all(), "suggest", { q, limit }] as const,
  },

  /* ----------------------------------------------------------
   * Dashboard
   * ---------------------------------------------------------- */
  dashboard: {
    all: () => [...adminKeys.all, "dashboard"] as const,
    stats: () => [...adminKeys.dashboard.all(), "stats"] as const,
    recentOrders: () =>
      [...adminKeys.dashboard.all(), "recent-orders"] as const,
  },
} as const;

/* ============================================================
 * Helpers
 * ============================================================ */

function normalizeParams<T extends Record<string, unknown>>(
  params: T,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys = Object.keys(params).sort();

  for (const key of keys) {
    const value = params[key];
    if (value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }

  return out;
}

/* ============================================================
 * Type helper
 * ============================================================ */

export type AdminKeys = typeof adminKeys;
