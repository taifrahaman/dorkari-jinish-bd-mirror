// src/hooks/use-shop-catalog.ts

"use client";

import { useEffect, useState } from "react";

import { fetchShopCatalog } from "@/lib/shop/mock-api";
import type { ShopProduct } from "@/lib/shop/types";

/**
 * Loads the entire catalog once on mount. `products === null` means "not
 * loaded yet"; the array (possibly empty) means "loaded".
 *
 * Filtering and sorting happen client-side downstream — this hook only
 * owns the fetch. When the backend lands, swap the body for a real fetch;
 * the return shape stays the same.
 */
export function useShopCatalog() {
  const [products, setProducts] = useState<ShopProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchShopCatalog().then((data) => {
      if (!cancelled) setProducts(data);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    products: products ?? [],
    isLoading: products === null,
    total: products?.length ?? 0,
  };
}
