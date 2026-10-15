// src/lib/storefront/products-cache.ts

import "server-only";
import { unstable_cache } from "next/cache";

import { connectToDatabase } from "@/lib/db";
import {
  getRelatedProducts,
  getStorefrontProductBySlug,
  listStorefrontProducts,
} from "@/services/product.service";
import { listProductFaqs } from "@/services/faq.service";
import { listProductReviews } from "@/services/review.service";
import { getStorefrontSettings } from "@/services/setting.service";
import {
  STOREFRONT_FAQS_TAG,
  STOREFRONT_PRODUCTS_TAG,
  STOREFRONT_REVIEWS_TAG,
  STOREFRONT_SETTINGS_TAG,
} from "./cache-tags";

/* ============================================================
 * Product list — the shop grid.
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

/* ============================================================
 * Single product — keyed by slug. Shares the products tag so an
 * admin product write invalidates both the grid and every detail.
 * ============================================================ */

export const getCachedStorefrontProductBySlug = unstable_cache(
  async (slug: string) => {
    await connectToDatabase();
    return getStorefrontProductBySlug(slug);
  },
  ["storefront:product"],
  {
    tags: [STOREFRONT_PRODUCTS_TAG],
    revalidate: 60 * 60,
  },
);

/* ============================================================
 * FAQs — keyed by product id.
 * ============================================================ */

export const getCachedStorefrontFaqs = unstable_cache(
  async (productId: string) => {
    await connectToDatabase();
    return listProductFaqs(productId);
  },
  ["storefront:faqs"],
  {
    tags: [STOREFRONT_FAQS_TAG],
    revalidate: 60 * 60,
  },
);

/* ============================================================
 * Reviews — keyed by product id. Only approved reviews.
 * ============================================================ */

export const getCachedStorefrontReviews = unstable_cache(
  async (productId: string) => {
    await connectToDatabase();
    return listProductReviews(productId);
  },
  ["storefront:reviews"],
  {
    tags: [STOREFRONT_REVIEWS_TAG],
    revalidate: 60 * 60,
  },
);

/* ============================================================
 * Settings — singleton storefront messaging.
 * ============================================================ */

export const getCachedStorefrontSettings = unstable_cache(
  async () => {
    await connectToDatabase();
    return getStorefrontSettings();
  },
  ["storefront:settings"],
  {
    tags: [STOREFRONT_SETTINGS_TAG],
    revalidate: 60 * 60,
  },
);

/* ============================================================
 * Related products — keyed by (slug, limit). Shares the products
 * tag so an admin product write invalidates everything on the
 * detail page in a single shot.
 * ============================================================ */

export const getCachedRelatedProducts = unstable_cache(
  async (slug: string, limit: number) => {
    await connectToDatabase();
    return getRelatedProducts(slug, limit);
  },
  ["storefront:related"],
  {
    tags: [STOREFRONT_PRODUCTS_TAG],
    revalidate: 60 * 60,
  },
);
