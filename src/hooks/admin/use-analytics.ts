// src/hooks/admin/use-analytics.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";
import type { AnalyticsRange } from "@/lib/admin/analytics";

/* ============================================================
 * Overview
 * ============================================================ */

export function useAnalyticsOverview(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: adminKeys.analytics.overview(range),
    queryFn: ({ signal }) => analyticsApi.overview(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Revenue series
 * ============================================================ */

export function useRevenueSeries(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: adminKeys.analytics.revenue(range),
    queryFn: ({ signal }) => analyticsApi.revenue(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Top products
 * ============================================================ */

export function useTopProducts(range: AnalyticsRange = "30d", limit = 8) {
  return useQuery({
    queryKey: adminKeys.analytics.topProducts(range, limit),
    queryFn: ({ signal }) => analyticsApi.topProducts(range, limit, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Category breakdown
 * ============================================================ */

export function useCategoryBreakdown(range: AnalyticsRange = "30d") {
  return useQuery({
    queryKey: adminKeys.analytics.categories(range),
    queryFn: ({ signal }) => analyticsApi.categories(range, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

/* ============================================================
 * Recent orders
 * ============================================================ */

export function useRecentOrders(limit = 8) {
  return useQuery({
    queryKey: adminKeys.analytics.recentOrders(limit),
    queryFn: ({ signal }) => analyticsApi.recentOrders(limit, signal),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}
