// src/lib/admin/query-keys.ts

import type {
  CategoryListQuery,
  CategorySuggestQuery,
} from "@/lib/validations/category.schema";
import type { ProductListQuery } from "@/lib/validations/product.schema";
import type { ColorListQuery } from "@/lib/validations/color.schema";
import type { OrderListQuery } from "@/lib/validations/order.schema";
import type { AnalyticsRange } from "@/lib/admin/analytics";
import type { CustomerListQuery } from "@/lib/validations/customer.schema";
import type { BrandListQuery } from "@/lib/validations/brand.schema";

export const adminKeys = {
  all: ["admin"] as const,

  products: {
    all: () => [...adminKeys.all, "products"] as const,
    lists: () => [...adminKeys.products.all(), "list"] as const,
    list: (params: Partial<ProductListQuery> = {}) =>
      [...adminKeys.products.lists(), normalizeParams(params)] as const,
    details: () => [...adminKeys.products.all(), "detail"] as const,
    detail: (id: string) => [...adminKeys.products.details(), id] as const,
    stats: (id: string, range: string) =>
      [...adminKeys.products.detail(id), "stats", range] as const,
    suggest: (q: string) =>
      [...adminKeys.products.all(), "suggest", q] as const,
    import: (sessionId: string) =>
      [...adminKeys.products.all(), "import", sessionId] as const,
    specSuggestions: (q: string, category?: string) =>
      [
        ...adminKeys.products.all(),
        "spec-suggestions",
        { q, category: category ?? null },
      ] as const,
  },

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
  media: {
    all: () => [...adminKeys.all, "media"] as const,
    list: (params: unknown) =>
      [...adminKeys.all, "media", "list", params] as const,
    usage: (ids: string[]) =>
      [...adminKeys.all, "media", "usage", ids] as const,
  },

  brands: {
    all: () => [...adminKeys.all, "brands"] as const,
    lists: () => [...adminKeys.brands.all(), "list"] as const,
    list: (params: Partial<BrandListQuery> = {}) =>
      [...adminKeys.brands.lists(), normalizeParams(params)] as const,
    details: () => [...adminKeys.brands.all(), "detail"] as const,
    detail: (id: string) => [...adminKeys.brands.details(), id] as const,
    suggest: (q: string, limit: number) =>
      [...adminKeys.brands.all(), "suggest", { q, limit }] as const,
  },

  orders: {
    all: () => [...adminKeys.all, "orders"] as const,
    lists: () => [...adminKeys.orders.all(), "list"] as const,
    list: (params: Partial<OrderListQuery> = {}) =>
      [...adminKeys.orders.lists(), normalizeParams(params)] as const,
    details: () => [...adminKeys.orders.all(), "detail"] as const,
    detail: (id: string) => [...adminKeys.orders.details(), id] as const,
    stats: (range: string) =>
      [...adminKeys.orders.all(), "stats", range] as const,
  },

  analytics: {
    all: () => [...adminKeys.all, "analytics"] as const,
    overview: (range: AnalyticsRange) =>
      [...adminKeys.analytics.all(), "overview", range] as const,
    revenue: (range: AnalyticsRange) =>
      [...adminKeys.analytics.all(), "revenue", range] as const,
    topProducts: (range: AnalyticsRange, limit: number) =>
      [...adminKeys.analytics.all(), "top-products", { range, limit }] as const,
    categories: (range: AnalyticsRange) =>
      [...adminKeys.analytics.all(), "categories", range] as const,
    recentOrders: (limit: number) =>
      [...adminKeys.analytics.all(), "recent-orders", limit] as const,
  },

  settings: {
    all: () => [...adminKeys.all, "settings"] as const,
  },

  dashboard: {
    all: () => [...adminKeys.all, "dashboard"] as const,
    stats: () => [...adminKeys.dashboard.all(), "stats"] as const,
    recentOrders: () =>
      [...adminKeys.dashboard.all(), "recent-orders"] as const,
  },

  reports: {
    all: () => [...adminKeys.all, "reports"] as const,
    profit: (range: string) =>
      [...adminKeys.reports.all(), "profit", range] as const,
    inventory: (status: string, sort: string) =>
      [...adminKeys.reports.all(), "inventory", status, sort] as const,
    vat: (range: string) => [...adminKeys.reports.all(), "vat", range] as const,
  },

  customers: {
    all: () => [...adminKeys.all, "customers"] as const,

    lists: () => [...adminKeys.customers.all(), "list"] as const,

    list: (params: Partial<CustomerListQuery> = {}) =>
      [...adminKeys.customers.lists(), normalizeParams(params)] as const,

    details: () => [...adminKeys.customers.all(), "detail"] as const,

    detail: (id: string) => [...adminKeys.customers.details(), id] as const,

    stats: (id: string) =>
      [...adminKeys.customers.detail(id), "stats"] as const,

    suggest: (q: string, limit: number) =>
      [...adminKeys.customers.all(), "suggest", { q, limit }] as const,
  },
} as const;

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

export type AdminKeys = typeof adminKeys;
