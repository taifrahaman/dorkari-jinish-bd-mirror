// src/hooks/admin/use-spec-suggestions.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { productsApi, type SpecSuggestion } from "@/lib/admin/api";
import { adminKeys } from "@/lib/admin/query-keys";

export type UseSpecSuggestionsResult = {
  data: SpecSuggestion[];
  isLoading: boolean;
  isError: boolean;
};

/**
 * Fetch spec key suggestions from existing products.
 *
 * Debounce `q` in the caller (250ms is good). When `q` is empty,
 * the API returns the most-used keys overall.
 */
export function useSpecSuggestions(q: string, categoryId?: string) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: adminKeys.products.specSuggestions(trimmed, categoryId),
    queryFn: ({ signal }) =>
      productsApi.specSuggestions(trimmed, categoryId, signal),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
    // Always fetch — even with empty q — so we can show "popular keys"
    enabled: true,
  });
}
