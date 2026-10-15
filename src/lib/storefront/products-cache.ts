// src/lib/storefront/products-cache.ts

import "server-only";
import { unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db";
import { listStorefrontProducts } from "@/services/product.service";
import { STOREFRONT_PRODUCTS_TAG } from "./cache-tags";

/* ============================================================
 * Cached fetch — 1h TTL as a safety net. Primary invalidation
 * is on-demand via revalidateTag(STOREFRONT_PRODUCTS_TAG).
 *
 * Matches the pattern in category-nav.ts: connection happens
 * inside the cached function so it only runs on cache misses.
 * ============================================================ */

export const getCachedStorefrontProducts = unstable_cache(
  async () => {
    await connectToDatabase();
    return listStorefrontProducts();
  },
  ["storefront:products"],
  {
    tags: [STOREFRONT_PRODUCTS_TAG],
    revalidate: 60 * 60,
  },
);
