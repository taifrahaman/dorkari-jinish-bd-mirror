// src/lib/admin/product-stats.ts

export type ProductStatsRange = "7d" | "30d" | "90d" | "1y" | "all";

export type ProductStatsRangeOption = {
  value: ProductStatsRange;
  label: string;
};

export const PRODUCT_STATS_RANGES: ProductStatsRangeOption[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last 12 months" },
  { value: "all", label: "All time" },
];
