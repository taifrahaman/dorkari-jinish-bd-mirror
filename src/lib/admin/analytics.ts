// src/lib/admin/analytics.ts

/* ============================================================
 * Shared types & constants for analytics
 *
 * Client-safe — no server imports. Both the dashboard UI and
 * the server service import from here.
 * ============================================================ */

export type AnalyticsRange = "today" | "7d" | "30d" | "90d" | "1y" | "all";

export type AnalyticsRangeOption = {
  value: AnalyticsRange;
  label: string;
  shortLabel: string;
};

export const ANALYTICS_RANGES: AnalyticsRangeOption[] = [
  { value: "today", label: "Today", shortLabel: "Today" },
  { value: "7d", label: "Last 7 days", shortLabel: "7d" },
  { value: "30d", label: "Last 30 days", shortLabel: "30d" },
  { value: "90d", label: "Last 90 days", shortLabel: "90d" },
  { value: "1y", label: "Last 12 months", shortLabel: "1y" },
  { value: "all", label: "All time", shortLabel: "All" },
];

/* ============================================================
 * Overview
 * ============================================================ */

export type KpiBundle = {
  orders: number;
  revenue: number;
  cost: number;
  profit: number;
  avgOrderValue: number;
};

export type KpiChange = {
  orders: number | null;
  revenue: number | null;
  profit: number | null;
  avgOrderValue: number | null;
};

export type AnalyticsOverview = {
  range: AnalyticsRange;
  from: string | null;
  to: string;
  current: KpiBundle;
  previous: KpiBundle | null;
  change: KpiChange;
  /** Number of active + low-stock products (unrelated to range). */
  catalog: {
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  /** Pending orders awaiting fulfilment. */
  pending: {
    pendingOrders: number;
    unpaidOrders: number;
  };
};

/* ============================================================
 * Revenue series
 * ============================================================ */

export type RevenuePoint = {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
};

export type RevenueSeriesGranularity =
  "hourly" | "daily" | "weekly" | "monthly";

export type RevenueSeries = {
  range: AnalyticsRange;
  from: string | null;
  to: string;
  granularity: RevenueSeriesGranularity;
  points: RevenuePoint[];
  totals: {
    revenue: number;
    profit: number;
    orders: number;
  };
};

/* ============================================================
 * Top products
 * ============================================================ */

export type TopProductRow = {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  unitsSold: number;
  revenue: number;
  profit: number;
};

export type TopProductsResult = {
  range: AnalyticsRange;
  rows: TopProductRow[];
};

/* ============================================================
 * Category breakdown
 * ============================================================ */

export type CategoryBreakdownRow = {
  categoryId: string;
  name: string;
  unitsSold: number;
  revenue: number;
  profit: number;
  /** 0–1 share of total revenue in this range. */
  share: number;
};

export type CategoryBreakdownResult = {
  range: AnalyticsRange;
  rows: CategoryBreakdownRow[];
  totalRevenue: number;
};

/* ============================================================
 * Recent orders
 * ============================================================ */

export type RecentOrderRow = {
  orderId: string;
  orderNumber: string;
  channel: "online" | "pos" | "phone" | "walk-in";
  status: string;
  paymentStatus: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  orderDate: string;
};

export type RecentOrdersResult = {
  rows: RecentOrderRow[];
};
