// src/hooks/use-shop-catalog.ts

"use client";

import { useEffect, useState } from "react";

import { toShopProducts } from "@/lib/shop/adapter";
import type { Locale, ShopProduct } from "@/lib/shop/types";
import type { StorefrontProduct } from "@/lib/storefront/product-mapper";

type ApiResponse = {
  success: boolean;
  data: StorefrontProduct[];
};

/**
 * Loads the entire active catalog once, adapts it into the ShopProduct
 * shape, and returns it. `products === null` means "not loaded yet";
 * the array (possibly empty) means "loaded".
 *
 * Filtering and sorting happen client-side downstream — this hook only
 * owns the fetch + adapt.
 */
export function useShopCatalog(locale: Locale) {
  const [products, setProducts] = useState<ShopProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/storefront/products");

        if (!res.ok) {
          throw new Error(`Failed to load products: ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;

        if (cancelled) return;

        setProducts(toShopProducts(json.data, locale));
      } catch (err) {
        if (cancelled) return;

        // TODO(phase-later): surface an error state to the UI.
        // For now, log and fall back to an empty catalog so the
        // page renders its EmptyState instead of a stuck skeleton.
        console.error("[useShopCatalog] fetch failed:", err);
        setProducts([]);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return {
    products: products ?? [],
    isLoading: products === null,
    total: products?.length ?? 0,
  };
}
