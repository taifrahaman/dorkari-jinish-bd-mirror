// src/lib/product/types.ts

import type { Locale, LocalizedText } from "@/lib/shop/types";

/**
 * Client-side product-detail types.
 *
 * These re-export the storefront DTO shapes so components don't have to
 * know the difference between the server mapper output and what they render.
 */

export type {
  StorefrontProductDetail,
  StorefrontProduct,
  StorefrontLocalizedName,
} from "@/lib/storefront/product-mapper";

export type { StorefrontFaq } from "@/lib/storefront/faq-mapper";

export type { StorefrontReview } from "@/lib/storefront/review-mapper";

export type { Locale, LocalizedText };
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type DeliveryConfig = {
  fee: number;
  freeShippingThreshold: number;
  freeShippingEnabled: boolean;
};

export type StorefrontSettings = {
  deliveryEstimate: LocalizedText;
  returnPolicy: LocalizedText;
  delivery: DeliveryConfig;
};

/** Full payload returned by /api/storefront/products/[slug]. */
export type ProductDetailResponse = {
  product: import("@/lib/storefront/product-mapper").StorefrontProductDetail;
  faqs: import("@/lib/storefront/faq-mapper").StorefrontFaq[];
  reviews: import("@/lib/storefront/review-mapper").StorefrontReview[];
  settings: StorefrontSettings;
  related: import("@/lib/storefront/product-mapper").StorefrontProduct[];
};
