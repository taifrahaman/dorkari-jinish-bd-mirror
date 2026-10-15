// src/lib/admin/reports.ts

/* ============================================================
 * Shared types & constants for reports
 *
 * Client-safe — no server imports.
 * ============================================================ */

export type ReportRange = "today" | "7d" | "30d" | "90d" | "1y" | "all";

export type ReportRangeOption = {
  value: ReportRange;
  label: string;
};

export const REPORT_RANGES: ReportRangeOption[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

/* ============================================================
 * Profit report
 * ============================================================ */

export type ProfitReportBucket = {
  /** Bucket key — "2026-10-06" for daily, "2026-10" for monthly. */
  date: string;
  orders: number;
  revenue: number;
  cost: number;
  profit: number;
  /** Profit / Revenue, 0–1. Null when revenue is 0. */
  margin: number | null;
};

export type ProfitReportProductRow = {
  productId: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number | null;
};

export type ProfitReport = {
  range: ReportRange;
  from: string | null;
  to: string;
  granularity: "daily" | "weekly" | "monthly";

  totals: {
    orders: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number | null;
    averageOrderValue: number;
    averageProfitPerOrder: number;
  };

  buckets: ProfitReportBucket[];

  topProducts: ProfitReportProductRow[];
  worstProducts: ProfitReportProductRow[];
};

/* ============================================================
 * Inventory report
 * ============================================================ */

export type InventoryStatus = "all" | "in" | "low" | "out";

export type InventoryRow = {
  productId: string;
  name: string;
  sku: string;
  categoryName: string;
  stock: number;
  lowStockThreshold: number;
  /** Stock × costPrice. Null when costPrice is unset. */
  costValue: number | null;
  /** Stock × price. */
  retailValue: number;
  /** retailValue − costValue. Null when costValue is null. */
  potentialProfit: number | null;
};

export type InventoryReport = {
  status: InventoryStatus;
  generatedAt: string;

  summary: {
    totalProducts: number;
    inStockCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalUnits: number;
    totalCostValue: number;
    totalRetailValue: number;
    totalPotentialProfit: number;
  };

  rows: InventoryRow[];
};

export const INVENTORY_STATUS_OPTIONS: Array<{
  value: InventoryStatus;
  label: string;
}> = [
  { value: "all", label: "All products" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
];

/* ============================================================
 * Inventory sort
 * ============================================================ */

export type InventorySort =
  | "stock-asc"
  | "stock-desc"
  | "retail-desc"
  | "retail-asc"
  | "profit-desc"
  | "name-asc";

export const INVENTORY_SORT_OPTIONS: Array<{
  value: InventorySort;
  label: string;
}> = [
  { value: "stock-asc", label: "Stock: low → high" },
  { value: "stock-desc", label: "Stock: high → low" },
  { value: "retail-desc", label: "Retail value: high → low" },
  { value: "retail-asc", label: "Retail value: low → high" },
  { value: "profit-desc", label: "Potential profit: high → low" },
  { value: "name-asc", label: "Name: A → Z" },
];

/* ============================================================
 * VAT report
 * ============================================================ */

export type VatReportBucket = {
  date: string;
  orderCount: number;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
};

export type VatReport = {
  range: ReportRange;
  from: string | null;
  to: string;
  /** Global VAT switch — from settings. */
  enabled: boolean;
  /** Configured default rate — from settings. */
  defaultRate: number;
  /** True when prices include VAT (tax is back-computed). */
  inclusive: boolean;

  totals: {
    orderCount: number;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
  };

  buckets: VatReportBucket[];
};
