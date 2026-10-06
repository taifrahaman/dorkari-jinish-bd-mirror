// src/hooks/admin/use-product-stats.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { productsApi, type ProductStatsRange } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";

/**
 * Fetch product-level sales stats. Keyed by product id + range,
 * so switching ranges doesn't refetch the whole product.
 */
export function useProductStats(
  id: string | undefined,
  range: ProductStatsRange = "30d",
) {
  return useQuery({
    queryKey: adminKeys.products.stats(id ?? "", range),
    queryFn: ({ signal }) => productsApi.stats(id!, range, signal),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });
}
