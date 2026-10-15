// src/hooks/admin/use-reports.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type {
  InventorySort,
  InventoryStatus,
  ReportRange,
} from "@/lib/admin/reports";

/* ============================================================
 * Profit report
 * ============================================================ */

export function useProfitReport(range: ReportRange = "30d") {
  return useQuery({
    queryKey: adminKeys.reports.profit(range),
    queryFn: ({ signal }) => reportsApi.profit(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Inventory report
 * ============================================================ */

export function useInventoryReport(
  status: InventoryStatus = "all",
  sort: InventorySort = "stock-asc",
) {
  return useQuery({
    queryKey: adminKeys.reports.inventory(status, sort),
    queryFn: ({ signal }) => reportsApi.inventory(status, sort, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * VAT report
 * ============================================================ */

export function useVatReport(range: ReportRange = "30d") {
  return useQuery({
    queryKey: adminKeys.reports.vat(range),
    queryFn: ({ signal }) => reportsApi.vat(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
