// src/lib/shop/adapter.ts

import type { StorefrontProduct } from "@/lib/storefront/product-mapper";
import type { Locale, ShopProduct } from "./types";

const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

/**
 * Convert one public storefront product into the shape the shop UI
 * consumes. Pure — no fetch, no side effects. All derivations
 * (inStock, image fallback, href, main-category fallback) live here.
 */
export function toShopProduct(
  product: StorefrontProduct,
  locale: Locale,
): ShopProduct {
  const primaryImage = product.images[0];
  const main = product.mainCategory ?? product.category;

  return {
    id: product.id,
    name: product.name,
    brand: product.brand?.name,
    brandSlug: product.brand?.slug,
    category: product.category.name,
    categorySlug: product.category.slug,
    mainCategory: main.name,
    mainCategorySlug: main.slug,
    price: product.price,
    originalPrice: product.compareAtPrice ?? undefined,
    rating: product.averageRating,
    colors: product.colors.map((c) => ({
      hex: c.hex,
      name: c.name ?? undefined,
    })),
    image: primaryImage?.url || PLACEHOLDER_IMAGE,
    href: `/product/${product.slug}`,
    inStock: product.inStock,
    createdAt: product.createdAt,
    badges: [],
  };
}

/**
 * Batch version — same mapper, over an array.
 */
export function toShopProducts(
  products: StorefrontProduct[],
  locale: Locale,
): ShopProduct[] {
  return products.map((p) => toShopProduct(p, locale));
}
