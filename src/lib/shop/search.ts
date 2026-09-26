// src/lib/shop/search.ts

import type { ShopProduct } from "./types";

// Adjust to match ShopProduct. Values can be strings or { en, bn } records.
const SEARCH_KEYS = [
  "name",
  "title",
  "brand",
  "category",
  "model",
  "description",
] as const;

function flatten(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).filter(
      (v): v is string => typeof v === "string",
    );
  }
  return [];
}

export function matchesQuery(product: ShopProduct, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const record = product as unknown as Record<string, unknown>;
  const haystack = SEARCH_KEYS.flatMap((key) => flatten(record[key]))
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}
